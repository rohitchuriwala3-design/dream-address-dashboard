"use server";

import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import {
  assertCanWriteAccount,
  assertCanWriteLead,
  AuthenticationError,
  AuthorizationError,
  PARTNER_EDIT,
  requirePermission,
} from "@/lib/authz";
import { handleStageTransition } from "@/lib/crm/stage-transition";
import { writeAuditLog } from "@/lib/audit-log";
import { serializeDecimals } from "@/lib/serialize-decimals";
import { z } from "zod";
import { parseCrmDateOnly } from "@/lib/crm/date-only";
import { validateOpportunityCustomFields } from "@/lib/crm/opportunities/field-settings";

const startOpportunitySchema = z.object({
  name: z.string().trim().max(180).optional(),
  description: z.string().trim().max(10_000).optional(),
  budget: z.string().trim().optional(),
  expectedRevenue: z.string().trim().optional(),
  closeDate: z.string().optional(),
  deliveryDeadline: z.string().optional(),
  salesStage: z.string().uuid().optional(),
  type: z.string().uuid().optional(),
  nextStep: z.string().trim().max(300).optional(),
  nextStepDueAt: z.string().optional(),
  customFields: z.record(z.string(), z.unknown()).optional(),
}).superRefine((value, context) => {
  for (const key of ["budget", "expectedRevenue"] as const) {
    const amount = value[key];
    if (amount && (!/^\d+(\.\d{1,2})?$/.test(amount) || Number(amount) > 100_000_000_000)) {
      context.addIssue({ code: "custom", path: [key], message: "Enter a valid non-negative amount in INR." });
    }
  }
  for (const key of ["closeDate", "deliveryDeadline", "nextStepDueAt"] as const) {
    const date = value[key];
    if (date) {
      try { parseCrmDateOnly(date); } catch { context.addIssue({ code: "custom", path: [key], message: "Enter a valid date." }); }
    }
  }
});

export type StartLeadOpportunityInput = z.infer<typeof startOpportunitySchema>;

/** Start the pre-closure job record for a prospect without creating a client account. */
export async function createLeadOpportunity(leadId: string, input?: StartLeadOpportunityInput) {
  let user;
  try {
    user = await requirePermission("crm.manage", { partner: true });
    await assertCanWriteLead(user, leadId, PARTNER_EDIT);
  } catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }

  try {
    const parsedInput = input ? startOpportunitySchema.safeParse(input) : null;
    if (parsedInput && !parsedInput.success) return { error: "Check the opportunity details and enter valid values." };
    const opportunityInput = parsedInput?.data;
    const customFields = opportunityInput ? await validateOpportunityCustomFields(opportunityInput.customFields ?? {}) : undefined;
    const result = await prismadb.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "crm_Leads" WHERE "id" = ${leadId}::uuid FOR UPDATE`;
      const lead = await tx.crm_Leads.findFirst({
        where: { id: leadId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          description: true,
          assigned_to: true,
          accountsIDs: true,
          convertedAt: true,
          convertedOpportunityId: true,
          preClosureOpportunity: { select: { id: true } },
        },
      });
      if (!lead) return { error: "Lead not found" } as const;
      if (lead.convertedAt || lead.convertedOpportunityId) {
        return { error: "This lead is already closed and converted" } as const;
      }
      if (lead.preClosureOpportunity) {
        return { opportunity: await tx.crm_Opportunities.findUniqueOrThrow({ where: { id: lead.preClosureOpportunity.id } }), created: false } as const;
      }
      if (lead.accountsIDs) await assertCanWriteAccount(user, lead.accountsIDs, PARTNER_EDIT);

      const firstStage = await tx.crm_Opportunities_Sales_Stages.findFirst({
        orderBy: [{ order: "asc" }, { name: "asc" }],
        select: { id: true },
      });
      const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
      const opportunity = await tx.crm_Opportunities.create({
        data: {
          sourceLeadId: lead.id,
          account: lead.accountsIDs ?? undefined,
          name: opportunityInput?.name || `${lead.company?.trim() || fullName || "Residential client"} — interiors project`,
          description: (opportunityInput?.description || lead.description) ?? undefined,
          customFields,
          budget: opportunityInput?.budget ? Number(opportunityInput.budget) : undefined,
          expected_revenue: opportunityInput?.expectedRevenue ? Number(opportunityInput.expectedRevenue) : undefined,
          close_date: opportunityInput?.closeDate ? parseCrmDateOnly(opportunityInput.closeDate) : undefined,
          delivery_deadline: opportunityInput?.deliveryDeadline ? parseCrmDateOnly(opportunityInput.deliveryDeadline) : undefined,
          next_step: opportunityInput?.nextStep || undefined,
          next_step_due_at: opportunityInput?.nextStepDueAt ? parseCrmDateOnly(opportunityInput.nextStepDueAt) : undefined,
          type: opportunityInput?.type || undefined,
          assigned_to: lead.assigned_to || user.id,
          createdBy: user.id,
          updatedBy: user.id,
          last_activity_by: user.id,
          last_activity: new Date(),
          currency: "INR",
          snapshot_rate: 1,
          sales_stage: opportunityInput?.salesStage || firstStage?.id,
          stage_entered_at: new Date(),
          status: "ACTIVE",
        },
      });
      return { opportunity, created: true } as const;
    });

    if ("error" in result) return result;
    if (result.created) {
      try {
        await handleStageTransition({ opportunityId: result.opportunity.id, fromStage: null, toStage: result.opportunity.sales_stage ?? null });
      } catch (error) {
        console.error("[createLeadOpportunity] stage automation failed after create", error);
      }
      try {
        await writeAuditLog({
          entityType: "opportunity",
          entityId: result.opportunity.id,
          action: "created",
          changes: [{ field: "sourceLeadId", old: null, new: leadId }],
          userId: user.id,
        });
      } catch (error) {
        console.error("[createLeadOpportunity] audit event failed after create", error);
      }
    }
    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    revalidatePath("/[locale]/(routes)/crm/leads/[leadId]", "page");
    return { opportunity: serializeDecimals(result.opportunity), created: result.created };
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    console.error("[createLeadOpportunity] failed", error);
    return { error: "Could not start this opportunity. Please retry." };
  }
}
