"use server";

import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import {
  assertCanWriteOpportunity,
  AuthenticationError,
  AuthorizationError,
  PARTNER_EDIT,
  requirePermission,
} from "@/lib/authz";

/** Close a qualified opportunity as won or lost, recording the decision and owner. */
export async function setOpportunityOutcome(input: {
  opportunityId: string;
  outcome: "WON" | "LOST";
  note?: string;
}): Promise<{ error?: string }> {
  if (!input.opportunityId || (input.outcome !== "WON" && input.outcome !== "LOST")) {
    return { error: "Choose a valid opportunity outcome." };
  }
  let user;
  try {
    user = await requirePermission("crm.manage", { partner: true });
    await assertCanWriteOpportunity(user, input.opportunityId, PARTNER_EDIT);
  } catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }

  const note = input.note?.trim() || null;
  if (note && note.length > 1000) return { error: "The outcome note must be 1,000 characters or less." };
  if (input.outcome === "LOST" && !note) return { error: "Add a short reason before marking this opportunity lost." };

  try {
    const result = await prismadb.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "crm_Opportunities" WHERE "id" = ${input.opportunityId}::uuid FOR UPDATE`;
      const current = await tx.crm_Opportunities.findFirst({
        where: { id: input.opportunityId, deletedAt: null },
        select: { id: true, status: true, sourceLeadId: true, outcomeNote: true },
      });
      if (!current) return { error: "Opportunity not found" } as const;
      if (current.status !== "ACTIVE") return { error: "Only an active opportunity can be closed." } as const;

      await tx.crm_Opportunities.update({
        where: { id: current.id },
        data: { status: input.outcome, closedAt: new Date(), closedBy: user.id, outcomeNote: note, updatedBy: user.id },
      });

      // Keep a lost prospect visible in the lead pipeline when a Lost status exists.
      if (input.outcome === "LOST" && current.sourceLeadId) {
        const lostStatus = await tx.crm_Lead_Statuses.findFirst({
          where: { name: { equals: "Lost", mode: "insensitive" } },
          select: { id: true },
        });
        if (lostStatus) await tx.crm_Leads.updateMany({
          where: { id: current.sourceLeadId, convertedAt: null },
          data: { lead_status_id: lostStatus.id, updatedBy: user.id },
        });
      }
      return { oldStatus: current.status, oldNote: current.outcomeNote } as const;
    });
    if ("error" in result) return { error: result.error };

    try {
      await writeAuditLog({
        entityType: "opportunity",
        entityId: input.opportunityId,
        action: "updated",
        changes: [
          { field: "status", old: result.oldStatus, new: input.outcome },
          { field: "outcomeNote", old: result.oldNote, new: note },
        ],
        userId: user.id,
      });
    } catch (error) {
      console.error("[setOpportunityOutcome] audit event failed after outcome update", error);
    }
    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    revalidatePath("/[locale]/(routes)/crm/leads/[leadId]", "page");
    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    revalidatePath("/[locale]/(routes)/crm/opportunities/[opportunityId]", "page");
    return {};
  } catch (error) {
    console.error("[setOpportunityOutcome] failed", error);
    return { error: "Could not close this opportunity. Please retry." };
  }
}
