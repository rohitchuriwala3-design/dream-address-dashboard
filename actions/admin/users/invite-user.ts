"use server";

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
  if (name.length < 3 || name.length > 50 || !email || data.password.length < 8 || data.password.length > 128) {
    return { error: "Enter a name, email, and password between 8 and 128 characters." };
  }
  if (!allowedRoles.has(data.role)) return { error: "Choose a valid access role." };
  const permissions = parseNexusPermissions(data.permissions);
  if (!permissions) return { error: "Choose only valid profile permissions." };
  if (!Object.values(Language).includes(data.language as Language)) {
    return { error: "Choose a valid language." };
  }
  const existingProfile = await prismadb.users.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingProfile) {
    return { error: "A profile with this email already exists. Open its profile to update access; the password was not changed." };
  }

  let createdUserId: string | undefined;
  let phase = "create_user";
  try {
    // This server action has already authorized the caller with requireRole.
    // Do not forward browser headers into Better Auth's admin endpoint: the
    // configured Better Auth roles intentionally have no endpoint grants,
    // while this app's server action is the user-management boundary.
    const result = await auth.api.createUser({
      body: {
        name,
        email,
        password: data.password,
        role: data.role,
        data: { userStatus: "ACTIVE", userLanguage: data.language as Language },
      },
    });
    const userId = result.user.id;
    createdUserId = userId;
    phase = "save_permissions";
    if (permissions.length) {
      await prismadb.nexusUserPermission.createMany({
        data: permissions.map((key) => ({ userId, key })),
        skipDuplicates: true,
      });
    }
    phase = "write_audit";
    await writeAuditLog({
      entityType: "user",
      entityId: userId,
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
    return { data: { id: userId } };
  } catch (error) {
    const errorType = error instanceof Error ? error.name : "UnknownError";
    console.error("[ADMIN_CREATE_PROFILE] Profile operation failed.", { phase, errorType, profileCreated: Boolean(createdUserId) });
    if (createdUserId) {
      return { data: { id: createdUserId }, warning: "Profile created, but some selected permissions may not have saved. Review the profile before sharing its login." };
    }
    return { error: "Profile creation failed. Please retry or contact support." };
  }
};
