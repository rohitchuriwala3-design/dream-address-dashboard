"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createTreasuryAccount, recordTreasuryMovement, recordTreasuryReconciliation, transferTreasury, TreasuryError } from "./service";

const accountSchema = z.object({ name: z.string().trim().min(2).max(120), institution: z.string().max(120).optional(), accountMask: z.string().max(12).optional(), currency: z.literal("INR").default("INR"), openingBalance: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/).default("0"), openingBalanceConfirmed: z.preprocess((value) => value === "true" || value === true, z.boolean()).default(false) });
const transferSchema = z.object({ fromAccountId: z.string().uuid(), toAccountId: z.string().uuid(), amount: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/), reference: z.string().max(160).optional(), description: z.string().trim().min(2).max(1000), idempotencyKey: z.string().uuid() });
const movementSchema = z.object({ accountId: z.string().uuid(), direction: z.enum(["INCOME", "EXPENSE"]), amount: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/), occurredAt: z.string().date(), reference: z.string().max(160).optional(), description: z.string().trim().min(2).max(1000), idempotencyKey: z.string().uuid() });
const reconcileSchema = z.object({ accountId: z.string().uuid(), statementDate: z.string().date(), statementBalance: z.string().regex(/^\d{1,16}(\.\d{1,2})?$/), note: z.string().max(1000).optional() });

export async function createTreasuryAccountAction(raw: unknown) {
  const parsed = accountSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check account details" };
  try { await createTreasuryAccount(parsed.data); revalidatePath("/[locale]/(routes)/treasury", "page"); return { success: true }; }
  catch (error) { if (error instanceof TreasuryError) return { error: error.message }; console.error("[createTreasuryAccountAction]", error); return { error: "Cash account could not be created" }; }
}

export async function transferTreasuryAction(raw: unknown) {
  const parsed = transferSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check transfer details" };
  try { await transferTreasury(parsed.data); revalidatePath("/[locale]/(routes)/treasury", "page"); return { success: true }; }
  catch (error) { if (error instanceof TreasuryError) return { error: error.message }; console.error("[transferTreasuryAction]", error); return { error: "Transfer could not be recorded" }; }
}

export async function recordTreasuryMovementAction(raw: unknown) {
  const parsed = movementSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check cash movement details" };
  try { await recordTreasuryMovement({ ...parsed.data, occurredAt: new Date(`${parsed.data.occurredAt}T12:00:00+05:30`) }); revalidatePath("/[locale]/(routes)/treasury", "page"); return { success: true }; }
  catch (error) { if (error instanceof TreasuryError) return { error: error.message }; console.error("[recordTreasuryMovementAction]", error); return { error: "Cash movement could not be recorded" }; }
}

export async function recordTreasuryReconciliationAction(raw: unknown) {
  const parsed = reconcileSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check statement details" };
  try { await recordTreasuryReconciliation({ ...parsed.data, statementDate: new Date(`${parsed.data.statementDate}T12:00:00+05:30`) }); revalidatePath("/[locale]/(routes)/treasury", "page"); return { success: true }; }
  catch (error) { if (error instanceof TreasuryError) return { error: error.message }; if ((error as {code?: string})?.code === "P2002") return { error: "A reconciliation already exists for this account and statement date" }; console.error("[recordTreasuryReconciliationAction]", error); return { error: "Statement reconciliation could not be saved" }; }
}
