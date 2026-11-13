"use server";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  campaignTemplateReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getTemplates = async () => {
  let user;
  try {
    user = await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError || e instanceof AuthorizationError) return [];
    throw e;
  }

  return prismadb.crm_campaign_templates.findMany({
    where: campaignTemplateReadScopeWhere(user),
    orderBy: { created_on: "desc" },
    include: { created_by_user: { select: { name: true } } },
  });
};
