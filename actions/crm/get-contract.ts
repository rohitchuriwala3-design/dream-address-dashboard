"use server";
import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanReadContract,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getContract = async (contractId: string) => {
  let user;
  try {
    user = await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return null;
    throw e;
  }

  try {
    await assertCanReadContract(user, contractId);
  } catch (e) {
    if (e instanceof AuthorizationError) return null;
    throw e;
  }

  return prismadb.crm_Contracts.findUnique({
    where: { id: contractId, deletedAt: null, currency: "INR" },
    include: {
      assigned_account: { select: { id: true, name: true } },
      assigned_to_user: { select: { id: true, name: true } },
      lineItems: {
        include: {
          product: {
            select: { id: true, name: true, status: true },
          },
        },
        orderBy: { sort_order: "asc" },
      },
    },
  });
};
