import { prismadb } from "@/lib/prisma";
import {
  AuthenticationError,
  AuthorizationError,
  assertCanReadLead,
  documentReadScopeWhere,
  requireAnyPermission,
} from "@/lib/authz";

export async function getDocumentsByLeadId(leadId: string) {
  let user;
  try {
    user = await requireAnyPermission(["crm.view", "projects.view"], { partner: true });
    await assertCanReadLead(user, leadId);
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) return [];
    throw error;
  }

  return prismadb.documents.findMany({
    where: {
      leads: { some: { lead_id: leadId } },
      ...documentReadScopeWhere(user),
    },
    include: {
      created_by: { select: { id: true, name: true, email: true } },
      assigned_to_user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date_created: "desc" },
  });
}
