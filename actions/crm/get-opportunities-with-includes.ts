"use server";

import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  opportunityReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { serializeDecimalsList } from "@/lib/serialize-decimals";

export const getOpportunitiesFull = cache(async () => {
  let user;
  try {
    user = await requirePermission("crm.view", { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const data = await prismadb.crm_Opportunities.findMany({
    where: { ...opportunityReadScopeWhere(user), AND: [{ currency: "INR" }] },
    include: {
      assigned_account: {
        select: {
          name: true,
        },
      },
      assigned_sales_stage: {
        select: {
          name: true,
        },
      },
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      created_on: "desc",
    },
  });

  return serializeDecimalsList(data);
});
