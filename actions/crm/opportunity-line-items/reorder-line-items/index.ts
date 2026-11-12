"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requireAuthenticated,
  assertCanWriteOpportunity,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const reorderOpportunityLineItems = async (
  items: { id: string; sort_order: number }[]
) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  // No parent id is supplied, so resolve every line item's parent and require
  // write on each. Any unresolved id or unwritable parent fails the whole batch.
  const ids = items.map((i) => i.id);
  const rows = await prismadb.crm_OpportunityLineItems.findMany({
    where: { id: { in: ids } },
    select: { id: true, opportunityId: true },
  });
  if (rows.length === 0 && items.length === 0) return { data: { success: true } };
  const foundIds = new Set(rows.map((r) => r.id));
  if (ids.some((id) => !foundIds.has(id))) return { error: "Forbidden" };
  const parents = Array.from(new Set(rows.map((r) => r.opportunityId)));
  try {
    for (const opportunityId of parents) await assertCanWriteOpportunity(user, opportunityId);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  try {
    const updated = await prismadb.$transaction(async (tx) => {
      const lockedIds = new Set<string>();
      for (const opportunityId of parents) {
        await tx.$queryRaw`SELECT "id" FROM "crm_Opportunities" WHERE "id" = ${opportunityId}::uuid FOR UPDATE`;
        const parent = await tx.crm_Opportunities.findUnique({ where: { id: opportunityId }, select: { approval_status: true } });
        if (!parent || parent.approval_status === "PENDING" || parent.approval_status === "APPROVED") lockedIds.add(opportunityId);
      }
      if (lockedIds.size) return false;
      await Promise.all(items.map((item) => tx.crm_OpportunityLineItems.update({ where: { id: item.id }, data: { sort_order: item.sort_order } })));
      return true;
    });
    if (!updated) return { error: "Reopen quote approval before changing line order." };

    revalidatePath("/[locale]/(routes)/crm/opportunities/[opportunityId]", "page");
    return { data: { success: true } };
  } catch (error) {
    console.log("[REORDER_OPPORTUNITY_LINE_ITEMS]", error);
    return { error: "Failed to reorder line items" };
  }
};
