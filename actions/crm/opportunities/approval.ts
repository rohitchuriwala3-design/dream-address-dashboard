"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import resendHelper from "@/lib/resend";
import { writeAuditLog } from "@/lib/audit-log";
import {
  requireAuthenticated,
  requireRole,
  assertCanWriteOpportunity,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL ?? "";
const FROM = () =>
  `${process.env.NEXT_PUBLIC_APP_NAME} <${process.env.EMAIL_FROM}>`;

async function notify(to: string[], subject: string, text: string) {
  if (to.length === 0) return;
  try {
    const resend = await resendHelper();
    await resend.emails.send({ from: FROM(), to, subject, text });
  } catch (error) {
    console.error("[approval] notification failed:", error);
  }
}

// Spec §3.5: rep submits the SOW/quote for CSO approval before it goes out.
export async function requestApproval(
  opportunityId: string,
): Promise<{ error?: string }> {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }
  try {
    await assertCanWriteOpportunity(user, opportunityId);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Opportunity not found" };
    throw e;
  }

  const deal = await prismadb.crm_Opportunities.findFirst({
    where: { id: opportunityId, deletedAt: null },
  });
  if (!deal) return { error: "Opportunity not found" };
  if (deal.approval_status === "PENDING")
    return { error: "Approval is already pending for this deal." };
  if (deal.approval_status === "APPROVED")
    return { error: "This deal is already approved." };

  const requestResult = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "crm_Opportunities" WHERE "id" = ${opportunityId}::uuid FOR UPDATE`;
    const current = await tx.crm_Opportunities.findFirst({ where: { id: opportunityId, deletedAt: null } });
    if (!current) return { error: "Opportunity not found" };
    if (current.approval_status === "PENDING") return { error: "Approval is already pending for this deal." };
    if (current.approval_status === "APPROVED") return { error: "This deal is already approved." };
    const quoteLineCount = await tx.crm_OpportunityLineItems.count({ where: { opportunityId } });
    if (quoteLineCount === 0) return { error: "Add at least one priced quotation line before requesting approval." };
    const lines = await tx.crm_OpportunityLineItems.findMany({
      where: { opportunityId },
      orderBy: [{ sort_order: "asc" }, { createdAt: "asc" }],
    });
    const previousRevision = await tx.opportunityQuoteRevision.findFirst({
      where: { opportunityId }, orderBy: { revisionNo: "desc" }, select: { revisionNo: true },
    });
    const revisionNo = (previousRevision?.revisionNo ?? 0) + 1;
    const revisionSnapshot = {
      opportunity: {
        name: current.name,
        accountId: current.account,
        currency: current.currency || "INR",
        description: current.description,
        expectedRevenue: current.expected_revenue.toString(),
      },
      lines: lines.map((line) => ({
        id: line.id, name: line.name, sku: line.sku, description: line.description,
        quantity: line.quantity, unitPrice: line.unit_price.toString(),
        discountType: line.discount_type, discountValue: line.discount_value.toString(),
        lineTotal: line.line_total.toString(), currency: line.currency, sortOrder: line.sort_order,
      })),
      capturedAt: new Date().toISOString(),
    };
    await tx.opportunityQuoteRevision.create({ data: {
      opportunityId, revisionNo, status: "PENDING", snapshot: revisionSnapshot, submittedBy: user.id,
    } });
    await tx.crm_Opportunities.update({ where: { id: opportunityId }, data: {
      approval_status: "PENDING", approval_requested_at: new Date(), approval_note: null, updatedBy: user.id,
    } });
    return { oldStatus: current.approval_status };
  });
  if ("error" in requestResult) return { error: requestResult.error };
  await writeAuditLog({
    entityType: "opportunity",
    entityId: opportunityId,
    action: "updated",
    changes: [
      { field: "approval_status", old: requestResult.oldStatus, new: "PENDING" },
    ],
    userId: user.id,
  });

  const approvers = await prismadb.users.findMany({
    where: { role: { in: ["manager", "admin"] }, userStatus: "ACTIVE" },
    select: { email: true },
  });
  await notify(
    approvers.map((a) => a.email).filter(Boolean) as string[],
    `Approval requested: ${deal.name ?? opportunityId}`,
    `A quote/SOW approval was requested for "${deal.name ?? opportunityId}".\n` +
      `Review the queue: ${APP_URL()}/crm/approvals\n` +
      `Deal: ${APP_URL()}/crm/opportunities/${opportunityId}\n` +
      `(The SOW/quote should be attached to the deal's documents.)`,
  );

  revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
  return {};
}

