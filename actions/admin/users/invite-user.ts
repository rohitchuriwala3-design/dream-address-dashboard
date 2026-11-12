"use server";

import { headers } from "next/headers";
import { AppRole, Language } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import {
  requireRole,
  AuthzUser,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { parseNexusPermissions } from "@/lib/authz/permissions";

const allowedRoles = new Set<AppRole>(["admin", "manager", "user", "partner"]);

export const inviteUser = async (data: {
  name: string;
  email: string;
  password: string;
  role: AppRole;
  language: string;
  permissions: string[];
}) => {
  let actor: AuthzUser;
  try {
    actor = await requireRole(["admin"]);
  } catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }

  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();
  if (name.length < 3 || name.length > 50 || !email || data.password.length < 12 || data.password.length > 128) {
    return { error: "Enter a name, email, and password with at least 12 characters." };
  }
  if (!allowedRoles.has(data.role)) return { error: "Choose a valid access role." };
  const permissions = parseNexusPermissions(data.permissions);
  if (!permissions) return { error: "Choose only valid profile permissions." };
  if (!Object.values(Language).includes(data.language as Language)) {
    return { error: "Choose a valid language." };
  }
  if (await prismadb.users.findUnique({ where: { email }, select: { id: true } })) {
    return { error: "A profile with this email already exists." };
  }

  try {
    const result = await auth.api.createUser({
      body: { name, email, password: data.password, role: data.role },
      headers: await headers(),
    });
    await prismadb.users.update({
      where: { id: result.user.id },
      data: { userStatus: "ACTIVE", userLanguage: data.language as Language },
    });
    if (permissions.length) {
      await prismadb.nexusUserPermission.createMany({
        data: permissions.map((key) => ({ userId: result.user.id, key })),
      });
    }
    await writeAuditLog({
      entityType: "user",
      entityId: result.user.id,
      action: "created",
      changes: [
        { field: "name", old: null, new: name },
        { field: "email", old: null, new: email },
        { field: "role", old: null, new: data.role },
        { field: "userLanguage", old: null, new: data.language },
        { field: "permissions", old: [], new: permissions },
      ],
      userId: actor.id,
    });
    revalidatePath("/[locale]/(routes)/admin/users", "page");
    return { data: { id: result.user.id } };
  } catch (error) {
    console.error("[ADMIN_CREATE_PROFILE] Profile creation failed.");
    return { error: "Profile creation failed. Please retry or contact support." };
  }
};
