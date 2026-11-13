"use server";
import {
  requireAnyPermission,
  filterWritableDocumentIds,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET } from "@/lib/minio";

export async function bulkDeleteDocuments(documentIds: string[]) {
  let user;
  try {
    user = await requireAnyPermission(["crm.manage", "projects.manage"]);
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthenticated");
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  if (!documentIds || documentIds.length === 0) return;

  // Fail-closed: if any id is not authorized, reject the whole request.
  const allowed = await filterWritableDocumentIds(user, documentIds);
  if (allowed.length !== documentIds.length) {
    throw new Error("Forbidden");
  }

  const documents = await prismadb.documents.findMany({
    where: { id: { in: documentIds } },
    select: { id: true, key: true },
  });

  // Delete from MinIO
  await Promise.allSettled(
    documents.map((doc) =>
      doc.key
        ? minioClient.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: doc.key }))
        : Promise.resolve()
    )
  );

  // Delete from DB (cascade handles chunks, embeddings, junction tables)
  await prismadb.documents.deleteMany({
    where: { id: { in: documentIds } },
  });

  await Promise.all(documents.map((document) => writeAuditLog({
    entityType: "document",
    entityId: document.id,
    action: "deleted",
    changes: [{ field: "deleted", old: false, new: true }],
    userId: user.id,
  })));

  revalidatePath("/[locale]/(routes)/documents");
}
