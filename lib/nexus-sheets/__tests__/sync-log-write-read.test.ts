const mockJwt = jest.fn();
const mockValuesGet = jest.fn();
const mockValuesAppend = jest.fn();
const mockValuesUpdate = jest.fn();

jest.mock("googleapis", () => ({
  google: {
    auth: { JWT: mockJwt },
    sheets: jest.fn(() => ({ spreadsheets: { values: { get: mockValuesGet, append: mockValuesAppend, update: mockValuesUpdate } } })),
  },
}));

import { runNexusSheetsSyncLogWriteReadTest } from "../read-only-audit";

describe("runNexusSheetsSyncLogWriteReadTest", () => {
  const originalEnv = {
    email: process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL,
    key: process.env.NEXUS360_SHEETS_PRIVATE_KEY,
  };
  const headers = [["Sync Run ID", "Started At", "Finished At", "Direction", "Entity", "Rows Read", "Rows Written", "Conflicts", "Status", "Error Summary", "Actor", "Payload Checksum"]];

  beforeEach(() => {
    process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL = "sheets-writer@example.test";
    process.env.NEXUS360_SHEETS_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----";
    mockJwt.mockReset();
    mockValuesGet.mockReset().mockImplementation(async ({ range }: { range: string }) => {
      if (range.endsWith("A4:L4")) return { data: { values: headers } };
      if (range.endsWith("A5:L5")) return { data: { values: [mockValuesAppend.mock.calls[0][0].requestBody.values[0]] } };
      if (range.endsWith("I5")) return { data: { values: [["VERIFIED"]] } };
      throw new Error(`Unexpected read range ${range}`);
    });
    mockValuesAppend.mockReset().mockResolvedValue({ data: { updates: { updatedRange: "'Nexus360 Sync Log'!A5:L5" } } });
    mockValuesUpdate.mockReset().mockResolvedValue({ data: {} });
  });

  afterAll(() => {
    if (originalEnv.email === undefined) delete process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL;
    else process.env.NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL = originalEnv.email;
    if (originalEnv.key === undefined) delete process.env.NEXUS360_SHEETS_PRIVATE_KEY;
    else process.env.NEXUS360_SHEETS_PRIVATE_KEY = originalEnv.key;
  });

  it("appends a labelled test run, reads the row back, and verifies its status", async () => {
    const result = await runNexusSheetsSyncLogWriteReadTest({ runId: "run-123", actorId: "admin-123" });
    expect(result).toMatchObject({ sheetName: "Nexus360 Sync Log", rowNumber: 5 });
    expect(mockJwt).toHaveBeenCalledWith(expect.objectContaining({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] }));
    expect(mockValuesAppend).toHaveBeenCalledWith(expect.objectContaining({
      range: "'Nexus360 Sync Log'!A:L",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [expect.arrayContaining(["run-123", "APP_TO_SHEET_READBACK", "SYNC_CONNECTIVITY_TEST", "RUNNING"])] },
    }));
    expect(mockValuesUpdate).toHaveBeenCalledWith(expect.objectContaining({ range: "'Nexus360 Sync Log'!I5", requestBody: { values: [["VERIFIED"]] } }));
    expect(mockValuesGet).toHaveBeenCalledWith(expect.objectContaining({ range: "'Nexus360 Sync Log'!A5:L5" }));
  });

  it("refuses to write when the workbook log headers do not match", async () => {
    mockValuesGet.mockResolvedValueOnce({ data: { values: [["wrong", "columns"]] } });
    await expect(runNexusSheetsSyncLogWriteReadTest({ runId: "run-123", actorId: "admin-123" }))
      .rejects.toThrow("does not have the expected twelve-column header");
    expect(mockValuesAppend).not.toHaveBeenCalled();
  });

  it("marks an appended test row failed when exact-row readback does not match", async () => {
    mockValuesGet.mockImplementation(async ({ range }: { range: string }) => {
      if (range.endsWith("A4:L4")) return { data: { values: headers } };
      if (range.endsWith("A5:L5")) return { data: { values: [["wrong-id"]] } };
      throw new Error(`Unexpected read range ${range}`);
    });
    await expect(runNexusSheetsSyncLogWriteReadTest({ runId: "run-123", actorId: "admin-123" }))
      .rejects.toThrow("readback mismatch");
    expect(mockValuesUpdate).toHaveBeenCalledWith(expect.objectContaining({
      range: "'Nexus360 Sync Log'!I5",
      requestBody: { values: [["FAILED"]] },
    }));
  });
});
