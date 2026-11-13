"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { runNexusSheetsReadOnlyAudit, runNexusSheetsWriteReadTest } from "@/actions/nexus-sheets/sync";
import type { SheetAuditIssue, SheetAuditResult } from "@/lib/nexus-sheets/read-only-audit";

export function SheetsAuditControls({ configured }: { configured: boolean }) {
  const [busy, startTransition] = useTransition();
  const [roundTripBusy, startRoundTripTransition] = useTransition();
  const [result, setResult] = useState<SheetAuditResult | null>(null);
  const [roundTripResult, setRoundTripResult] = useState<{ spreadsheetTitle: string; sheetName: string; rowNumber: number } | null>(null);
  const router = useRouter();
  const run = () => startTransition(async () => {
    const response = await runNexusSheetsReadOnlyAudit();
    if ("error" in response) { toast.error(response.error); router.refresh(); return; }
    setResult(response.result);
    toast.success(`Read-only audit completed: ${response.result.issues.length} issue types found`);
    router.refresh();
  });
  const runRoundTrip = () => startRoundTripTransition(async () => {
    const response = await runNexusSheetsWriteReadTest();
    if ("error" in response) { toast.error(response.error); router.refresh(); return; }
    setRoundTripResult(response.result);
    toast.success("Sync Log write and read-back verified");
    router.refresh();
  });

  return <div className="space-y-4">
    <div className="flex flex-wrap gap-3">
      <Button onClick={run} disabled={!configured || busy || roundTripBusy}>{busy ? "Scanning workbook…" : "Run read-only audit"}</Button>
      <Button variant="outline" onClick={runRoundTrip} disabled={!configured || busy || roundTripBusy}>{roundTripBusy ? "Verifying Sheet write…" : "Test Sheet write + read-back"}</Button>
    </div>
    <p className="text-xs text-muted-foreground">The test appends one clearly labelled connectivity-test event to the Sync Log and verifies it by reading it back. It does not sync CRM, project, invoice, or finance records.</p>
    {roundTripResult&&<Card><CardContent className="p-4 text-sm"><p className="font-semibold text-emerald-700">Sheet write and read-back verified</p><p className="mt-1 text-muted-foreground">A connectivity-test event was recorded in {roundTripResult.sheetName}, row {roundTripResult.rowNumber}, in {roundTripResult.spreadsheetTitle}. Business-record dual sync is still a separate implementation step.</p></CardContent></Card>}
    {!configured&&<p className="text-xs text-muted-foreground">Configure the staging service-account secrets and workbook access to enable these checks.</p>}
    {result&&<Card><CardContent className="space-y-4 p-4">
      <div><p className="font-semibold">{result.spreadsheetTitle}</p><p className="text-sm text-muted-foreground">Scanned {result.tabsScanned} required tabs and {result.rowsScanned} populated rows. This is a structural audit, not an app-to-Sheet reconciliation.</p></div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{result.tabs.map((tab)=><div key={tab.name} className="rounded-md border p-3 text-sm"><p className="font-medium">{tab.name}</p><p className="mt-1 text-xs text-muted-foreground">{tab.rowsScanned} rows · Key: {tab.keyHeaders.length?tab.keyHeaders.join(" + "):"not found"}</p><p className="text-xs text-muted-foreground">{tab.duplicateIds} duplicate · {tab.blankIds} incomplete keys</p></div>)}</div>
      {result.issues.length?<div className="space-y-2"><p className="text-sm font-semibold">Findings</p>{result.issues.map((issue,index)=><Issue key={`${issue.tab}-${issue.code}-${index}`} issue={issue}/>)}</div>:<p className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">No structural issues found in the required tabs. This does not validate app record matches or financial totals.</p>}
    </CardContent></Card>}
  </div>;
}

function Issue({issue}:{issue:SheetAuditIssue}) { return <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><span className="font-medium">{issue.tab} · {issue.code.replaceAll("_"," ")} ({issue.count})</span><p className="mt-1">{issue.message}</p></div>; }
