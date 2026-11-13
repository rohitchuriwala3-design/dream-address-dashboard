"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthenticationError, AuthorizationError, requireRole } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";

const required = (label: string, max: number) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);
const optional = (max: number) => z.string().trim().max(max).transform((value) => value || null);
const profileSchema = z.object({
  companyName: required("Business name", 200),
  companyAddress: required("Street address", 300),
  companyCity: required("City", 100),
  companyZip: required("PIN code", 20),
  companyCountry: required("Country", 100),
  companyRegNo: optional(50),
  companyEmail: z.string().trim().max(200).email("Enter a valid email address").or(z.literal("")).transform((value) => value || null),
  companyPhone: optional(50),
  companyWebsite: z.string().trim().max(300).refine((value) => !value || /^https?:\/\//i.test(value), "Website must start with https:// or http://").transform((value) => value || null),
});

export type BusinessProfileInput = z.input<typeof profileSchema>;
export type BusinessProfileResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function saveBusinessProfile(input: BusinessProfileInput): Promise<BusinessProfileResult> {
  try {
    await requireRole(["admin"]);
  } catch (error) {
    if (error instanceof AuthenticationError) return { ok: false, error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { ok: false, error: "Forbidden" };
    throw error;
  }

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  try {
    const existing = await prismadb.invoice_Settings.findFirst({ select: { id: true } });
    if (existing) {
      await prismadb.invoice_Settings.update({ where: { id: existing.id }, data: parsed.data });
    } else {
      await prismadb.invoice_Settings.create({
        data: {
          ...parsed.data,
          baseCurrency: "INR",
          defaultDueDays: 14,
          defaultSeriesId: null,
          defaultTaxRateId: null,
        },
      });
    }

    revalidatePath("/admin/business-profile");
    revalidatePath("/admin/invoices/settings");
    revalidatePath("/invoices/new");
    revalidatePath("/invoices/[invoiceId]/edit", "page");
    return { ok: true };
  } catch (error) {
    console.error("[saveBusinessProfile] failed:", error);
    return { ok: false, error: "Business profile could not be saved. Please retry." };
  }
}
