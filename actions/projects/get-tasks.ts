import { prismadb } from "@/lib/prisma";
import {
  requirePermission,
  boardReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const getTasks = async () => {
  let user;
  try {
    user = await requirePermission("projects.view");
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    if (e instanceof AuthorizationError) return [];
    throw e;
  }

  const data = await prismadb.tasks.findMany({
    where: {
      assigned_section: {
        board_relation: boardReadScopeWhere(user),
      },
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return data;
};

//get tasks by month for chart
export const getTasksByMonth = async () => {
  let user;
  try {
    user = await requirePermission("projects.view");
  } catch (e) {
    if (e instanceof AuthenticationError || e instanceof AuthorizationError) return [];
    throw e;
  }

  const tasks = await prismadb.tasks.findMany({
    where: {
      assigned_section: {
        board_relation: boardReadScopeWhere(user),
      },
    },
    select: { createdAt: true },
  });

  if (!tasks) {
    return {};
  }

  const tasksByMonth = tasks.reduce((acc: any, task: any) => {
    const month = new Date(task.createdAt).toLocaleString("en-IN", {
      month: "long",
      timeZone: "Asia/Kolkata",
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(tasksByMonth).map((month: any) => {
    return {
      name: month,
      Number: tasksByMonth[month],
    };
  });

  return chartData;
};
