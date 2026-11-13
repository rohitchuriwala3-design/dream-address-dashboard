"use server";

import { prismadb } from "@/lib/prisma";
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/authz";

async function ensureAdmin(): Promise<{ error: string } | null> {
  try {
    await requireRole(["admin"]);
    return null;
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }
}

export type CurrencyValue = {
  code: string;
  name: string;
  symbol: string;
  isEnabled: boolean;
  isDefault: boolean;
};

export async function getCurrencies(): Promise<CurrencyValue[]> {
  const denied = await ensureAdmin();
  if (denied) throw new Error(denied.error);
  const currency = await prismadb.currency.findUnique({ where: { code: "INR" } });
  if (!currency) return [];
  return [{ code: "INR", name: "Indian Rupee", symbol: "₹", isEnabled: currency.isEnabled, isDefault: currency.isDefault }];
}
