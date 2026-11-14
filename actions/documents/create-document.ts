"use server";
import {
  requireAnyPermission,
  requirePermission,
  assertCanWriteAccount,
  assertCanWriteLead,
  PARTNER_EDIT,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { inngest } from "@/inngest/client";
import { newDocumentFile } from "@/lib/documents/new-document-file";

interface CreateDocumentInput {
  name: string;
  key: string;
  size: number;
  mimeType: string;
  contentHash?: string;
  accountId?: string;
  leadId?: string;
}

export async function createDocument(input: CreateDocumentInput) {
  let user;
  try {
    user = input.leadId
      ? await requirePermission("crm.manage", { partner: true })
      : await requireAnyPermission(["crm.manage", "projects.manage"]);
  } catch (e) {
    if (e instanceof AuthenticationError) throw new Error("Unauthorized");
    if (e instanceof AuthorizationError) throw new Error("Forbidden");
    throw e;
  }

  if (input.leadId && input.accountId) throw new Error("Choose either a lead or an account for this document");

  if (input.leadId) {
    try {
      await assertCanWriteLead(user, input.leadId, PARTNER_EDIT);
    } catch (e) {
      if (e instanceof AuthorizationError) throw new Error("Forbidden");
      throw e;
    }
  }

  if (input.accountId) {
    try {
      await assertCanWriteAccount(user, input.accountId);
    } catch (e) {
      if (e instanceof AuthorizationError) throw new Error("Forbidden");
      throw e;
    }
  }

  const file = await newDocumentFile(input.key);

  const document = await prismadb.documents.create({
    data: {
      v: 0,
      document_name: input.name,
      description: "new document",
      ...file,
      size: input.size,
      document_file_mimeType: input.mimeType,
      content_hash: input.contentHash ?? null,
      processing_status: "PENDING",
      createdBy: user.id,
      assigned_user: user.id,
      ...(input.accountId
        ? { accounts: { create: { account_id: input.accountId } } }
        : {}),
      ...(input.leadId
        ? { leads: { create: { lead_id: input.leadId } } }
        : {}),
    },
  });

  await inngest.send({
    name: "document/uploaded",
    data: { documentId: document.id },
  });

  revalidatePath("/[locale]/(routes)/documents");
  if (input.leadId) revalidatePath("/[locale]/(routes)/crm/leads/[leadId]", "page");
  return document;
}
