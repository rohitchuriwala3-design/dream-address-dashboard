import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";

export const getProduct = cache(async (id: string) => {
  try {
    await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return null;
    if (e instanceof AuthorizationError) return null;
    throw e;
  }
  const product = await prismadb.crm_Products.findUnique({
      where: { id, currency: "INR" },
    include: {
      category: true,
      created_by_user: { select: { id: true, name: true } },
      accountProducts: {
        where: { currency: "INR" },
        include: { account: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  return product;
});
