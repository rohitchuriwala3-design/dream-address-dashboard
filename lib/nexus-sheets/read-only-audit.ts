import { google } from "googleapis";

const REQUIRED_TABS = [
  { name: "Projects", keyHeaders: [["project id", "projectid"]], scanThroughColumn: "B" },
  { name: "Clients", keyHeaders: [["client id", "clientid"]], scanThroughColumn: "B" },
  { name: "Accounts", keyHeaders: [["account id", "accountid"]], scanThroughColumn: "B" },
  { name: "Quotations", keyHeaders: [["quotation id", "quote id", "quotationid"]], scanThroughColumn: "H" },
  { name: "Quotation Lines", keyHeaders: [["quote id", "quotation id"], ["revision"], ["line no", "line no.", "line number"]], scanThroughColumn: "G" },
  { name: "Invoices", keyHeaders: [["invoice id", "invoiceid"]], scanThroughColumn: "H" },
  { name: "Invoice Lines", keyHeaders: [["invoice id", "invoiceid"], ["section"], ["line no", "line no.", "line number"]], scanThroughColumn: "E" },
  { name: "Transactions", keyHeaders: [["transaction id", "transactionid"]], scanThroughColumn: "C" },
  { name: "Expenses", keyHeaders: [["expense id", "expenseid"]], scanThroughColumn: "F" },
  { name: "Vendors", keyHeaders: [["vendor id", "vendorid"]], scanThroughColumn: "B" },
  { name: "Payment Allocations", keyHeaders: [["allocation id", "payment allocation id", "allocationid"]], scanThroughColumn: "C" },
] as const;

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
const MASTER_SPREADSHEET_ID = "1oJP7fqIGl48cUPq76XOogPQ-B5IfHHESt0JCTVpIW5o";
const HEADER_SCAN_ROWS = 4;
function normalizePrivateKey(value: string | undefined) {
  const key = value?.trim().replace(/\\n/g, "\n");
  return key && /-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(key) ? key : undefined;
}

function getServiceAccountCredentials() {
  const envEmail = process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL?.trim();
  const envKey = normalizePrivateKey(process.env.NEXUS360_SHEETS_PRIVATE_KEY);
  return { email: envEmail, key: envKey };
}

export interface SheetAuditIssue {
  tab: string;
  code: "MISSING_TAB" | "HEADER_NOT_FOUND" | "DUPLICATE_ID" | "MISSING_ID" | "SCAN_LIMIT";
  count: number;
  message: string;
}

export interface SheetAuditResult {
  spreadsheetTitle: string;
  spreadsheetId: string;
  tabsScanned: number;
  rowsScanned: number;
  issues: SheetAuditIssue[];
  tabs: Array<{ name: string; rowsScanned: number; keyHeaders: string[]; idColumns: string[]; duplicateIds: number; blankIds: number; keys?: string[] }>;
}

export function getNexusSheetsConfiguration() {
  const { email, key } = getServiceAccountCredentials();
  return {
    spreadsheetId: process.env.NEXUS360_SHEETS_SPREADSHEET_ID?.trim() || MASTER_SPREADSHEET_ID,
    configured: Boolean(email && key),
    missing: [
      ...(!email ? ["NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL"] : []),
      ...(!key ? ["NEXUS360_SHEETS_PRIVATE_KEY"] : []),
    ],
  };
}

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}

function rowHasContent(row: unknown[]) {
  return row.some((cell) => {
    const value = String(cell ?? "").trim();
    return value !== "" && !value.startsWith("=");
  });
}

