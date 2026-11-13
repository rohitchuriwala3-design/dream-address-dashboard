"use server";
import {
  requireAnyPermission,
  assertCanWriteDocument,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { revalidatePath } from "next/cache";

export async function retryEnrichment(documentId: string) {
  let user;
  try {
    user = await requireAnyPermission(["crm.manage", "projects.manage"]);
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  try {
    await assertCanWriteDocument(user, documentId);
  } catch (e) {
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  await prismadb.documents.update({
    where: { id: documentId },
    data: { processing_status: "PENDING", processing_error: null },
  });

  await inngest.send({
    name: "document/uploaded",
    data: { documentId },
  });

  revalidatePath("/[locale]/(routes)/documents");
}
