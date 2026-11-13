"use server";
import {
  requireAnyPermission,
  assertCanWriteDocument,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

import { prismadb } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET } from "@/lib/minio";

export async function deleteDocument(documentId: string) {
  let user;
  try {
    user = await requireAnyPermission(["crm.manage", "projects.manage"]);
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthenticated");
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  if (!documentId) throw new Error("Document ID is required");

  try {
    await assertCanWriteDocument(user, documentId);
  } catch (e) {
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  const document = await prismadb.documents.findUnique({
    where: { id: documentId },
  });

  if (!document) throw new Error("Document not found");

  await prismadb.documents.delete({ where: { id: documentId } });

  if (document.key) {
    await minioClient.send(
      new DeleteObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: document.key,
      })
    );
  }

  await writeAuditLog({
    entityType: "document",
    entityId: documentId,
    action: "deleted",
    changes: [{ field: "deleted", old: false, new: true }],
    userId: user.id,
  });
}
