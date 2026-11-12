import { Decimal } from "decimal.js";
import { prismadb } from "@/lib/prisma";
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/authz";

export class TreasuryError extends Error {}

async function treasuryUser() {
  try { return await requireRole(["manager", "admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new TreasuryError("Manager access is required");
    throw error;
  }
}

export async function listTreasury() {
  await treasuryUser();
  const [accounts, transactions] = await Promise.all([
    prismadb.treasuryAccount.findMany({
      orderBy: [{ active: "desc" }, { name: "asc" }],
      include: { entries: { select: { amount: true } }, reconciliations: { orderBy: { statementDate: "desc" }, take: 3 } },
    }),
    prismadb.treasuryTransaction.findMany({
      take: 100, orderBy: { occurredAt: "desc" },
      include: { entries: { include: { account: { select: { id: true, name: true, accountMask: true } } } } },
    }),
  ]);
  return {
    accounts: accounts.map(({ entries, ...account }) => ({
      ...account,
      balance: entries.reduce((balance, entry) => balance.plus(entry.amount.toString()), new Decimal(0)).toFixed(2),
    })),
    transactions,
  };
}

export async function recordTreasuryMovement(input: {
  accountId: string; direction: "INCOME" | "EXPENSE"; amount: string; occurredAt: Date;
  reference?: string; description: string; idempotencyKey: string;
}) {
  const user = await treasuryUser();
  const amount = new Decimal(input.amount);
  if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 2) throw new TreasuryError("Enter a positive amount with up to two decimal places");
  const prior = await prismadb.treasuryTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { entries: true } });
  if (prior) {
    const entry = prior.entries.find((item) => item.accountId === input.accountId);
    const sameRequest = prior.type === (input.direction === "INCOME" ? "MANUAL_INCOME" : "MANUAL_EXPENSE")
      && prior.amount.toString() === amount.toFixed(2)
      && Boolean(entry && new Decimal(entry.amount.toString()).eq(input.direction === "INCOME" ? amount : amount.negated()));
    if (!sameRequest) throw new TreasuryError("Retry key was already used for a different cash movement");
    return prior;
  }
  return prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "TreasuryAccount" WHERE "id" = ${input.accountId}::uuid FOR UPDATE`;
    const account = await tx.treasuryAccount.findFirst({ where: { id: input.accountId, active: true } });
    if (!account) throw new TreasuryError("Choose an active cash account");
    const signedAmount = input.direction === "INCOME" ? amount : amount.negated();
    if (signedAmount.isNegative()) {
      const balance = await tx.treasuryEntry.aggregate({ where: { accountId: account.id }, _sum: { amount: true } });
      if (new Decimal(balance._sum.amount?.toString() ?? "0").lt(amount)) throw new TreasuryError("Expense exceeds the available recorded cash balance");
    }
    return tx.treasuryTransaction.create({ data: {
      type: input.direction === "INCOME" ? "MANUAL_INCOME" : "MANUAL_EXPENSE", amount, currency: account.currency,
      reference: input.reference?.trim() || null, description: input.description.trim(), occurredAt: input.occurredAt,
      idempotencyKey: input.idempotencyKey, createdBy: user.id,
      entries: { create: { accountId: account.id, amount: signedAmount, currency: account.currency } },
    } });
  });
}

export async function recordTreasuryReconciliation(input: { accountId: string; statementDate: Date; statementBalance: string; note?: string }) {
  const user = await treasuryUser();
  const statementBalance = new Decimal(input.statementBalance);
  if (!statementBalance.isFinite() || statementBalance.isNegative() || statementBalance.decimalPlaces() > 2) throw new TreasuryError("Enter a nonnegative statement balance with up to two decimal places");
  return prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "TreasuryAccount" WHERE "id" = ${input.accountId}::uuid FOR UPDATE`;
    const account = await tx.treasuryAccount.findFirst({ where: { id: input.accountId, active: true } });
    if (!account) throw new TreasuryError("Choose an active cash account");
    const balance = await tx.treasuryEntry.aggregate({ where: { accountId: account.id }, _sum: { amount: true } });
    const ledgerBalance = new Decimal(balance._sum.amount?.toString() ?? "0");
    return tx.treasuryReconciliation.create({ data: {
      accountId: account.id, statementDate: input.statementDate, statementBalance,
      ledgerBalance, variance: statementBalance.minus(ledgerBalance), note: input.note?.trim() || null, reconciledBy: user.id,
    } });
  });
}

