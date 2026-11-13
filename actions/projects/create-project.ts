"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requirePermission, AuthenticationError, AuthorizationError } from "@/lib/authz";

export const createProject = async (data: {
  title: string;
  description: string;
  visibility: string;
}) => {
  let user;
  try {
    user = await requirePermission("projects.manage");
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  const { title, description, visibility } = data;
  if (!title) return { error: "Missing project name" };
  if (!description) return { error: "Missing project description" };

  try {
    const boardsCount = await prismadb.boards.count();

    const newBoard = await prismadb.boards.create({
      data: {
        v: 0,
        user: user.id,
        title,
        description,
        position: boardsCount > 0 ? boardsCount : 0,
        visibility,
        sharedWith: [user.id],
        createdBy: user.id,
      },
    });

    await prismadb.sections.create({
      data: {
        v: 0,
        board: newBoard.id,
        title: "Backlog",
        position: 0,
      },
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { data: newBoard };
  } catch (error) {
    console.log("[CREATE_PROJECT]", error);
    return { error: "Failed to create project" };
  }
};
