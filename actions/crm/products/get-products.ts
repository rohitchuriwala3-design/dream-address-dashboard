import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";

export const getProductsFull = cache(async () => {
  try {
    await requirePermission("crm.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }
  const products = await prismadb.crm_Products.findMany({
    where: { deletedAt: null, currency: "INR" },
    include: {
      category: true,
      created_by_user: { select: { id: true, name: true } },
      _count: { select: { accountProducts: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return products;
});
