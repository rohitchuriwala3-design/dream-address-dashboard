"use server";
import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { getReportScope } from "@/lib/authz/scopes/report-scope";

export const getTasksCount = async () => {
  try {
    const user = await requirePermission("projects.view", { partner: true });
    if (user.role === "admin" || user.role === "manager") {
      return await prismadb.tasks.count();
    }
    // user: his own tasks; partner (no projects) and other roles: none.
    return await prismadb.tasks.count({ where: getReportScope(user).task });
  } catch (e) {
    if (e instanceof AuthenticationError) return 0;
    if (e instanceof AuthorizationError) return 0;
    throw e;
  }
};

export const getUsersTasksCount = async (userId: string) => {
  const user = await requirePermission("projects.view", { partner: true });
  const data = await prismadb.tasks.count({
    where: {
      AND: [{ user: userId }, getReportScope(user).task],
    },
  });
  return data;
};
