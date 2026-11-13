"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import {
  requireRole,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

const optionalStr = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .or(z.literal("").transform(() => null));

const settingsSchema = z.object({
  baseCurrency: z.literal("INR"),
  defaultSeriesId: z.uuid().nullable(),
  defaultTaxRateId: z.uuid().nullable().optional().default(null),
  defaultDueDays: z
    .number({ error: "Default due days is required" })
    .int("Must be a whole number")
    .min(1, "Must be at least 1 day")
    .max(365, "Must be at most 365 days"),

  bankName: optionalStr(200),
  bankAccount: optionalStr(100),
  bankAccountHolder: optionalStr(200),
  bankIfsc: optionalStr(11).transform((value) => value?.toUpperCase() ?? null)
    .refine((value) => !value || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value), "Enter a valid 11-character IFSC code"),
  footerText: optionalStr(1000),
});

export type InvoiceSettingsInput = z.infer<typeof settingsSchema>;

export type FieldErrors = Record<string, string>;

export type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: FieldErrors };

export async function saveInvoiceSettings(
  input: InvoiceSettingsInput
): Promise<ActionResult> {
  try {
    await requireRole(["admin"]);
  } catch (e) {
    if (e instanceof AuthenticationError) return { ok: false, error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { ok: false, error: "Forbidden" };
    throw e;
  }

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (path && !fieldErrors[path]) fieldErrors[path] = issue.message;
    }
    return {
      ok: false,
      error: "Please fix the highlighted fields",
      fieldErrors,
    };
  }
  const data = { ...parsed.data, baseCurrency: "INR" as const, defaultTaxRateId: null };

  try {
    const existing = await prismadb.invoice_Settings.findFirst();
    const settings = existing
      ? await prismadb.invoice_Settings.update({
          where: { id: existing.id },
          data,
        })
      : await prismadb.invoice_Settings.create({ data });

    revalidatePath("/admin/invoices/settings");
    return { ok: true, data: settings };
  } catch (err) {
    console.error("[saveInvoiceSettings] failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return { ok: false, error: message };
  }
}