export async function auditNexusMasterSheet(options: { includeKeys?: boolean } = {}): Promise<SheetAuditResult> {
  const config = getNexusSheetsConfiguration();
  if (!config.configured) throw new Error(`Google Sheets service account is not configured: ${config.missing.join(", ")}`);

  const credentials = getServiceAccountCredentials();
  const auth = new google.auth.JWT({
    email: credentials.email,
    key: credentials.key,
    scopes: SCOPES,
  });
  const sheets = google.sheets({ version: "v4", auth });
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: config.spreadsheetId,
    fields: "properties(title),sheets(properties(title,gridProperties(rowCount)))",
  });
  const sheetByName = new Map((metadata.data.sheets ?? []).map((sheet) => [sheet.properties?.title ?? "", sheet.properties]));
  const issues: SheetAuditIssue[] = [];
  const tabs: SheetAuditResult["tabs"] = [];
  let rowsScanned = 0;

  for (const definition of REQUIRED_TABS) {
    const properties = sheetByName.get(definition.name);
    if (!properties) {
      issues.push({ tab: definition.name, code: "MISSING_TAB", count: 1, message: `Required source tab “${definition.name}” is missing.` });
      continue;
    }
    const maxRows = Math.max(20, Math.min(properties.gridProperties?.rowCount ?? 1000, 2000));
    const safeName = definition.name.replace(/'/g, "''");
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `'${safeName}'!A1:Z${HEADER_SCAN_ROWS}`,
      valueRenderOption: "FORMULA",
    });
    const headerGrid = headerResponse.data.values ?? [];
    const headerLimit = Math.min(HEADER_SCAN_ROWS, headerGrid.length);
    let headerIndex = -1;
    let keyColumns: number[] = [];
    for (let rowIndex = 0; rowIndex < headerLimit; rowIndex++) {
      const normalized = (headerGrid[rowIndex] ?? []).map(normalizeHeader);
      const matches = definition.keyHeaders.map((aliases) => normalized.findIndex((header) => (aliases as readonly string[]).includes(header)));
      if (matches.every((index) => index >= 0)) { headerIndex = rowIndex; keyColumns = matches; break; }
    }
    if (headerIndex < 0 || keyColumns.length === 0) {
      issues.push({ tab: definition.name, code: "HEADER_NOT_FOUND", count: 1, message: `Could not locate the required stable-ID or composite-key headers in the observed four-row header block of “${definition.name}”.` });
      tabs.push({ name: definition.name, rowsScanned: 0, keyHeaders: [], idColumns: [], duplicateIds: 0, blankIds: 0, ...(options.includeKeys ? { keys: [] } : {}) });
      continue;
    }

    const firstDataRow = headerIndex + 2;
    const dataResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: `'${safeName}'!A${firstDataRow}:${definition.scanThroughColumn}${maxRows}`,
      valueRenderOption: "FORMULA",
    });
    const grid = dataResponse.data.values ?? [];
    const seen = new Set<string>();
    let duplicateIds = 0;
    let blankIds = 0;
    let dataRows = 0;
    const rowKeys: string[] = [];
    for (const row of grid) {
      if (!rowHasContent(row)) continue;
      dataRows++;
      // Header normalization is case-insensitive; record identifiers are preserved verbatim.
      const keyParts = keyColumns.map((column) => {
        const value = String(row[column] ?? "").trim();
        return value.startsWith("=") ? "" : value;
      });
      if (keyParts.some((part) => !part)) { blankIds++; continue; }
      const normalizedId = keyParts.join("|");
      rowKeys.push(normalizedId);
      if (seen.has(normalizedId)) duplicateIds++;
      else seen.add(normalizedId);
    }
    rowsScanned += dataRows;
    if (duplicateIds) issues.push({ tab: definition.name, code: "DUPLICATE_ID", count: duplicateIds, message: `Found ${duplicateIds} repeated stable keys in “${definition.name}”.` });
    if (blankIds) issues.push({ tab: definition.name, code: "MISSING_ID", count: blankIds, message: `Found ${blankIds} populated rows without a complete stable key in “${definition.name}”.` });
    if ((properties.gridProperties?.rowCount ?? 0) > 2000) issues.push({ tab: definition.name, code: "SCAN_LIMIT", count: 1, message: `“${definition.name}” exceeds the 2,000-row safety limit; only the first 2,000 rows were scanned.` });
    const keyHeaders = keyColumns.map((column) => String(headerGrid[headerIndex]?.[column] ?? "").trim());
    tabs.push({ name: definition.name, rowsScanned: dataRows, keyHeaders, idColumns: keyColumns.map((column) => String.fromCharCode(65 + column)), duplicateIds, blankIds, ...(options.includeKeys ? { keys: rowKeys } : {}) });
  }

  return {
    spreadsheetTitle: metadata.data.properties?.title ?? "Google Sheet",
    spreadsheetId: config.spreadsheetId,
    tabsScanned: tabs.length,
    rowsScanned,
    issues,
    tabs,
  };
}
