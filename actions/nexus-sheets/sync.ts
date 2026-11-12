"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, AuthenticationError, AuthorizationError } from "@/lib/authz";
import { auditNexusMasterSheet, getNexusSheetsConfiguration } from "@/lib/nexus-sheets/read-only-audit";
import { getNexusSheetTargetChoices, nexusSheetTargetExists, SHEET_ENTITY_OPTIONS } from "@/lib/nexus-sheets/crosswalk";
import { writeAuditLog } from "@/lib/audit-log";

async function requireAdmin() {
  try { return await requireRole(["admin"]); }
  catch (error) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) throw new Error("Administrator access is required");
    throw error;
  }
}

export async function getNexusSheetsStatus() {
  await requireAdmin();
  const config = getNexusSheetsConfiguration();
  const [latestRuns, crosswalks] = await Promise.all([
    prismadb.nexusSheetSyncRun.findMany({
      take: 10, orderBy: { startedAt: "desc" },
      select: { id: true, mode: true, status: true, startedAt: true, finishedAt: true, tabsScanned: true, rowsScanned: true, issueCount: true, error: true },
    }),
    prismadb.nexusSheetCrosswalk.findMany({
      where: { spreadsheetId: config.spreadsheetId }, take: 200, orderBy: { updatedAt: "desc" },
      select: { id: true, sheetTab: true, sheetKey: true, entityType: true, appRecordId: true, note: true, updatedAt: true },
    }),
  ]);
  return { ...config, latestRuns, crosswalks };
}

export async function runNexusSheetsReadOnlyAudit() {
  const actor = await requireAdmin();
  const config = getNexusSheetsConfiguration();
  const run = await prismadb.nexusSheetSyncRun.create({
    data: { actorId: actor.id, mode: "READ_ONLY_AUDIT", status: "RUNNING" },
    select: { id: true },
  });
  if (!config.configured) {
    const error = `Missing ${config.missing.join(" and ")}.`;
    await prismadb.nexusSheetSyncRun.update({
      where: { id: run.id },
      data: { status: "CONFIGURATION_REQUIRED", finishedAt: new Date(), error },
    });
    return { error, runId: run.id };
  }

  try {
    const result = await auditNexusMasterSheet();
    const summary = {
      spreadsheetTitle: result.spreadsheetTitle,
      spreadsheetId: result.spreadsheetId,
      tabs: result.tabs,
      issues: result.issues,
    };
    await prismadb.nexusSheetSyncRun.update({
      where: { id: run.id },
      data: {
        status: "READ_ONLY_AUDIT_COMPLETED",
        finishedAt: new Date(),
        tabsScanned: result.tabsScanned,
        rowsScanned: result.rowsScanned,
        issueCount: result.issues.reduce((sum, issue) => sum + issue.count, 0),
        summary,
      },
    });
    return { runId: run.id, result };
  } catch (error) {
    console.error("[runNexusSheetsReadOnlyAudit] Google Sheets read failed", error instanceof Error ? error.name : "unknown error");
    const message = "Google Sheets read failed. Confirm the service account has read access to the master workbook and that the key is valid.";
    await prismadb.nexusSheetSyncRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: message } });
    return { error: message, runId: run.id };
  }
}

export async function getNexusSheetCrosswalkChoicesAction(sheetTab: string) {
  await requireAdmin();
  if (!Object.hasOwn(SHEET_ENTITY_OPTIONS, sheetTab)) return { error: "This tab has no direct application entity mapping" };
  try { return { choices: await getNexusSheetTargetChoices(sheetTab) }; }
  catch (error) { console.error("[getNexusSheetCrosswalkChoicesAction]", error); return { error: "Application records could not be loaded" }; }
}