/** A manager reopens an approved quote; subsequent line edits require a new review. */
export async function reopenApprovedQuote(opportunityId: string, note?: string): Promise<{ error?: string }> {
  let approver;
  try { approver = await requireRole(["manager", "admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }
  const deal = await prismadb.crm_Opportunities.findFirst({ where: { id: opportunityId, deletedAt: null } });
  if (!deal) return { error: "Opportunity not found" };
  const trimmedNote = note?.trim().slice(0, 1000) || null;
  const reopenResult = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "crm_Opportunities" WHERE "id" = ${opportunityId}::uuid FOR UPDATE`;
    const current = await tx.crm_Opportunities.findFirst({ where: { id: opportunityId, deletedAt: null } });
    if (!current) return { error: "Opportunity not found" };
    if (current.approval_status !== "APPROVED") return { error: "Only an approved quotation can be reopened." };
    const revisionReason = trimmedNote || "Reopened for revision";
    await tx.crm_Opportunities.update({ where: { id: opportunityId }, data: {
      approval_status: "REOPENED", approved_by: approver.id, approved_at: new Date(), approval_note: revisionReason, updatedBy: approver.id,
    } });
    const approvedRevision = await tx.opportunityQuoteRevision.findFirst({
      where: { opportunityId, status: "APPROVED" }, orderBy: { revisionNo: "desc" }, select: { id: true },
    });
    if (approvedRevision) await tx.opportunityQuoteRevision.update({
      where: { id: approvedRevision.id }, data: { status: "REOPENED", reopenReason: revisionReason },
    });
    return { oldNote: current.approval_note, revisionReason };
  });
  if ("error" in reopenResult) return { error: reopenResult.error };
  await writeAuditLog({ entityType: "opportunity", entityId: opportunityId, action: "updated", changes: [
    { field: "approval_status", old: "APPROVED", new: "REOPENED" },
    { field: "approval_note", old: reopenResult.oldNote, new: reopenResult.revisionReason },
  ], userId: approver.id });
  revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
  revalidatePath("/[locale]/(routes)/crm/opportunities/[opportunityId]", "page");
  return {};
}

// CSO decision — managers and admins only (2026-07-19 decision).
export async function decideApproval(
  opportunityId: string,
  decision: "APPROVED" | "REJECTED",
  note?: string,
): Promise<{ error?: string }> {
  let approver;
  try {
    approver = await requireRole(["manager", "admin"]);
  } catch (e) {
    if (e instanceof AuthenticationError || e instanceof AuthorizationError) {
      return { error: "Forbidden" };
    }
    throw e;
  }
  if (decision !== "APPROVED" && decision !== "REJECTED")
    return { error: "Invalid decision" };

  const deal = await prismadb.crm_Opportunities.findFirst({
    where: { id: opportunityId, deletedAt: null },
  });
  if (!deal) return { error: "Opportunity not found" };
  if (deal.approval_status !== "PENDING")
    return { error: "This deal has no pending approval request." };

  const trimmedNote = note?.trim().slice(0, 1000) || null;
  const decisionResult = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "crm_Opportunities" WHERE "id" = ${opportunityId}::uuid FOR UPDATE`;
    const current = await tx.crm_Opportunities.findFirst({ where: { id: opportunityId, deletedAt: null } });
    if (!current) return { error: "Opportunity not found" };
    if (current.approval_status !== "PENDING") return { error: "This deal has no pending approval request." };
    if (decision === "APPROVED" && await tx.crm_OpportunityLineItems.count({ where: { opportunityId } }) === 0)
      return { error: "This quotation has no line items and cannot be approved." };
    await tx.crm_Opportunities.update({ where: { id: opportunityId }, data: {
      approval_status: decision, approved_by: approver.id, approved_at: new Date(), approval_note: trimmedNote, updatedBy: approver.id,
    } });
    const pendingRevision = await tx.opportunityQuoteRevision.findFirst({
      where: { opportunityId, status: "PENDING" }, orderBy: { revisionNo: "desc" }, select: { id: true },
    });
    if (pendingRevision) await tx.opportunityQuoteRevision.update({
      where: { id: pendingRevision.id },
      data: { status: decision, reviewedBy: approver.id, reviewedAt: new Date(), reviewNote: trimmedNote },
    });
    return { oldStatus: current.approval_status };
  });
  if ("error" in decisionResult) return { error: decisionResult.error };
  await writeAuditLog({
    entityType: "opportunity",
    entityId: opportunityId,
    action: "updated",
    changes: [
      { field: "approval_status", old: "PENDING", new: decision },
      ...(trimmedNote
        ? [{ field: "approval_note", old: null, new: trimmedNote }]
        : []),
    ],
    userId: approver.id,
  });

  if (deal.assigned_to) {
    const rep = await prismadb.users.findUnique({ where: { id: deal.assigned_to } });
    if (rep?.email) {
      await notify(
        [rep.email],
        `Quote ${decision === "APPROVED" ? "approved" : "rejected"}: ${deal.name ?? opportunityId}`,
        `Your quote/SOW for "${deal.name ?? opportunityId}" was ${decision.toLowerCase()}.` +
          (trimmedNote ? `\nNote: ${trimmedNote}` : "") +
          `\nDeal: ${APP_URL()}/crm/opportunities/${opportunityId}`,
      );
    }
  }

  revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
  return {};
}
