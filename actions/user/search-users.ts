"use server";
import { requireAnyPermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { userDirectoryWhere } from "@/lib/authz/scopes/users";

import { prismadb } from "@/lib/prisma";

const PAGE_SIZE_MAX = 100;

export async function searchUsers({
  search = "",
  skip = 0,
  take = 50,
}: {
  search?: string;
  skip?: number;
  take?: number;
} = {}) {
  let user;
  try {
    user = await requireAnyPermission(["crm.manage", "projects.manage", "finance.manage"]);
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  const safeTake = Math.min(PAGE_SIZE_MAX, Math.max(1, take));
  const safeSkip = Math.max(0, skip);

  const where = {
    userStatus: "ACTIVE" as const,
    ...userDirectoryWhere(user),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [users, total] = await prismadb.$transaction([
    prismadb.users.findMany({
      where,
      select: { id: true, name: true, avatar: true },
      orderBy: { name: "asc" },
      skip: safeSkip,
      take: safeTake,
    }),
    prismadb.users.count({ where }),
  ]);

  return { users, total, hasMore: safeSkip + safeTake < total };
}
