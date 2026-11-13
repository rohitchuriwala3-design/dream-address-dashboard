import { createAccessControl } from "better-auth/plugins/access";

// Better Auth's admin plugin gates its own /api/auth/admin/* endpoints.
// Profile creation, role changes, and other user management stay in our
// requireRole-protected server actions. The admin role receives only the
// narrow set-password grant needed by the app's administrator reset action;
// app module permissions remain enforced separately in lib/authz.
const statements = {
  user: ["create", "list", "set-role", "ban", "impersonate", "delete", "set-password", "set-email", "get", "update"],
  session: ["list", "revoke", "delete"],
} as const;

export const ac = createAccessControl(statements);

export const admin = ac.newRole({ user: ["set-password"], session: [] });

export const manager = ac.newRole({ user: [], session: [] });

export const user = ac.newRole({ user: [], session: [] });

export const partner = ac.newRole({ user: [], session: [] });
