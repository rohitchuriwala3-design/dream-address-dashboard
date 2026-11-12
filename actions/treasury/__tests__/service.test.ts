jest.mock("@/lib/authz", () => ({
  requireRole: jest.fn(), AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
}));
jest.mock("@/lib/prisma", () => ({ prismadb: { treasuryAccount: { create: jest.fn() }, treasuryTransaction: { findUnique: jest.fn() }, $transaction: jest.fn() } }));

import { requireRole } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { createTreasuryAccount, recordTreasuryMovement, recordTreasuryReconciliation, transferTreasury, TreasuryError } from "../service";

const tx = {
  $queryRaw: jest.fn(),
  treasuryAccount: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() },
  treasuryEntry: { aggregate: jest.fn() },
  treasuryTransaction: { create: jest.fn() },
  treasuryReconciliation: { create: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  (requireRole as jest.Mock).mockResolvedValue({ id: "manager-1", role: "manager" });
  (prismadb.$transaction as jest.Mock).mockImplementation((callback: any) => callback(tx));
  tx.treasuryAccount.create.mockResolvedValue({ id: "cash-1", currency: "INR" });
  tx.treasuryAccount.findFirst.mockResolvedValue({ id: "cash-1", currency: "INR" });
  tx.treasuryTransaction.create.mockResolvedValue({ id: "transaction-1" });
  tx.treasuryReconciliation.create.mockResolvedValue({ id: "reconciliation-1" });
  (prismadb.treasuryTransaction.findUnique as jest.Mock).mockResolvedValue(null);
  tx.treasuryAccount.findMany.mockResolvedValue([
    { id: "cash-a", currency: "INR", active: true }, { id: "cash-b", currency: "INR", active: true },
  ]);
  tx.treasuryEntry.aggregate.mockResolvedValue({ _sum: { amount: "1000.00" } });
});

describe("treasury ledger", () => {
  it("requires explicit statement confirmation for a nonzero opening balance", async () => {
    await expect(createTreasuryAccount({ name: "Primary", openingBalance: "100", openingBalanceConfirmed: false }))
      .rejects.toThrow("Confirm the opening balance against a bank statement");
    expect(tx.treasuryAccount.create).not.toHaveBeenCalled();
  });

  it("records a confirmed opening balance as its own signed ledger transaction", async () => {
    await createTreasuryAccount({ name: "Primary", openingBalance: "100.25", openingBalanceConfirmed: true });
    const posting = tx.treasuryTransaction.create.mock.calls[0][0].data;
    expect(posting.type).toBe("OPENING_BALANCE");
    expect(posting.sourceType).toBe("treasury_opening_balance");
    expect(posting.amount.toString()).toBe("100.25");
    expect(posting.entries.create.amount.toString()).toBe("100.25");
  });

  it("rejects a transfer that would overdraw the source account", async () => {
    tx.treasuryEntry.aggregate.mockResolvedValue({ _sum: { amount: "50.00" } });
    await expect(transferTreasury({ fromAccountId: "cash-a", toAccountId: "cash-b", amount: "50.01", description: "Move funds", idempotencyKey: "retry-1" }))
      .rejects.toThrow("Transfer exceeds the available recorded balance");
    expect(tx.treasuryTransaction.create).not.toHaveBeenCalled();
  });

  it("rejects same-account transfers before opening a transaction", async () => {
    await expect(transferTreasury({ fromAccountId: "cash-a", toAccountId: "cash-a", amount: "10", description: "Invalid", idempotencyKey: "retry-2" }))
      .rejects.toThrow(new TreasuryError("Choose two different cash accounts"));
    expect(prismadb.$transaction).not.toHaveBeenCalled();
  });

  it("records manual income as a positive signed entry", async () => {
    await recordTreasuryMovement({ accountId: "cash-1", direction: "INCOME", amount: "80", occurredAt: new Date("2026-11-12"), description: "Bank interest", idempotencyKey: "income-retry" });
    const data = tx.treasuryTransaction.create.mock.calls[0][0].data;
    expect(data.type).toBe("MANUAL_INCOME");
    expect(data.entries.create.amount.toString()).toBe("80");
  });

  it("refuses a manual expense that exceeds the ledger balance", async () => {
    tx.treasuryEntry.aggregate.mockResolvedValue({ _sum: { amount: "10" } });
    await expect(recordTreasuryMovement({ accountId: "cash-1", direction: "EXPENSE", amount: "10.01", occurredAt: new Date(), description: "Fee", idempotencyKey: "expense-retry" }))
      .rejects.toThrow("Expense exceeds the available recorded cash balance");
    expect(tx.treasuryTransaction.create).not.toHaveBeenCalled();
  });

  it("stores statement variance without adjusting the ledger", async () => {
    tx.treasuryEntry.aggregate.mockResolvedValue({ _sum: { amount: "90.00" } });
    await recordTreasuryReconciliation({ accountId: "cash-1", statementDate: new Date("2026-11-10"), statementBalance: "100.00", note: "October statement" });
    const data = tx.treasuryReconciliation.create.mock.calls[0][0].data;
    expect(data.ledgerBalance.toString()).toBe("90");
    expect(data.variance.toString()).toBe("10");
    expect(tx.treasuryTransaction.create).not.toHaveBeenCalled();
  });
});
