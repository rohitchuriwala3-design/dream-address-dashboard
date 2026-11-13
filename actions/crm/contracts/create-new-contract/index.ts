"use server";
import { prismadb } from "@/lib/prisma";
import { CreateNewContract } from "./schema";
import { InputType, ReturnType } from "./types";

import { createSafeAction } from "@/lib/create-safe-action";
import { writeAuditLog } from "@/lib/audit-log";
import {
  requirePermission,
  assertCanWriteAccount,
  assertAssignableUser,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

const handler = async (data: InputType): Promise<ReturnType> => {
  const {
    title,
    value,
    startDate,
    endDate,
    renewalReminderDate,
    customerSignedDate,
    companySignedDate,
    description,
    account,
    assigned_to,
    currency,
  } = data;

  if (currency && currency !== "INR") return { error: "MARK IV V1 supports INR only" };

  if (!title || !value) {
    return {
      error: "Please fill in all the required fields.",
    };
  }

  let user;
  try {
    user = await requirePermission("crm.manage");
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "User not logged in." };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }
  try {
    // Parent-write: attaching the contract to an account requires write on it.
    if (account) await assertCanWriteAccount(user, account);
    if (assigned_to) await assertAssignableUser(user, assigned_to);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  try {
    const result = await prismadb.crm_Contracts.create({
      data: {
        v: 0,
        title,
        value: parseFloat(value),
        startDate,
        endDate,
        renewalReminderDate,
        customerSignedDate,
        companySignedDate,
        description,
        account: account || undefined,
        assigned_to: assigned_to || undefined,
        createdBy: user.id,
        currency: "INR",
        snapshot_rate: 1,
      },
    });
    await writeAuditLog({
      entityType: "contract",
      entityId: result.id,
      action: "created",
      changes: null,
      userId: user.id,
    });
  } catch (error) {
    console.log(error);
    return {
      error:
        "Something went wrong while trying to run CreateNewContract action. Please try again.",
    };
  }

  return { data: { title } };
};

export const createNewContract = createSafeAction(CreateNewContract, handler);
