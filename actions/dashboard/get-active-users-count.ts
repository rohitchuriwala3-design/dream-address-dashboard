import { prismadb } from "@/lib/prisma";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { userDirectoryWhere } from "@/lib/authz/scopes/users";

// Scoped to what the caller can read (no global totals for user/partner).
export const getActiveUsersCount = async () => {
  try {
    const user = await requirePermission("dashboard.view", { partner: true });
    return await prismadb.users.count({ where: { userStatus: "ACTIVE", ...userDirectoryWhere(user) } });
  } catch (e) {
    if (e instanceof AuthenticationError) return 0;
    if (e instanceof AuthorizationError) return 0;
    throw e;
  }
};
