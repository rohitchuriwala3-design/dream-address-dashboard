import { getNexusSheetsStatus } from "@/actions/nexus-sheets/sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SheetsAuditControls } from "./sheets-audit-controls";
import { SheetsCrosswalkControls } from "./sheets-crosswalk-controls";

const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });

export default async function GoogleSheetsIntegrationPage() {
  const status = await getNexusSheetsStatus();
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
    <header><p className="text-sm font-medium text-primary">Integrations</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Google Sheets</h1><p className="mt-2 max-w-3xl text-sm text-muted-foreground">Read-only connection and data-quality audit for the Dream Address Studio management workbook. This does not import records or write to the Sheet.</p></header>
    <Card><CardHeader><CardTitle>Connection setup</CardTitle></CardHeader><CardContent className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2"><StatusItem label="Master workbook ID" value={status.spreadsheetId}/><StatusItem label="Service account access" value={status.configured ? "Credentials configured" : "Setup required"}/></div>
      {!status.configured&&<div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-medium">Google Sheets credentials are not configured.</p><p className="mt-1">Set the service-account email and private key as Render secrets, or upload the service-account JSON as a Render Secret File. The service account needs access to the master workbook.</p><p className="mt-2 font-mono text-xs">Missing: {status.missing.join(", ")}</p></div>}
      <SheetsAuditControls configured={status.configured}/>
    </CardContent></Card>
    <SheetsCrosswalkControls configured={status.configured}/>
    <Card><CardHeader><CardTitle>Saved crosswalk mappings</CardTitle></CardHeader><CardContent>{status.crosswalks.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Sheet tab</th><th>Legacy key</th><th>Mapped record type</th><th>Application record ID</th><th>Updated</th></tr></thead><tbody>{status.crosswalks.map((mapping) => <tr key={mapping.id} className="border-b last:border-0"><td className="py-3">{mapping.sheetTab}</td><td><code>{mapping.sheetKey}</code></td><td>{mapping.entityType.replaceAll("_", " ")}</td><td><code>{mapping.appRecordId}</code></td><td>{date.format(new Date(mapping.updatedAt))}</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">No legacy IDs have been linked to application records yet.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Recent read-only audits</CardTitle></CardHeader><CardContent>{status.latestRuns.length?<div className="overflow-x-auto"><table className="w-full min-w-[700px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Started</th><th>Status</th><th>Tabs</th><th>Rows</th><th>Findings</th><th>Mode</th></tr></thead><tbody>{status.latestRuns.map((run)=><tr key={run.id} className="border-b last:border-0"><td className="py-3">{date.format(new Date(run.startedAt))}</td><td>{run.status.replaceAll("_"," ")}</td><td>{run.tabsScanned}</td><td>{run.rowsScanned}</td><td>{run.issueCount}</td><td>{run.mode.replaceAll("_"," ")}</td></tr>)}</tbody></table></div>:<p className="text-sm text-muted-foreground">No audit runs recorded.</p>}</CardContent></Card>
  </main>;
}

function StatusItem({label,value}:{label:string;value:string}) { return <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all text-sm font-medium">{value}</p></div>; }
