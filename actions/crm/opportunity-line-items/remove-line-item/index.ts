"use server";
import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { sumLineTotals } from "@/lib/line-items";
import {
  requireAuthenticated,
  assertCanWriteOpportunityLineItem,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const removeOpportunityLineItem = async (id: string) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }
  try {
    await assertCanWriteOpportunityLineItem(user, id);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  try {
    const lineItem = await prismadb.crm_OpportunityLineItems.findUnique({ where: { id } });
    if (!lineItem) {
      return { error: "Line item not found" };
    }
    const result = await prismadb.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "crm_Opportunities" WHERE "id" = ${lineItem.opportunityId}::uuid FOR UPDATE`;
      const parent = await tx.crm_Opportunities.findUnique({ where: { id: lineItem.opportunityId }, select: { approval_status: true } });
      if (!parent || parent.approval_status === "PENDING" || parent.approval_status === "APPROVED") return false;
      await tx.crm_OpportunityLineItems.delete({ where: { id } });
      const remaining = await tx.crm_OpportunityLineItems.findMany({ where: { opportunityId: lineItem.opportunityId } });
      await tx.crm_Opportunities.update({ where: { id: lineItem.opportunityId }, data: { expected_revenue: sumLineTotals(remaining) } });
      return true;
    });
    if (!result) return { error: "Reopen quote approval before changing an approved or pending quotation." };

    await writeAuditLog({
      entityType: "opportunity_line_item",
      entityId: id,
      action: "deleted",
      changes: null,
      userId: user.id,
    });

    revalidatePath("/[locale]/(routes)/crm/opportunities/[opportunityId]", "page");
    return { data: { id } };
  } catch (error) {
    console.log("[REMOVE_OPPORTUNITY_LINE_ITEM]", error);
    return { error: "Failed to remove line item" };
  }
};
