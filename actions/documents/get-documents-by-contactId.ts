import { prismadb } from "@/lib/prisma";
import {
  requireAnyPermission,
  assertCanReadContact,
  documentReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getDocumentsByContactId = async (contactId: string) => {
  let user;
  try {
    user = await requireAnyPermission(["crm.view", "projects.view"], { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }
  try {
    await assertCanReadContact(user, contactId);
  } catch (e) {
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  // Query through DocumentsToContacts junction table
  const data = await prismadb.documents.findMany({
    where: {
      contacts: {
        some: {
          contact_id: contactId,
        },
      },
      ...documentReadScopeWhere(user),
    },
    include: {
      created_by: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      assigned_to_user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      date_created: "desc",
    },
  });
  return data;
};