export async function listActiveTreasuryAccounts(currency?: string) {
  await treasuryUser();
  return prismadb.treasuryAccount.findMany({
    where: { active: true, ...(currency ? { currency: currency.toUpperCase() } : {}) },
    select: { id: true, name: true, currency: true }, orderBy: { name: "asc" },
  });
}

export async function createTreasuryAccount(input: { name: string; institution?: string; accountMask?: string; currency?: string; openingBalance?: string; openingBalanceConfirmed?: boolean }) {
  const user = await treasuryUser();
  const opening = new Decimal(input.openingBalance || "0");
  if (!opening.isFinite() || opening.isNegative() || opening.decimalPlaces() > 2) throw new TreasuryError("Opening balance must be zero or a positive amount with up to two decimal places");
  if (opening.gt(0) && !input.openingBalanceConfirmed) throw new TreasuryError("Confirm the opening balance against a bank statement before recording it");
  return prismadb.$transaction(async (tx) => {
    const account = await tx.treasuryAccount.create({ data: {
      name: input.name.trim(), institution: input.institution?.trim() || null,
      accountMask: input.accountMask?.trim() || null, currency: (input.currency || "INR").toUpperCase(), createdBy: user.id,
    } });
    if (opening.gt(0)) await tx.treasuryTransaction.create({ data: {
      type: "OPENING_BALANCE", amount: opening, currency: account.currency,
      description: "Verified opening balance", occurredAt: new Date(), sourceType: "treasury_opening_balance", sourceId: account.id, createdBy: user.id,
      entries: { create: { accountId: account.id, amount: opening, currency: account.currency } },
    } });
    return account;
  });
}

export async function transferTreasury(input: { fromAccountId: string; toAccountId: string; amount: string; reference?: string; description: string; idempotencyKey: string }) {
  const user = await treasuryUser();
  const amount = new Decimal(input.amount);
  if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 2) throw new TreasuryError("Enter a positive amount with up to two decimal places");
  if (input.fromAccountId === input.toAccountId) throw new TreasuryError("Choose two different cash accounts");
  const prior = await prismadb.treasuryTransaction.findUnique({ where: { idempotencyKey: input.idempotencyKey }, include: { entries: true } });
  if (prior) {
    const sameTransfer = prior.type === "TRANSFER" && prior.amount.toString() === amount.toFixed(2)
      && prior.entries.some((entry) => entry.accountId === input.fromAccountId && new Decimal(entry.amount.toString()).eq(amount.negated()))
      && prior.entries.some((entry) => entry.accountId === input.toAccountId && new Decimal(entry.amount.toString()).eq(amount));
    if (!sameTransfer) throw new TreasuryError("Transfer retry key was already used for a different request");
    return prior;
  }
  const result = await prismadb.$transaction(async (tx) => {
    const ids = [input.fromAccountId, input.toAccountId].sort();
    await tx.$queryRaw`SELECT "id" FROM "TreasuryAccount" WHERE "id" = ANY(${ids}::uuid[]) ORDER BY "id" FOR UPDATE`;
    const accounts = await tx.treasuryAccount.findMany({ where: { id: { in: ids }, active: true } });
    if (accounts.length !== 2) throw new TreasuryError("Both cash accounts must be active");
    const from = accounts.find((account) => account.id === input.fromAccountId)!;
    const to = accounts.find((account) => account.id === input.toAccountId)!;
    if (from.currency !== to.currency) throw new TreasuryError("Transfers require accounts with the same currency");
    const sum = await tx.treasuryEntry.aggregate({ where: { accountId: from.id }, _sum: { amount: true } });
    if (new Decimal(sum._sum.amount?.toString() ?? "0").lt(amount)) throw new TreasuryError("Transfer exceeds the available recorded balance");
    const transaction = await tx.treasuryTransaction.create({ data: {
      type: "TRANSFER", amount, currency: from.currency, reference: input.reference?.trim() || null,
      description: input.description.trim(), occurredAt: new Date(), createdBy: user.id, idempotencyKey: input.idempotencyKey,
      entries: { create: [
        { accountId: from.id, amount: amount.negated(), currency: from.currency },
        { accountId: to.id, amount, currency: from.currency },
      ] },
    } });
    return transaction;
  });
  return result;
}
