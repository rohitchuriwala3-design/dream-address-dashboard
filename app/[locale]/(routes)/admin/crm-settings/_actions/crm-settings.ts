"use server";

import { z } from "zod";
import { prismadb as prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { STAGE_KINDS, type StageKind } from "@/lib/crm/stage-kinds";
import { withEffectiveStageOrder } from "@/lib/crm/stage-order";
import { getLeadFieldSettings, saveLeadFieldSettings, type LeadFieldSettings } from "@/lib/crm/leads/field-settings";

async function ensureAdmin(): Promise<{ error: string } | null> {
  try {
    await requireRole(["admin"]);
    return null;
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }
}

export type CrmConfigType =
  | "industry"
  | "contactType"
  | "leadSource"
  | "leadStatus"
  | "leadType"
  | "opportunityType"
  | "salesStage";

export type ConfigValue = {
  id: string;
  name: string;
  usageCount: number;
  /** Automation trigger — populated for salesStage rows only. */
  stageKind?: string | null;
  stageOrder?: number | null;
  probability?: number | null;
};

export async function getAdminLeadFieldSettings(): Promise<LeadFieldSettings> {
  const denied = await ensureAdmin();
  if (denied) throw new Error(denied.error);
  return getLeadFieldSettings();
}

export async function updateAdminLeadFieldSettings(input: unknown): Promise<void> {
  const denied = await ensureAdmin();
  if (denied) throw new Error(denied.error);
  await saveLeadFieldSettings(input);
  revalidatePath("/", "layout");
}

const nameSchema = z.string().trim().min(1, "Name is required").max(100, "Max 100 characters");
const stageKindSchema = z.enum(STAGE_KINDS).nullable().optional();
const stageOrderSchema = z.number().int().min(0).max(1000);
const probabilitySchema = z.number().int().min(0).max(100);

const configMap = {
  industry:        { model: () => prisma.crm_Industry_Type,               countRelation: "accounts",                              updateMany: null },
  contactType:     { model: () => prisma.crm_Contact_Types,               countRelation: "contacts",                              updateMany: () => prisma.crm_Contacts },
  leadSource:      { model: () => prisma.crm_Lead_Sources,                countRelation: "leads",                                 updateMany: () => prisma.crm_Leads },
  leadStatus:      { model: () => prisma.crm_Lead_Statuses,               countRelation: "leads",                                 updateMany: () => prisma.crm_Leads },
  leadType:        { model: () => prisma.crm_Lead_Types,                  countRelation: "leads",                                 updateMany: () => prisma.crm_Leads },
  opportunityType: { model: () => prisma.crm_Opportunities_Type,          countRelation: "assigned_opportunities",                updateMany: null },
  salesStage:      { model: () => prisma.crm_Opportunities_Sales_Stages,  countRelation: "assigned_opportunities_sales_stage",    updateMany: null },
} as const;

const fkField: Record<CrmConfigType, string | null> = {
  industry:        "industry",
  contactType:     "contact_type_id",
  leadSource:      "lead_source_id",
  leadStatus:      "lead_status_id",
  leadType:        "lead_type_id",
  opportunityType: "type",
  salesStage:      "sales_stage",
};

export async function getConfigValues(configType: CrmConfigType): Promise<ConfigValue[]> {
  const denied = await ensureAdmin();
  if (denied) throw new Error(denied.error);
  const { model, countRelation } = configMap[configType];
  const rows = await (model() as any).findMany({
    include: { _count: { select: { [countRelation]: true } } },
    orderBy: configType === "salesStage" ? [{ order: "asc" }, { probability: "asc" }, { name: "asc" }] : { name: "asc" },
  });
  const orderedRows: any[] = configType === "salesStage" ? withEffectiveStageOrder(rows) : rows;
  return orderedRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    usageCount: r._count[countRelation] ?? 0,
    ...(configType === "salesStage" ? { stageKind: r.stage_kind ?? null } : {}),
    ...(configType === "salesStage" ? { stageOrder: r.order, probability: r.probability ?? null } : {}),
  }));
}

export async function createConfigValue(
  configType: CrmConfigType,
  name: string,
  stageKind?: StageKind | null,
  stageOrder?: number,
  probability?: number
): Promise<void> {
  const denied = await ensureAdmin();
  if (denied) throw new Error(denied.error);
  const parsed = nameSchema.parse(name);
  const { model } = configMap[configType];
  const data: Record<string, unknown> = { name: parsed, v: 0 };
  if (configType === "salesStage" && stageKind !== undefined) {
    data.stage_kind = stageKindSchema.parse(stageKind) ?? null;
  }
  if (configType === "salesStage") {
    data.order = stageOrderSchema.parse(stageOrder ?? 10);
    data.probability = probabilitySchema.parse(probability ?? 0);
  }
  await (model() as any).create({ data });
  revalidatePath("/", "layout");
}

export async function updateConfigValue(
  configType: CrmConfigType,
  id: string,
  name: string,
  stageKind?: StageKind | null,
  stageOrder?: number,
  probability?: number
): Promise<void> {
  const denied = await ensureAdmin();
  if (denied) throw new Error(denied.error);
  const parsed = nameSchema.parse(name);
  const { model } = configMap[configType];
  const data: Record<string, unknown> = { name: parsed };
  if (configType === "salesStage" && stageKind !== undefined) {
    data.stage_kind = stageKindSchema.parse(stageKind) ?? null;
  }
  if (configType === "salesStage") {
    if (stageOrder !== undefined) data.order = stageOrderSchema.parse(stageOrder);
    if (probability !== undefined) data.probability = probabilitySchema.parse(probability);
  }
  await (model() as any).update({ where: { id }, data });
  revalidatePath("/", "layout");
}

export async function deleteConfigValue(
  configType: CrmConfigType,
  id: string,
  replacementId?: string
): Promise<void> {
  const denied = await ensureAdmin();
  if (denied) throw new Error(denied.error);
  if (replacementId !== undefined && replacementId === id) {
    throw new Error("replacementId must differ from id");
  }

  const { model, updateMany } = configMap[configType];

  if (replacementId && !updateMany) {
    throw new Error(`Config type does not support reassignment`);
  }
  const field = fkField[configType];

  if (replacementId && updateMany && field) {
    await prisma.$transaction([
      (updateMany() as any).updateMany({
        where: { [field]: id },
        data: { [field]: replacementId },
      }),
      (model() as any).delete({ where: { id } }),
    ]);
  } else {
    await (model() as any).delete({ where: { id } });
  }

  revalidatePath("/", "layout");
}
