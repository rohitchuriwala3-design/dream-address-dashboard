"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createStudioProject, createStudioProjectExpense, markStudioProjectExpensePaid, reviewStudioProjectExpense, StudioProjectServiceError, updateStudioProjectStatus, setStudioProjectMilestoneComplete, updateStudioProjectMilestoneDueDate } from "./service";
import type { StudioProjectStatus } from "./status";

const amount = z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a valid non-negative amount").optional().or(z.literal(""));
const area = z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "Enter a valid area").optional().or(z.literal(""));
const expenseSchema = z.object({
  projectId: z.string().uuid(), category: z.string().trim().min(2).max(80),
  vendorName: z.string().trim().max(160).optional(), description: z.string().trim().min(2).max(1000),
  reference: z.string().trim().max(120).optional(), amount: z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter a positive amount"),
  incurredOn: z.string().date(),
});

const createSchema = z.object({
  opportunityId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  siteAddress: z.string().trim().max(500).optional(),
  floorAreaSqFt: area,
  scopeOfWork: z.string().trim().max(5000).optional(),
  contractValue: amount,
  startDate: z.string().date().optional().or(z.literal("")),
  targetHandoverDate: z.string().date().optional().or(z.literal("")),
});

export async function createStudioProjectAction(raw: unknown) {
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the project details" };
  const value = parsed.data;
  try {
    const result = await createStudioProject({
      opportunityId: value.opportunityId,
      name: value.name,
      siteAddress: value.siteAddress,
      floorAreaSqFt: value.floorAreaSqFt || undefined,
      scopeOfWork: value.scopeOfWork,
      contractValue: value.contractValue || undefined,
      startDate: value.startDate ? new Date(value.startDate) : undefined,
      targetHandoverDate: value.targetHandoverDate ? new Date(value.targetHandoverDate) : undefined,
    });
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    return result;
  } catch (error) {
    if (error instanceof StudioProjectServiceError) return { error: error.message };
    console.error("[createStudioProjectAction]", error);
    return { error: "Project could not be created. Please retry." };
  }
}

export async function updateStudioProjectStatusAction(projectId: string, status: StudioProjectStatus) {
  try {
    await updateStudioProjectStatus(projectId, status);
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    revalidatePath("/[locale]/(routes)/studio-projects/[projectId]", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof StudioProjectServiceError) return { error: error.message };
    console.error("[updateStudioProjectStatusAction]", error);
    return { error: "Project status could not be updated" };
  }
}

export async function setStudioProjectMilestoneCompleteAction(projectId: string, milestoneId: string, complete: boolean) {
  try {
    await setStudioProjectMilestoneComplete(projectId, milestoneId, complete);
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    revalidatePath("/[locale]/(routes)/studio-projects/[projectId]", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof StudioProjectServiceError) return { error: error.message };
    console.error("[setStudioProjectMilestoneCompleteAction]", error);
    return { error: "Milestone could not be updated" };
  }
}

export async function updateStudioProjectMilestoneDueDateAction(projectId: string, milestoneId: string, value: string) {
  if (!z.string().uuid().safeParse(projectId).success || !z.string().uuid().safeParse(milestoneId).success)
    return { error: "Invalid project or milestone" };
  if (value && !z.string().date().safeParse(value).success) return { error: "Enter a valid due date" };
  try {
    await updateStudioProjectMilestoneDueDate(projectId, milestoneId, value ? new Date(`${value}T12:00:00+05:30`) : null);
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    revalidatePath("/[locale]/(routes)/studio-projects/[projectId]", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof StudioProjectServiceError) return { error: error.message };
    console.error("[updateStudioProjectMilestoneDueDateAction]", error);
    return { error: "Milestone due date could not be updated" };
  }
}

export async function createStudioProjectExpenseAction(raw: unknown) {
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the expense details" };
  if (Number(parsed.data.amount) <= 0) return { error: "Expense amount must be greater than zero" };
  try {
    const expense = await createStudioProjectExpense({ ...parsed.data, incurredOn: new Date(`${parsed.data.incurredOn}T12:00:00+05:30`) });
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    revalidatePath("/[locale]/(routes)/studio-projects/[projectId]", "page");
    return { success: true, expenseId: expense.id };
  } catch (error) {
    if (error instanceof StudioProjectServiceError) return { error: error.message };
    console.error("[createStudioProjectExpenseAction]", error);
    return { error: "Expense could not be submitted" };
  }
}

export async function reviewStudioProjectExpenseAction(expenseId: string, decision: "APPROVED" | "REJECTED", note?: string) {
  if (!z.string().uuid().safeParse(expenseId).success || !["APPROVED", "REJECTED"].includes(decision)) return { error: "Invalid expense review" };
  if (decision === "REJECTED" && !note?.trim()) return { error: "Add a reason when rejecting an expense" };
  try {
    await reviewStudioProjectExpense(expenseId, decision, note);
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    revalidatePath("/[locale]/(routes)/studio-projects/[projectId]", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof StudioProjectServiceError) return { error: error.message };
    console.error("[reviewStudioProjectExpenseAction]", error);
    return { error: "Expense review could not be saved" };
  }
}

export async function markStudioProjectExpensePaidAction(expenseId: string, treasuryAccountId: string, paymentReference: string) {
  if (!z.string().uuid().safeParse(expenseId).success || !z.string().uuid().safeParse(treasuryAccountId).success || !z.string().trim().min(2).max(160).safeParse(paymentReference).success) return { error: "Choose a cash account and enter the payment reference" };
  try {
    await markStudioProjectExpensePaid(expenseId, treasuryAccountId, paymentReference);
    revalidatePath("/[locale]/(routes)/studio-projects", "page");
    revalidatePath("/[locale]/(routes)/studio-projects/[projectId]", "page");
    return { success: true };
  } catch (error) {
    if (error instanceof StudioProjectServiceError) return { error: error.message };
    console.error("[markStudioProjectExpensePaidAction]", error);
    return { error: "Expense payment status could not be saved" };
  }
}
