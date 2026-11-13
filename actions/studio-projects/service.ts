import { Decimal } from "decimal.js";
import { prismadb } from "@/lib/prisma";
import { serializeDecimals, serializeDecimalsList } from "@/lib/serialize-decimals";
import {
  accountReadScopeWhere,
  assertCanWriteAccount,
  assertCanWriteOpportunity,
  requireRole,
  AuthenticationError,
  AuthorizationError,
  PARTNER_EDIT,
  requirePermission,
} from "@/lib/authz";
import { opportunityReadScopeWhere } from "@/lib/authz/scopes/crm";
import { writeAuditLog } from "@/lib/audit-log";
import { STUDIO_PROJECT_STATUSES, type StudioProjectStatus } from "./status";
export { STUDIO_PROJECT_STATUSES, type StudioProjectStatus } from "./status";

export class StudioProjectServiceError extends Error {
  constructor(message: string, readonly code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "INVALID" | "FAILED") {
    super(message);
  }
}

async function currentUser(permission: "projects.view" | "projects.manage" = "projects.view") {
  try { return await requirePermission(permission, { partner: true }); }
  catch (error) {
    if (error instanceof AuthenticationError) throw new StudioProjectServiceError("Sign in to continue", "UNAUTHORIZED");
    throw error;
  }
}

export async function listStudioProjects() {
  const user = await currentUser();
  const projects = await prismadb.studioProject.findMany({
    where: { deletedAt: null, currency: "INR", account: { is: accountReadScopeWhere(user) } },
    include: {
      account: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true, expected_revenue: true, currency: true } },
      milestones: { orderBy: { sortOrder: "asc" }, select: { id: true, name: true, dueDate: true, completedAt: true } },
    },
    orderBy: [{ targetHandoverDate: "asc" }, { updatedAt: "desc" }],
  });
  return serializeDecimalsList(projects);
}

export async function countStudioProjects() {
  const user = await currentUser();
  return prismadb.studioProject.count({ where: { deletedAt: null, currency: "INR", account: { is: accountReadScopeWhere(user) } } });
}

export async function listInvoiceProjectOptions() {
  const user = await currentUser();
  return prismadb.studioProject.findMany({
    where: { deletedAt: null, status: { not: "CANCELLED" }, currency: "INR", account: { is: accountReadScopeWhere(user) } },
    select: { id: true, code: true, name: true, accountId: true, account: { select: { name: true } } },
    orderBy: [{ name: "asc" }],
    take: 500,
  });
}

export async function getStudioProject(projectId: string) {
  const user = await currentUser();
  const project = await prismadb.studioProject.findFirst({
    where: { id: projectId, deletedAt: null, account: { is: accountReadScopeWhere(user) } },
    include: {
      account: { select: { id: true, name: true, email: true } },
      opportunity: { select: { id: true, name: true, expected_revenue: true, currency: true } },
      milestones: { orderBy: { sortOrder: "asc" } },
      invoices: { where: { currency: "INR" }, orderBy: { createdAt: "desc" }, select: { id: true, number: true, type: true, status: true, currency: true, issueDate: true, grandTotal: true, paidTotal: true, balanceDue: true } },
      ...(user.role !== "partner" ? { expenses: { where: { currency: "INR" }, orderBy: [{ incurredOn: "desc" }, { createdAt: "desc" }] } } : {}),
      ...(["manager", "admin"].includes(user.role) ? { vendorBills: { where: { currency: "INR" }, orderBy: [{ dueDate: "asc" }, { invoiceDate: "desc" }], include: { vendor: { select: { id: true, name: true } } } } } : {}),
    },
  });
  if (!project) throw new StudioProjectServiceError("Project not found", "NOT_FOUND");
  if (project.currency !== "INR") throw new StudioProjectServiceError("This project must be reviewed by an admin before new finance entries can be added", "INVALID");
  const projectManager = project.projectManagerId
    ? await prismadb.users.findUnique({ where: { id: project.projectManagerId }, select: { name: true, email: true } })
    : null;
  return serializeDecimals({
    ...project,
    expenses: "expenses" in project ? project.expenses : [],
    vendorBills: "vendorBills" in project ? project.vendorBills : [],
    projectManagerName: projectManager?.name || projectManager?.email || null,
    canReviewExpenses: ["manager", "admin"].includes(user.role),
    canSeeInternalCosts: user.role !== "partner",
  });
}

