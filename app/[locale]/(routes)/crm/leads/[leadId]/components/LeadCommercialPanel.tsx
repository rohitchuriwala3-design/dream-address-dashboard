"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, FileText, Landmark } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatIndiaDateTime } from "@/lib/india-time";

type QuoteRevision = {
  id: string;
  revisionNo: number;
  status: string;
  snapshot: unknown;
  submittedAt: Date | string;
  reviewNote: string | null;
  reopenReason: string | null;
};

type Opportunity = {
  id: string;
  name: string | null;
  status: string | null;
  budget: string | number;
  expected_revenue: string | number;
  next_step: string | null;
  next_step_due_at: Date | string | null;
  assigned_sales_stage?: { name: string } | null;
  _count: { quoteRevisions: number };
  quoteRevisions: QuoteRevision[];
};

function snapshotTotal(value: unknown) {
  if (!value || typeof value !== "object") return 0;
  const root = value as { opportunity?: { expectedRevenue?: string | number } };
  const amount = Number(root.opportunity?.expectedRevenue ?? 0);
  return Number.isFinite(amount) ? amount : 0;
}

function inr(value: string | number) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
    : "—";
}

function outcomeLabel(opportunity: Opportunity) {
  if (opportunity.status === "WON") return "Closed won";
  if (opportunity.status === "LOST") return "Closed lost";
  return opportunity.assigned_sales_stage?.name || "Open opportunity";
}

export function LeadCommercialPanel({ opportunity, account }: {
  opportunity: Opportunity | null;
  account: { id: string; name: string } | null;
}) {
  const [expanded, setExpanded] = useState(Boolean(opportunity));
  const revisions = opportunity?.quoteRevisions ?? [];
  const quoteCount = opportunity?._count.quoteRevisions ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 py-3">
        <div className="min-w-0">
          <CardTitle className="text-base">Opportunity & quotations</CardTitle>
          <CardDescription>
            {opportunity ? `${outcomeLabel(opportunity)} · ${quoteCount} ${quoteCount === 1 ? "quotation revision" : "quotation revisions"}` : "No job discussion linked yet"}
          </CardDescription>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {opportunity && <Button asChild size="sm" variant="outline"><Link href={`/crm/opportunities/${opportunity.id}`}>Open opportunity</Link></Button>}
          <Button type="button" size="icon" variant="ghost" aria-label={expanded ? "Collapse opportunity and quotations" : "Expand opportunity and quotations"} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {expanded && <CardContent className="space-y-4 pt-0">
        {opportunity ? <>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Sales outcome</p>
              <Badge className="mt-2" variant={opportunity.status === "LOST" ? "destructive" : opportunity.status === "WON" ? "default" : "secondary"}>{outcomeLabel(opportunity)}</Badge>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Expected job value</p>
              <p className="mt-2 font-semibold">{inr(Number(opportunity.expected_revenue) || Number(opportunity.budget))}</p>
            </div>
          </div>
          {(opportunity.next_step || opportunity.next_step_due_at) && <div className="rounded-md border p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next sales step</p>
            <p className="mt-1 text-sm font-medium">{opportunity.next_step || "Follow-up"}</p>
            {opportunity.next_step_due_at && <p className="mt-1 text-xs text-muted-foreground">Due {formatIndiaDateTime(opportunity.next_step_due_at)}</p>}
          </div>}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Quotation history</h3>
              {quoteCount > revisions.length && <Link className="text-xs text-primary underline-offset-4 hover:underline" href={`/crm/opportunities/${opportunity.id}`}>View all {quoteCount} revisions</Link>}
            </div>
            {revisions.length ? <div className="divide-y rounded-md border">
              {revisions.map((revision) => <div key={revision.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Quotation · Revision {revision.revisionNo}</p>
                    <p className="text-xs text-muted-foreground">{formatIndiaDateTime(revision.submittedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{inr(snapshotTotal(revision.snapshot))}</span>
                  <Badge variant={revision.status === "REJECTED" ? "destructive" : revision.status === "APPROVED" ? "default" : "secondary"}>{revision.status}</Badge>
                </div>
              </div>)}
            </div> : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No quotation revisions have been submitted for this opportunity yet.</p>}
          </div>
        </> : <p className="text-sm text-muted-foreground">Start an opportunity when this enquiry becomes a specific interiors job. Its commercial stage and quotation revisions will stay linked here.</p>}
        {account && <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-2 text-sm"><Landmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" /><span>Client account · <strong>{account.name}</strong></span></div>
          <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/crm/accounts/${account.id}`}>Open account portfolio →</Link>
        </div>}
      </CardContent>}
    </Card>
  );
}
