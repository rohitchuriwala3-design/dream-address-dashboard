"use server";
import {
  requireAnyPermission,
  filterWritableDocumentIds,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { DocumentSystemType } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function bulkChangeType(documentIds: string[], systemType: DocumentSystemType) {
  let user;
  try {
    user = await requireAnyPermission(["crm.manage", "projects.manage"]);
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthenticated");
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  if (!documentIds || documentIds.length === 0) return;

  // Fail-closed: every documentId must be authorized.
  const allowed = await filterWritableDocumentIds(user, documentIds);
  if (allowed.length !== documentIds.length) {
    throw new Error("Forbidden");
  }

  await prismadb.documents.updateMany({
    where: { id: { in: documentIds } },
    data: { document_system_type: systemType },
  });

  revalidatePath("/[locale]/(routes)/documents");
}
