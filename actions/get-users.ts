import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, requirePermission, requireAnyPermission, isAdmin } from "@/lib/authz";
import { userDirectoryWhere } from "@/lib/authz/scopes/users";

//Get all users  for admin module (admins only)
export const getUsers = async () => {
  if (!isAdmin(await requireAuthenticated())) return [];
  const data = await prismadb.users.findMany({
    orderBy: {
      created_on: "desc",
    },
    include: { permissions: { select: { key: true } } },
  });
  return data.map(({ permissions, ...user }) => ({ ...user, permissionKeys: permissions.map(({ key }) => key) }));
};

//Get active users for Selects in app etc
export const getActiveUsers = async () => {
  const user = await requireAnyPermission(["crm.manage", "projects.manage", "finance.manage"]);
  const data = await prismadb.users.findMany({
    orderBy: {
      name: "asc",
    },
    where: {
      userStatus: "ACTIVE",
      ...userDirectoryWhere(user),
    },
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  });
  return data;
};

//Get new users by month for chart
export const getUsersByMonthAndYear = async (year: number) => {
  await requirePermission("dashboard.view");
  const users = await prismadb.users.findMany({
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const yearCreated = Number(new Intl.DateTimeFormat("en-IN", { year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(user.created_on)));
    const month = new Date(user.created_on).toLocaleString("en-IN", {
      month: "long",
      timeZone: "Asia/Kolkata",
    });

    if (yearCreated === year) {
      acc[month] = (acc[month] || 0) + 1;
    }

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((month: any) => {
    return {
      name: month,
      Number: usersByMonth[month],
    };
  });

  return chartData;
};

//Get new users by month for chart
export const getUsersByMonth = async () => {
  await requirePermission("dashboard.view");
  const users = await prismadb.users.findMany({
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const month = new Date(user.created_on).toLocaleString("en-IN", {
      month: "long",
      timeZone: "Asia/Kolkata",
    });

    acc[month] = (acc[month] || 0) + 1;

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((month: any) => {
    return {
      name: month,
      Number: usersByMonth[month],
    };
  });

  return chartData;
};

export const getUsersCountOverall = async () => {
  await requirePermission("dashboard.view");
  const users = await prismadb.users.findMany({
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const date = new Date(user.created_on);
    const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;

    acc[yearMonth] = (acc[yearMonth] || 0) + 1;

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((yearMonth: any) => {
    const [year, month] = yearMonth.split("-");
    return {
      year: parseInt(year),
      month: parseInt(month),
      name: `${month}/${year}`,
      Number: usersByMonth[yearMonth],
    };
  });

  return chartData;
};
