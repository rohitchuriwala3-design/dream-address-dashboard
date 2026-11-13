"use server";
import {
  requireAnyPermission,
  documentReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";

interface DuplicateResult {
  isDuplicate: boolean;
  existingDocument?: {
    id: string;
    name: string;
    createdAt: Date | null;
    accountName?: string;
  };
}

export async function checkDuplicate(contentHash: string): Promise<DuplicateResult> {
  let user;
  try {
    user = await requireAnyPermission(["crm.view", "projects.view"], { partner: true });
  } catch (e) {
    if (e instanceof AuthenticationError) return { isDuplicate: false };
    if (e instanceof AuthorizationError) return { isDuplicate: false };
    throw e;
  }

  const existing = await prismadb.documents.findFirst({
    where: {
      content_hash: contentHash,
      ...documentReadScopeWhere(user),
    },
    select: {
      id: true,
      document_name: true,
      createdAt: true,
      accounts: {
        select: { account: { select: { name: true } } },
        take: 1,
      },
    },
  });

  if (!existing) return { isDuplicate: false };

  return {
    isDuplicate: true,
    existingDocument: {
      id: existing.id,
      name: existing.document_name,
      createdAt: existing.createdAt,
      accountName: existing.accounts[0]?.account.name,
    },
  };
}
