"use server";
import {
  requireAnyPermission,
  assertCanWriteDocument,
  assertCanWriteAccount,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function unlinkFromAccount(documentId: string, accountId: string) {
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

  try {
    await assertCanWriteAccount(user, accountId);
  } catch (e) {
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  await prismadb.documentsToAccounts.delete({
    where: {
      document_id_account_id: { document_id: documentId, account_id: accountId },
    },
  });

  revalidatePath("/[locale]/(routes)/documents");
  revalidatePath(`/[locale]/(routes)/crm/accounts/${accountId}`);
}
