"use server";
import {
  requireAnyPermission,
  documentReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";

export const getDocuments = async () => {
  let user;
  try {
    user = await requireAnyPermission(["crm.view", "projects.view"], { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const documents = await prismadb.documents.findMany({
    where: {
      parent_document_id: null, // Only show root documents, not old versions
      ...documentReadScopeWhere(user),
    },
    orderBy: { date_created: "desc" },
    include: {
      created_by: { select: { id: true, name: true, email: true } },
      assigned_to_user: { select: { id: true, name: true, email: true } },
      accounts: {
        select: {
          account: { select: { id: true, name: true } },
        },
      },
    },
  });

  return documents;
};
