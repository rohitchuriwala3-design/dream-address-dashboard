import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  AuthenticationError,
  AuthorizationError,
  isUnhandledRole,
} from "@/lib/authz";

export const getUserTasks = async (userId: string) => {
  let user;
  try {
    user = await requirePermission("projects.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  // user role: only allowed to read own tasks.
  if (user.role === "user" && userId !== user.id) {
    return [];
  }
  // Any role without rules here (partner) gets nothing.
  if (isUnhandledRole(user)) return [];

  const data = await prismadb.tasks.findMany({
    where: {
      user: userId,
    },
    include: {
      assigned_user: {
        select: {
          id: true,
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
