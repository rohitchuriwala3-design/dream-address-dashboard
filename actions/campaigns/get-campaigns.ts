"use server";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  campaignReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getCampaigns = async (filters?: { status?: string; search?: string }) => {
  let user;
  try {
    user = await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  return prismadb.crm_campaigns.findMany({
    where: {
      ...campaignReadScopeWhere(user),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search ? { name: { contains: filters.search, mode: "insensitive" } } : {}),
    },
    orderBy: { created_on: "desc" },
    include: {
      template: { select: { name: true } },
      created_by_user: { select: { name: true } },
      _count: { select: { sends: true } },
    },
  });
};
