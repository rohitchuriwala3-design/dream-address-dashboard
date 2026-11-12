"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { runNexusSheetCrosswalkDryRun, getNexusSheetCrosswalkChoicesAction, saveNexusSheetCrosswalkAction } from "@/actions/nexus-sheets/sync";
import type { NexusSheetTargetChoice } from "@/lib/nexus-sheets/crosswalk";
import type { SheetAuditIssue } from "@/lib/nexus-sheets/read-only-audit";

type TabPreview = {
  tab: string; rows: number; mapped: number; unmapped: number; stale: number; duplicate: number; unsupported: number;
  unmappedKeys: string[]; staleKeys: string[]; duplicateKeys: string[];
};
type Preview = { spreadsheetTitle: string; tabs: TabPreview[]; structuralIssues: SheetAuditIssue[] };

export function SheetsCrosswalkControls({ configured }: { configured: boolean }) {
  const [busy, startTransition] = useTransition();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [choices, setChoices] = useState<Record<string, NexusSheetTargetChoice[]>>({});

  const run = () => startTransition(async () => {
    const response = await runNexusSheetCrosswalkDryRun();
    if ("error" in response) { toast.error(response.error); return; }
    setPreview(response.result);
    const tabs = response.result.tabs.filter((tab) => tab.unmappedKeys.length || tab.staleKeys.length);
    const loaded = await Promise.all(tabs.map(async (tab) => [tab.tab, await getNexusSheetCrosswalkChoicesAction(tab.tab)] as const));
    setChoices(Object.fromEntries(loaded.map(([tab, value]) => [tab, "choices" in value && value.choices ? value.choices : []])));
    toast.success("Read-only crosswalk preview completed");
  });

  const saveMapping = (tabName: string, sheetKey: string, targetValue: string) => startTransition(async () => {
    const [entityType, appRecordId] = targetValue.split("|");
    if (!entityType || !appRecordId) { toast.error("Choose an application record first"); return; }
    const response = await saveNexusSheetCrosswalkAction({ sheetTab: tabName, sheetKey, entityType, appRecordId });
    if ("error" in response) { toast.error(response.error); return; }
    toast.success("Crosswalk mapping saved for review");
    setPreview((current) => current ? ({ ...current, tabs: current.tabs.map((tab) => {
      if (tab.tab !== tabName) return tab;
      const fromUnmapped = tab.unmappedKeys.includes(sheetKey);
      return { ...tab, mapped: tab.mapped + 1, unmapped: Math.max(0, tab.unmapped - (fromUnmapped ? 1 : 0)), stale: Math.max(0, tab.stale - (fromUnmapped ? 0 : 1)), unmappedKeys: tab.unmappedKeys.filter((key) => key !== sheetKey), staleKeys: tab.staleKeys.filter((key) => key !== sheetKey) };
    }) }) : current);
  });

  return <section className="space-y-4 rounded-xl border bg-card p-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Legacy ID crosswalk</h2><p className="mt-1 max-w-3xl text-sm text-muted-foreground">Preview Sheet keys against reviewed app mappings. This action is read-only against Google Sheets; saving a mapping changes only Nexus 360.</p></div><Button onClick={run} disabled={!configured || busy}>{busy ? "Checking mappings…" : "Run read-only preview"}</Button></div>
    {!configured && <p className="text-xs text-muted-foreground">Configure the Sheets service account and apply the crosswalk migration to enable preview.</p>}
    {preview && <div className="space-y-4">
      <p className="text-sm">{preview.spreadsheetTitle} · {preview.tabs.reduce((sum, tab) => sum + tab.rows, 0)} rows inspected</p>
      {preview.tabs.map((tab) => <div key={tab.tab} className="rounded-lg border p-3">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-medium">{tab.tab}</h3><p className="mt-1 text-xs text-muted-foreground">{tab.mapped} mapped · {tab.unmapped} unmapped · {tab.stale} stale · {tab.duplicate} duplicate · {tab.unsupported} unsupported rows</p></div></div>
        {tab.duplicateKeys.length > 0 && <p className="mt-2 text-xs text-amber-800">Duplicate keys need correction in the Sheet before mapping: {tab.duplicateKeys.join(", ")}</p>}
        {tab.unsupported > 0 && <p className="mt-2 text-xs text-amber-800">This tab has no one-to-one application entity yet. Do not force a mapping.</p>}
        {[...tab.unmappedKeys, ...tab.staleKeys].map((key) => <MappingRow key={`${tab.tab}:${key}`} tab={tab.tab} sheetKey={key} choices={choices[tab.tab] ?? []} busy={busy} onSave={saveMapping}/>)}
      </div>)}
      {preview.structuralIssues.length > 0 && <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Resolve structural key issues before treating this preview as a clean reconciliation.</p>}
    </div>}
  </section>;
}

function MappingRow({ tab, sheetKey, choices, busy, onSave }: { tab: string; sheetKey: string; choices: NexusSheetTargetChoice[]; busy: boolean; onSave: (tab: string, key: string, target: string) => void }) {
  const [target, setTarget] = useState("");
  return <div className="mt-3 grid gap-2 rounded-md bg-muted/30 p-2 sm:grid-cols-[minmax(120px,1fr)_minmax(220px,2fr)_auto] sm:items-center">
    <code className="break-all text-xs">{sheetKey}</code>
    <select aria-label={`Application record for ${sheetKey}`} className="h-9 min-w-0 rounded-md border bg-background px-2 text-xs" value={target} onChange={(event) => setTarget(event.target.value)}>
      <option value="">Select matching app record…</option>
      {choices.map((choice) => <option key={`${choice.entityType}:${choice.id}`} value={`${choice.entityType}|${choice.id}`}>{choice.label} · {choice.entityType.replaceAll("_", " ")}</option>)}
    </select>
    <Button size="sm" disabled={busy || !target} onClick={() => onSave(tab, sheetKey, target)}>Save mapping</Button>
  </div>;
}
