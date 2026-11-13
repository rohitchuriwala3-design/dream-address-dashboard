import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  AuthenticationError,
  AuthorizationError,
  isUnhandledRole,
} from "@/lib/authz";

export const getUserOpportunities = async (userId: string) => {
  let user;
  try {
    user = await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  // A plain "user" can only fetch their own opportunity list. Manager/admin
  // can list opportunities for any user.
  if (user.role === "user" && userId !== user.id) {
    return [];
  }
  // Any role without rules here (partner) gets nothing.
  if (isUnhandledRole(user)) return [];

  const data = await prismadb.crm_Opportunities.findMany({
    where: {
      assigned_to: userId,
      deletedAt: null,
      currency: "INR",
    },
    include: {
      assigned_sales_stage: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