export async function saveNexusSheetCrosswalkAction(raw: unknown) {
  const actor = await requireAdmin();
  const schema = z.object({
    sheetTab: z.string().min(1).max(80), sheetKey: z.string().trim().min(1).max(200),
    entityType: z.string().min(1).max(40), appRecordId: z.string().uuid(), note: z.string().max(500).optional(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the crosswalk mapping" };
  const { sheetTab, sheetKey, entityType, appRecordId, note } = parsed.data;
  if (!(SHEET_ENTITY_OPTIONS[sheetTab] ?? []).includes(entityType)) return { error: "Choose an allowed application record type for this Sheet tab" };
  const config = getNexusSheetsConfiguration();
  if (!(await nexusSheetTargetExists(entityType, appRecordId))) return { error: "The selected application record does not exist for this record type" };
  try {
    const existing = await prismadb.nexusSheetCrosswalk.findUnique({
      where: { spreadsheetId_sheetTab_sheetKey: { spreadsheetId: config.spreadsheetId, sheetTab, sheetKey } },
    });
    const mapping = existing
      ? await prismadb.nexusSheetCrosswalk.update({ where: { id: existing.id }, data: { entityType, appRecordId, note: note?.trim() || null } })
      : await prismadb.nexusSheetCrosswalk.create({ data: { spreadsheetId: config.spreadsheetId, sheetTab, sheetKey, entityType, appRecordId, note: note?.trim() || null, createdBy: actor.id } });
    await writeAuditLog({ entityType: "sheet_crosswalk", entityId: mapping.id, action: existing ? "updated" : "created", userId: actor.id, changes: [
      { field: "sheetTab", old: existing?.sheetTab ?? null, new: sheetTab },
      { field: "sheetKey", old: existing?.sheetKey ?? null, new: sheetKey },
      { field: "entityType", old: existing?.entityType ?? null, new: entityType },
      { field: "appRecordId", old: existing?.appRecordId ?? null, new: appRecordId },
      { field: "note", old: existing?.note ?? null, new: note?.trim() || null },
    ] });
    revalidatePath("/[locale]/(routes)/admin/integrations/sheets", "page");
    return { success: true };
  } catch (error) {
    if ((error as { code?: string })?.code === "P2002") return { error: "This application record is already linked to another Sheet row" };
    console.error("[saveNexusSheetCrosswalkAction]", error);
    return { error: "Crosswalk mapping could not be saved" };
  }
}

export async function runNexusSheetCrosswalkDryRun() {
  const actor = await requireAdmin();
  const config = getNexusSheetsConfiguration();
  const run = await prismadb.nexusSheetSyncRun.create({ data: { actorId: actor.id, mode: "CROSSWALK_DRY_RUN", status: "RUNNING" }, select: { id: true } });
  if (!config.configured) {
    const error = `Missing ${config.missing.join(" and ")}.`;
    await prismadb.nexusSheetSyncRun.update({ where: { id: run.id }, data: { status: "CONFIGURATION_REQUIRED", finishedAt: new Date(), error } });
    return { error, runId: run.id };
  }
  try {
    const [sheet, mappings] = await Promise.all([
      auditNexusMasterSheet({ includeKeys: true }),
      prismadb.nexusSheetCrosswalk.findMany({ where: { spreadsheetId: config.spreadsheetId } }),
    ]);
    const preview = [] as Array<{ tab: string; rows: number; mapped: number; unmapped: number; stale: number; duplicate: number; unsupported: number; unmappedKeys: string[]; staleKeys: string[]; duplicateKeys: string[] }>;
    for (const tab of sheet.tabs) {
      const keys = tab.keys ?? [];
      const allowed = SHEET_ENTITY_OPTIONS[tab.name] ?? [];
      const duplicateKeys = Array.from(new Set(keys.filter((key, index) => keys.indexOf(key) !== index))).slice(0, 50);
      const frequencies = new Map<string, number>();
      keys.forEach((key) => frequencies.set(key, (frequencies.get(key) ?? 0) + 1));
      const uniqueKeys = Array.from(frequencies.keys());
      let mapped = 0; let stale = 0;
      const unmappedKeys: string[] = []; const staleKeys: string[] = [];
      for (const key of uniqueKeys) {
        if ((frequencies.get(key) ?? 0) > 1) continue;
        if (allowed.length === 0) continue;
        const mapping = mappings.find((candidate) => candidate.sheetTab === tab.name && candidate.sheetKey === key);
        if (!mapping) { if (unmappedKeys.length < 50) unmappedKeys.push(key); continue; }
        if (!allowed.includes(mapping.entityType) || !(await nexusSheetTargetExists(mapping.entityType, mapping.appRecordId))) {
          stale++;
          if (staleKeys.length < 50) staleKeys.push(key);
          continue;
        }
        mapped++;
      }
      const duplicate = Array.from(frequencies.values()).filter((count) => count > 1).length;
      const unsupported = allowed.length === 0 ? keys.length : 0;
      preview.push({ tab: tab.name, rows: tab.rowsScanned, mapped, unmapped: allowed.length ? Math.max(0, uniqueKeys.length - duplicate - mapped - stale) : 0, stale, duplicate, unsupported, unmappedKeys, staleKeys, duplicateKeys });
    }
    const summary = { spreadsheetTitle: sheet.spreadsheetTitle, spreadsheetId: sheet.spreadsheetId, tabs: preview.map(({ unmappedKeys, staleKeys, duplicateKeys, ...counts }) => counts), structuralIssues: sheet.issues };
    const issueCount = preview.reduce((sum, tab) => sum + tab.unmapped + tab.stale + tab.duplicate + tab.unsupported, 0) + sheet.issues.reduce((sum, issue) => sum + issue.count, 0);
    await prismadb.nexusSheetSyncRun.update({ where: { id: run.id }, data: {
      status: "CROSSWALK_DRY_RUN_COMPLETED", finishedAt: new Date(), tabsScanned: sheet.tabsScanned, rowsScanned: sheet.rowsScanned, issueCount, summary,
    } });
    return { runId: run.id, result: { spreadsheetTitle: sheet.spreadsheetTitle, tabs: preview, structuralIssues: sheet.issues } };
  } catch (error) {
    console.error("[runNexusSheetCrosswalkDryRun]", error instanceof Error ? error.name : "unknown error");
    const message = "Read-only crosswalk preview failed. Confirm Sheets access and the PostgreSQL migration are available.";
    await prismadb.nexusSheetSyncRun.update({ where: { id: run.id }, data: { status: "FAILED", finishedAt: new Date(), error: message } });
    return { error: message, runId: run.id };
  }
}
