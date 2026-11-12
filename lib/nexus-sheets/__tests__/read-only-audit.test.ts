const mockSpreadsheetGet = jest.fn();
const mockValuesGet = jest.fn();
jest.mock("googleapis", () => ({
  google: {
    auth: { JWT: jest.fn() },
    sheets: jest.fn(() => ({ spreadsheets: { get: mockSpreadsheetGet, values: { get: mockValuesGet } } })),
  },
}));

import { auditNexusMasterSheet } from "../read-only-audit";

describe("auditNexusMasterSheet", () => {
  const originalEnv = {
    email: process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL,
    key: process.env.NEXUS360_SHEETS_PRIVATE_KEY,
  };

  beforeEach(() => {
    process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL = "sheets-reader@example.test";
    process.env.NEXUS360_SHEETS_PRIVATE_KEY = "fake-private-key";
    mockSpreadsheetGet.mockReset().mockResolvedValue({
      data: {
        properties: { title: "Studio master" },
        sheets: ["Projects", "Clients", "Accounts", "Quotations", "Quotation Lines", "Invoices", "Invoice Lines", "Transactions", "Expenses", "Vendors"]
          .map((title) => ({ properties: { title, gridProperties: { rowCount: 10 } } })),
      },
    });
    mockValuesGet.mockReset().mockImplementation(async ({ range }: { range: string }) => {
      const headersOnly = range.endsWith("A1:Z4");
      if (range.startsWith("'Projects'")) return { data: { values: headersOnly ? [["Project ID", "Name"]] : [["P-1", "One"], ["P-1", "Duplicate"], ["", "Missing ID"]] } };
      if (range.startsWith("'Quotation Lines'")) return { data: { values: headersOnly ? [["Quote ID", "Revision", "Line no."]] : [["Q-1", 1, 1], ["Q-1", 1, 1], ["Q-2", 1, ""]] } };
      if (range.startsWith("'Invoice Lines'")) return { data: { values: headersOnly ? [["Invoice ID", "Section", "Line no."]] : [["I-1", "Service", 1]] } };
      if (range.startsWith("'Vendors'")) return { data: { values: headersOnly ? [["Title"], ["Instructions"], ["IDs stay fixed"], ["Vendor ID", "Vendor name"]] : [["V-1", "Vendor one"]] } };
      const header = range.includes("Clients") ? "Client ID"
        : range.includes("Accounts") ? "Account ID"
        : range.includes("Quotations") ? "Quote ID"
        : range.includes("Invoices") ? "Invoice ID"
        : range.includes("Transactions") ? "Transaction ID" : "Expense ID";
      return { data: { values: headersOnly ? [[header]] : [[`${header}-1`]] } };
    });
  });

  afterAll(() => {
    if (originalEnv.email === undefined) delete process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL;
    else process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL = originalEnv.email;
    if (originalEnv.key === undefined) delete process.env.NEXUS360_SHEETS_PRIVATE_KEY;
    else process.env.NEXUS360_SHEETS_PRIVATE_KEY = originalEnv.key;
  });

  it("reports missing tabs, duplicate IDs, and populated rows without IDs", async () => {
    const result = await auditNexusMasterSheet();
    expect(result.spreadsheetTitle).toBe("Studio master");
    expect(result.tabsScanned).toBe(10);
    expect(result.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ tab: "Projects", code: "DUPLICATE_ID", count: 1 }),
      expect.objectContaining({ tab: "Projects", code: "MISSING_ID", count: 1 }),
      expect.objectContaining({ tab: "Payment Allocations", code: "MISSING_TAB" }),
      expect.objectContaining({ tab: "Quotation Lines", code: "DUPLICATE_ID", count: 1 }),
      expect.objectContaining({ tab: "Quotation Lines", code: "MISSING_ID", count: 1 }),
    ]));
    expect(result.tabs.find((tab) => tab.name === "Quotation Lines")?.idColumns).toEqual(["A", "B", "C"]);
    expect(mockValuesGet).toHaveBeenCalledTimes(20);
    expect(mockValuesGet).toHaveBeenCalledWith(expect.objectContaining({ range: "'Vendors'!A5:B20" }));
    expect(result.tabs.find((tab) => tab.name === "Vendors")?.keyHeaders).toEqual(["Vendor ID"]);
  });

  it("preserves legacy ID case and composes line keys for the reviewed preview", async () => {
    const result = await auditNexusMasterSheet({ includeKeys: true });
    expect(result.tabs.find((tab) => tab.name === "Projects")?.keys).toEqual(["P-1", "P-1"]);
    expect(result.tabs.find((tab) => tab.name === "Quotation Lines")?.keys).toEqual(["Q-1|1|1", "Q-1|1|1"]);
  });
});
