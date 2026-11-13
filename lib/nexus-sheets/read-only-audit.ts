import { createHash } from "node:crypto";
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

// MARK IV reads and writes only whitelisted, explicitly mapped sheet ranges.
// The service-account file permission is Editor; this OAuth scope is required
// for the verified sync-log round trip and future controlled reconciliation.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
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

const SYNC_LOG_HEADERS = [
  "sync run id", "started at", "finished at", "direction", "entity",
  "rows read", "rows written", "conflicts", "status", "error summary",
  "actor", "payload checksum",
] as const;

/**
 * Verifies the staging application's own Google credential can write a
 * harmless, auditable test run to the workbook and read the exact row back.
 * This checks API write permission and read-after-write only; it deliberately
 * does not claim that business records have been reconciled in both systems.
 */
export async function runNexusSheetsSyncLogWriteReadTest(input: { runId: string; actorId: string }) {
  const config = getNexusSheetsConfiguration();
  if (!config.configured) throw new Error(`Google Sheets service account is not configured: ${config.missing.join(", ")}`);
  const credentials = getServiceAccountCredentials();
  const auth = new google.auth.JWT({ email: credentials.email, key: credentials.key, scopes: SCOPES });
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = "Nexus360 Sync Log";
  const safeName = sheetName.replace(/'/g, "''");
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: config.spreadsheetId,
    range: `'${safeName}'!A4:L4`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  const headers = (headerResponse.data.values?.[0] ?? []).map(normalizeHeader);
  if (SYNC_LOG_HEADERS.some((header) => !headers.includes(header))) {
    throw new Error("The Nexus360 Sync Log does not have the expected twelve-column header. No test row was written.");
  }
  const columnIndex = (header: string) => headers.indexOf(header);
  const startedAt = new Date().toISOString();
  const payload = [
    input.runId, startedAt, startedAt, "APP_TO_SHEET_READBACK", "SYNC_CONNECTIVITY_TEST",
    "1", "1", "0", "RUNNING", "", input.actorId,
  ];
  payload.push(createHash("sha256").update(payload.join("\u001f")).digest("hex"));
  const row = Array(headers.length).fill("") as string[];
  for (const [header, value] of SYNC_LOG_HEADERS.map((header, index) => [header, payload[index]] as const)) {
    row[columnIndex(header)] = value;
  }
  let rowNumber: number | null = null;
  const statusColumn = columnIndex("status");
  try {
    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: `'${safeName}'!A:L`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    const updatedRange = appendResponse.data.updates?.updatedRange ?? "";
    rowNumber = Number(updatedRange.match(/!A(\d+):L\d+$/)?.[1]) || null;
    if (!rowNumber || rowNumber <= 4) {
      throw new Error("Google Sheets did not confirm the appended test-run row. Check the Sync Log tab before retrying.");
    }

    const exactRange = `'${safeName}'!A${rowNumber}:L${rowNumber}`;
    const readback = await sheets.spreadsheets.values.get({
      spreadsheetId: config.spreadsheetId,
      range: exactRange,
      valueRenderOption: "FORMATTED_VALUE",
    });
    const actual = readback.data.values?.[0] ?? [];
    const mismatches = SYNC_LOG_HEADERS.filter((header) => String(actual[columnIndex(header)] ?? "") !== row[columnIndex(header)]);
    if (mismatches.length) throw new Error(`Google Sheets write readback mismatch in ${mismatches.length} sync-log field(s).`);

    const statusCell = `'${safeName}'!${String.fromCharCode(65 + statusColumn)}${rowNumber}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: config.spreadsheetId,
      range: statusCell,
      valueInputOption: "RAW",
      requestBody: { values: [["VERIFIED"]] },
    });
    const statusReadback = await sheets.spreadsheets.values.get({ spreadsheetId: config.spreadsheetId, range: statusCell, valueRenderOption: "FORMATTED_VALUE" });
    if (String(statusReadback.data.values?.[0]?.[0] ?? "") !== "VERIFIED") {
      throw new Error("Google Sheets could not verify the completed test-run status.");
    }
    return { spreadsheetId: config.spreadsheetId, spreadsheetTitle: "Dream Address Studio — Management", sheetName, rowNumber };
  } catch (error) {
    if (rowNumber && rowNumber > 4) {
      try {
        await sheets.spreadsheets.values.update({
          spreadsheetId: config.spreadsheetId,
          range: `'${safeName}'!${String.fromCharCode(65 + statusColumn)}${rowNumber}`,
          valueInputOption: "RAW",
          requestBody: { values: [["FAILED"]] },
        });
      } catch {
        // The failed status remains visible as RUNNING if Google rejects this cleanup write.
      }
    }
    throw error;
  }
}
