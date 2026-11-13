"use server";
import { prismadb } from "@/lib/prisma";
import { UpdateContract } from "./schema";
import { InputType, ReturnType } from "./types";

import { createSafeAction } from "@/lib/create-safe-action";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";
import {
  requireAuthenticated,
  assertCanWriteContract,
  assertCanWriteAccount,
  assertAssignableUser,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

const handler = async (data: InputType): Promise<ReturnType> => {
  const {
    id,
    v,
    title,
    value,
    startDate,
    endDate,
    renewalReminderDate,
    customerSignedDate,
    companySignedDate,
    description,
    status,
    account,
    assigned_to,
    currency,
  } = data;

  if (!id) {
    return {
      error: "No contract ID provided.",
    };
  }

  if (!title || !value) {
    return {
      error: "Please fill in all the required fields.",
    };
  }

  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "User not logged in." };
    throw e;
  }
  try {
    await assertCanWriteContract(user, id);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  const before = await prismadb.crm_Contracts.findUnique({ where: { id, deletedAt: null } });
  if (before?.currency && before.currency !== "INR") {
    return { error: "This historical contract needs an admin's INR review before editing" };
  }
  if (currency && currency !== "INR") return { error: "MARK IV V1 supports INR only" };

  try {
    // Parent-write, as createContract: moving the contract to another account requires write on it.
    if (account && account !== before?.account) await assertCanWriteAccount(user, account);
    // Only a new assignee is checked: the form resends the current one.
    if (assigned_to && assigned_to !== before?.assigned_to) await assertAssignableUser(user, assigned_to);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  try {
    const result = await prismadb.crm_Contracts.update({
      where: {
        id: data.id,
      },
      data: {
        v: data.v + 1,
        title,
        value: parseFloat(value),
        startDate,
        endDate,
        renewalReminderDate,
        customerSignedDate,
        companySignedDate,
        description,
        status,
        account: account || undefined,
        assigned_to: assigned_to || undefined,
        createdBy: user.id,
        currency: currency === "INR" ? "INR" : undefined,
        snapshot_rate: currency === "INR" ? 1 : undefined,
      },
    });

    const changes = before ? diffObjects(before as Record<string, unknown>, result as Record<string, unknown>) : null;
    await writeAuditLog({
      entityType: "contract",
      entityId: result.id,
      action: "updated",
      changes,
      userId: user.id,
    });
  } catch (error) {
    console.log(error);
    return {
      error:
        "Something went wrong while trying to run UpdateContract action. Please try again.",
    };
  }

  return { data: { title } };
};

export const updateContract = createSafeAction(UpdateContract, handler);
