"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requirePermission,
  filterAuthorizedTargetIds,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const createTargetList = async (data: {
  name: string;
  description?: string;
  targetIds?: string[];
}) => {
  const { name, description, targetIds = [] } = data;
  if (!name) return { error: "name is required" };

  let user;
  try {
    user = await requirePermission('crm.manage');
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  // Only seed the list with targets the caller can access.
  const authorizedIds =
    targetIds.length > 0 ? await filterAuthorizedTargetIds(user, targetIds) : [];

  try {
    const list = await prismadb.crm_TargetLists.create({
      data: {
        name,
        description,
        created_by: user.id,
        targets: {
          create: authorizedIds.map((id: string) => ({ target_id: id })),
        },
      },
      include: { targets: true },
    });
    revalidatePath("/[locale]/(routes)/campaigns/target-lists", "page");
    return { data: list };
  } catch (error) {
    return { error: "Failed to create target list" };
  }
};
