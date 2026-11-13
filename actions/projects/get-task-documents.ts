import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  assertCanReadTask,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getTaskDocuments = async (taskId: string) => {
  let user;
  try {
    user = await requirePermission("projects.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  try {
    await assertCanReadTask(user, taskId);
  } catch (e) {
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  // Query documents through DocumentsToTasks junction table
  const data = await prismadb.documents.findMany({
    where: {
      tasks: {
        some: {
          task_id: taskId,
        },
      },
    },
    include: {
      created_by: {
        select: {
          name: true,
        },
      },
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
  });
  return data;
};
