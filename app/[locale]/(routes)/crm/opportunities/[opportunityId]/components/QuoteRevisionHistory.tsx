import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type QuoteRevision = {
  id: string;
  revisionNo: number;
  status: string;
  snapshot: unknown;
  submittedAt: Date;
  submittedBy: string;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  reopenReason: string | null;
};

function readSnapshot(value: unknown) {
  if (!value || typeof value !== "object") return { currency: "", total: "", lines: [] as any[] };
  const root = value as { opportunity?: { currency?: string; expectedRevenue?: string }; lines?: any[] };
  return {
    currency: root.opportunity?.currency || "",
    total: root.opportunity?.expectedRevenue || "",
    lines: Array.isArray(root.lines) ? root.lines : [],
  };
}

function money(value: string, currency: string) {
  if (currency !== "INR") return "Amount needs INR review";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "Invalid amount";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount);
}

export function QuoteRevisionHistory({ revisions }: { revisions: QuoteRevision[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quotation revisions</CardTitle>
        <CardDescription>Each submitted quote is saved as a fixed snapshot with its review outcome.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {revisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quotation has been submitted for review yet.</p>
        ) : revisions.map((revision) => {
          const snapshot = readSnapshot(revision.snapshot);
          return (
            <section key={revision.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-medium">Revision {revision.revisionNo}</h3>
                  <p className="text-xs text-muted-foreground">
                    Submitted {revision.submittedAt.toLocaleString("en-IN")} · {snapshot.lines.length} line{snapshot.lines.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{money(snapshot.total, snapshot.currency)}</span>
                  <Badge variant={revision.status === "REJECTED" ? "destructive" : revision.status === "APPROVED" ? "default" : "secondary"}>{revision.status}</Badge>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {snapshot.lines.map((line, index) => (
                  <div key={`${revision.id}-${line.id ?? index}`} className="flex justify-between gap-3 text-muted-foreground">
                    <span className="truncate">{line.quantity} × {line.name}</span>
                    <span className="shrink-0">{money(String(line.lineTotal ?? "0"), line.currency ?? "")}</span>
                  </div>
                ))}
              </div>
              {(revision.reviewNote || revision.reopenReason) && (
                <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
                  {revision.reopenReason ? `Reopened: ${revision.reopenReason}` : `Review note: ${revision.reviewNote}`}
                </p>
              )}
              {revision.reviewedAt && (
                <p className="mt-2 text-xs text-muted-foreground">Reviewed {revision.reviewedAt.toLocaleString("en-IN")}</p>
              )}
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