export async function getStudioProjectOpportunities() {
  const user = await currentUser();
  const opportunities = await prismadb.crm_Opportunities.findMany({
    where: { ...opportunityReadScopeWhere(user), status: "ACTIVE", currency: "INR", account: { not: null } },
    select: {
      id: true, name: true, expected_revenue: true, currency: true, account: true,
      assigned_account: { select: { id: true, name: true } },
      studioProject: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return serializeDecimalsList(opportunities.filter((item) => !item.studioProject));
}

export async function createStudioProject(input: {
  opportunityId: string;
  name: string;
  siteAddress?: string;
  floorAreaSqFt?: string;
  scopeOfWork?: string;
  contractValue?: string;
  startDate?: Date;
  targetHandoverDate?: Date;
}) {
  const user = await currentUser("projects.manage");
  const opportunityId = input.opportunityId.trim();
  if (!opportunityId || !input.name.trim()) throw new StudioProjectServiceError("Choose an opportunity and enter a project name", "INVALID");

  try { await assertCanWriteOpportunity(user, opportunityId, PARTNER_EDIT); }
  catch (error) {
    if (error instanceof AuthorizationError) throw new StudioProjectServiceError("You cannot activate this opportunity", "FORBIDDEN");
    throw error;
  }

  const opportunity = await prismadb.crm_Opportunities.findFirst({
    where: { id: opportunityId, deletedAt: null, status: "ACTIVE", account: { not: null } },
    select: { id: true, account: true, assigned_to: true, name: true, currency: true },
  });
  if (!opportunity?.account) throw new StudioProjectServiceError("An active opportunity linked to a client is required", "INVALID");
  if (opportunity.currency !== "INR") throw new StudioProjectServiceError("Set a verified INR forecast before creating a project", "INVALID");
  try { await assertCanWriteAccount(user, opportunity.account, PARTNER_EDIT); }
  catch (error) {
    if (error instanceof AuthorizationError) throw new StudioProjectServiceError("You cannot manage this client account", "FORBIDDEN");
    throw error;
  }

  const existing = await prismadb.studioProject.findUnique({ where: { opportunityId }, select: { id: true } });
  if (existing) return { projectId: existing.id, alreadyExists: true };

  const project = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "crm_Opportunities" WHERE "id" = ${opportunityId}::uuid FOR UPDATE`;
    const retry = await tx.studioProject.findUnique({ where: { opportunityId }, select: { id: true } });
    if (retry) return { id: retry.id, created: false };
    const created = await tx.studioProject.create({
      data: {
        name: input.name.trim(),
        accountId: opportunity.account!,
        opportunityId,
        siteAddress: input.siteAddress?.trim() || null,
        floorAreaSqFt: input.floorAreaSqFt ? new Decimal(input.floorAreaSqFt).toString() : null,
        scopeOfWork: input.scopeOfWork?.trim() || null,
        contractValue: input.contractValue ? new Decimal(input.contractValue).toString() : null,
        currency: "INR",
        startDate: input.startDate,
        targetHandoverDate: input.targetHandoverDate,
        projectManagerId: opportunity.assigned_to ?? user.id,
        createdBy: user.id,
        updatedBy: user.id,
        milestones: {
          create: [
            { name: "Design approval", sortOrder: 10, createdBy: user.id },
            { name: "Detailed drawings", sortOrder: 20, createdBy: user.id },
            { name: "Procurement complete", sortOrder: 30, createdBy: user.id },
            { name: "Execution complete", sortOrder: 40, createdBy: user.id },
            { name: "Client handover", sortOrder: 50, createdBy: user.id },
          ],
        },
      },
      select: { id: true },
    });
    return { id: created.id, created: true };
  });

  if (project.created) {
    try {
      await writeAuditLog({
        entityType: "studio_project", entityId: project.id, action: "created",
        changes: [
          { field: "opportunityId", old: null, new: opportunityId },
          { field: "accountId", old: null, new: opportunity.account },
        ], userId: user.id,
      });
    } catch (error) { console.error("[createStudioProject] Audit event failed after create", error); }
  }
  return { projectId: project.id, alreadyExists: !project.created };
}

export async function updateStudioProjectStatus(projectId: string, status: StudioProjectStatus) {
  const user = await currentUser("projects.manage");
  if (!STUDIO_PROJECT_STATUSES.includes(status)) throw new StudioProjectServiceError("Invalid project status", "INVALID");
  const project = await prismadb.studioProject.findFirst({ where: { id: projectId, deletedAt: null, account: { is: accountReadScopeWhere(user) } }, select: { id: true, accountId: true, status: true } });
  if (!project) throw new StudioProjectServiceError("Project not found", "NOT_FOUND");
  try { await assertCanWriteAccount(user, project.accountId, PARTNER_EDIT); }
  catch (error) {
    if (error instanceof AuthorizationError) throw new StudioProjectServiceError("You cannot update this project", "FORBIDDEN");
    throw error;
  }
  const updated = await prismadb.studioProject.update({ where: { id: project.id }, data: { status, updatedBy: user.id } });
  try { await writeAuditLog({ entityType: "studio_project", entityId: project.id, action: "updated", changes: [{ field: "status", old: project.status, new: status }], userId: user.id }); }
  catch (error) { console.error("[updateStudioProjectStatus] Audit event failed after update", error); }
  return serializeDecimals(updated);
}

export async function setStudioProjectMilestoneComplete(projectId: string, milestoneId: string, complete: boolean) {
  const user = await currentUser("projects.manage");
  const project = await prismadb.studioProject.findFirst({ where: { id: projectId, deletedAt: null, account: { is: accountReadScopeWhere(user) } }, select: { id: true, accountId: true } });
  if (!project) throw new StudioProjectServiceError("Project not found", "NOT_FOUND");
  try { await assertCanWriteAccount(user, project.accountId, PARTNER_EDIT); }
  catch (error) {
    if (error instanceof AuthorizationError) throw new StudioProjectServiceError("You cannot update this project", "FORBIDDEN");
    throw error;
  }
  const milestone = await prismadb.studioProjectMilestone.findFirst({ where: { id: milestoneId, projectId }, select: { id: true, completedAt: true } });
  if (!milestone) throw new StudioProjectServiceError("Milestone not found", "NOT_FOUND");
  const completedAt = complete ? (milestone.completedAt ?? new Date()) : null;
  const updated = await prismadb.studioProjectMilestone.update({ where: { id: milestone.id }, data: { completedAt } });
  try { await writeAuditLog({ entityType: "studio_project", entityId: project.id, action: "updated", changes: [{ field: `milestone.${milestoneId}.completedAt`, old: milestone.completedAt, new: completedAt }], userId: user.id }); }
  catch (error) { console.error("[setStudioProjectMilestoneComplete] Audit event failed after update", error); }
  return updated;
}

export async function updateStudioProjectMilestoneDueDate(projectId: string, milestoneId: string, dueDate: Date | null) {
  const user = await currentUser("projects.manage");
  const project = await prismadb.studioProject.findFirst({
    where: { id: projectId, deletedAt: null, account: { is: accountReadScopeWhere(user) } },
    select: { id: true, accountId: true },
  });
  if (!project) throw new StudioProjectServiceError("Project not found", "NOT_FOUND");
  try { await assertCanWriteAccount(user, project.accountId, PARTNER_EDIT); }
  catch (error) {
    if (error instanceof AuthorizationError) throw new StudioProjectServiceError("You cannot update this project", "FORBIDDEN");
    throw error;
  }
  const milestone = await prismadb.studioProjectMilestone.findFirst({
    where: { id: milestoneId, projectId }, select: { id: true, dueDate: true, name: true },
  });
  if (!milestone) throw new StudioProjectServiceError("Milestone not found", "NOT_FOUND");
  const updated = await prismadb.studioProjectMilestone.update({ where: { id: milestone.id }, data: { dueDate } });
  try { await writeAuditLog({ entityType: "studio_project", entityId: project.id, action: "updated", changes: [{ field: `milestone.${milestoneId}.dueDate`, old: milestone.dueDate, new: dueDate }], userId: user.id }); }
  catch (error) { console.error("[updateStudioProjectMilestoneDueDate] Audit event failed after update", error); }
  return updated;
}

export async function createStudioProjectExpense(input: {
  projectId: string; category: string; vendorName?: string; description: string;
  reference?: string; amount: string; incurredOn: Date;
}) {
  const user = await currentUser("projects.manage");
  if (user.role === "partner") throw new StudioProjectServiceError("External partner users cannot submit internal project costs", "FORBIDDEN");
  try { await requirePermission("finance.manage"); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new StudioProjectServiceError("Finance access is required", "FORBIDDEN");
    throw error;
  }
  const project = await prismadb.studioProject.findFirst({
    where: { id: input.projectId, deletedAt: null, status: { not: "CANCELLED" }, account: { is: accountReadScopeWhere(user) } },
    select: { id: true, accountId: true, currency: true },
  });
  if (!project) throw new StudioProjectServiceError("Project not found", "NOT_FOUND");
  if (project.currency !== "INR") throw new StudioProjectServiceError("This project must be reviewed by an admin before new finance entries can be added", "INVALID");
  try { await assertCanWriteAccount(user, project.accountId, PARTNER_EDIT); }
  catch (error) {
    if (error instanceof AuthorizationError) throw new StudioProjectServiceError("You cannot submit expenses for this project", "FORBIDDEN");
    throw error;
  }
  const created = await prismadb.studioProjectExpense.create({ data: {
    projectId: project.id, category: input.category.trim(), vendorName: input.vendorName?.trim() || null,
    description: input.description.trim(), reference: input.reference?.trim() || null,
    amount: new Decimal(input.amount).toDecimalPlaces(2).toString(), currency: "INR",
    incurredOn: input.incurredOn, submittedBy: user.id,
  } });
  try { await writeAuditLog({ entityType: "studio_project_expense", entityId: created.id, action: "created", changes: [
    { field: "projectId", old: null, new: project.id }, { field: "amount", old: null, new: created.amount.toString() },
    { field: "status", old: null, new: "SUBMITTED" },
  ], userId: user.id }); }
  catch (error) { console.error("[createStudioProjectExpense] Audit event failed after create", error); }
  return serializeDecimals(created);
}

export async function reviewStudioProjectExpense(expenseId: string, decision: "APPROVED" | "REJECTED", note?: string) {
  try { await requirePermission("projects.manage"); await requirePermission("finance.manage"); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new StudioProjectServiceError("Finance and project access are required", "FORBIDDEN");
    throw error;
  }
  let user;
  try { user = await requireRole(["manager", "admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new StudioProjectServiceError("Manager access is required", "FORBIDDEN");
    throw error;
  }
  const result = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "StudioProjectExpense" WHERE "id" = ${expenseId}::uuid FOR UPDATE`;
    const current = await tx.studioProjectExpense.findUnique({ where: { id: expenseId }, select: { id: true, status: true, amount: true, projectId: true } });
    if (!current) return { error: "Expense not found" as const };
    if (current.status !== "SUBMITTED") return { error: "Only submitted expenses can be reviewed" as const };
    const updated = await tx.studioProjectExpense.update({ where: { id: current.id }, data: {
      status: decision, approvedBy: user.id, approvedAt: new Date(), approvalNote: note?.trim().slice(0, 1000) || null,
    } });
    return { expense: updated, projectId: current.projectId, oldStatus: current.status };
  });
  if ("error" in result) throw new StudioProjectServiceError(result.error ?? "Expense review failed", result.error === "Expense not found" ? "NOT_FOUND" : "INVALID");
  try { await writeAuditLog({ entityType: "studio_project_expense", entityId: expenseId, action: "updated", changes: [
    { field: "status", old: result.oldStatus, new: decision }, { field: "approvalNote", old: null, new: note?.trim().slice(0, 1000) || null },
  ], userId: user.id }); }
  catch (error) { console.error("[reviewStudioProjectExpense] Audit event failed after update", error); }
  return serializeDecimals(result.expense);
}

export async function markStudioProjectExpensePaid(expenseId: string, treasuryAccountId: string, paymentReference: string) {
  try { await requirePermission("projects.manage"); await requirePermission("finance.manage"); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new StudioProjectServiceError("Finance and project access are required", "FORBIDDEN");
    throw error;
  }
  let user;
  try { user = await requireRole(["manager", "admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new StudioProjectServiceError("Manager access is required", "FORBIDDEN");
    throw error;
  }
  const result = await prismadb.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "StudioProjectExpense" WHERE "id" = ${expenseId}::uuid FOR UPDATE`;
    const current = await tx.studioProjectExpense.findUnique({ where: { id: expenseId }, select: { id: true, status: true, projectId: true, amount: true, currency: true, description: true } });
    if (!current) return { error: "Expense not found" as const };
    if (current.currency !== "INR") return { error: "This expense must be reviewed by an admin before payment" as const };
    if (current.status !== "APPROVED") return { error: "Only approved expenses can be marked paid" as const };
    await tx.$queryRaw`SELECT "id" FROM "TreasuryAccount" WHERE "id" = ${treasuryAccountId}::uuid FOR UPDATE`;
    const account = await tx.treasuryAccount.findFirst({ where: { id: treasuryAccountId, active: true } });
    if (!account || account.currency !== current.currency) return { error: "Choose an active cash account with this expense's currency" as const };
    const balance = await tx.treasuryEntry.aggregate({ where: { accountId: account.id }, _sum: { amount: true } });
    if (new Decimal(balance._sum.amount?.toString() ?? "0").lt(current.amount.toString())) return { error: "Payment exceeds the available recorded cash balance" as const };
    await tx.treasuryTransaction.create({ data: {
      type: "PROJECT_EXPENSE", amount: current.amount, currency: current.currency, reference: paymentReference.trim(),
      description: current.description, occurredAt: new Date(), sourceType: "project_expense", sourceId: expenseId, createdBy: user.id,
      entries: { create: { accountId: account.id, amount: new Decimal(current.amount.toString()).negated(), currency: current.currency } },
    } });
    const updated = await tx.studioProjectExpense.update({ where: { id: expenseId }, data: { status: "PAID", paidAt: new Date() } });
    return { expense: updated, oldStatus: current.status };
  });
  if ("error" in result) throw new StudioProjectServiceError(result.error ?? "Expense payment failed", result.error === "Expense not found" ? "NOT_FOUND" : "INVALID");
  try { await writeAuditLog({ entityType: "studio_project_expense", entityId: expenseId, action: "updated", changes: [{ field: "status", old: result.oldStatus, new: "PAID" }], userId: user.id }); }
  catch (error) { console.error("[markStudioProjectExpensePaid] Audit event failed after update", error); }
  return serializeDecimals(result.expense);
}
