import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CircleUserRound,
  ClipboardList,
  Plus,
  TrendingUp,
} from "lucide-react";

import Container from "../components/ui/Container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLeads } from "@/actions/crm/get-leads";
import { getOpportunitiesFull } from "@/actions/crm/get-opportunities-with-includes";
import { CRMWorkspaceCustomizer, CRMWorkspaceWidget } from "./components/CRMWorkspaceCustomizer";
import { getSession } from "@/lib/auth-server";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const shortDate = (date: Date | string | null | undefined) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Kolkata",
      }).format(new Date(date))
    : "No date set";

const CrmPage = async () => {
  const [session, leads, opportunities] = await Promise.all([
    getSession({ partner: true }),
    getLeads(),
    getOpportunitiesFull(),
  ]);

  const openOpportunities = opportunities.filter((item) => item.status === "ACTIVE");
  // Request-time reference keeps stale follow-ups accurate in this server-rendered page.
  // eslint-disable-next-line react-hooks/purity -- This server component is not a client render loop.
  const now = Date.now();
  const staleBefore = now - 14 * 24 * 60 * 60 * 1000;
  const followUpQueue = openOpportunities
    .filter((item) => !item.last_activity || new Date(item.last_activity).getTime() < staleBefore || !item.next_step)
    .sort((a, b) => {
      const aActivity = a.last_activity ? new Date(a.last_activity).getTime() : 0;
      const bActivity = b.last_activity ? new Date(b.last_activity).getTime() : 0;
      return aActivity - bActivity;
    })
    .slice(0, 6);

  const pipelineValue = openOpportunities.reduce(
    (total, item) => total + Number(item.expected_revenue || item.budget || 0),
    0,
  );
  const stageCounts = openOpportunities.reduce<Record<string, number>>((counts, item) => {
    const stage = item.assigned_sales_stage?.name || "Stage not set";
    counts[stage] = (counts[stage] || 0) + 1;
    return counts;
  }, {});
  const stageRows = Object.entries(stageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Container
      title="CRM workbench"
      description="Your residential enquiry, follow-up and project handoff desk."
    >
      <CRMWorkspaceCustomizer key={session?.user.id ?? "anonymous"} userId={session?.user.id ?? "anonymous"} widgets={[{ id: "summary", label: "Summary metrics" }, { id: "followups", label: "Follow-up focus" }, { id: "pipeline", label: "Pipeline by stage" }, { id: "leads", label: "Latest enquiries" }]}>
        <section className="flex flex-col gap-4 rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="max-w-2xl space-y-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">Studio sales desk</Badge>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Keep every enquiry moving.</h2>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              Start with the next client action, then move from enquiry to site visit, quote and project handoff.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/crm/leads?create=1"><Plus aria-hidden="true" /> Add enquiry</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/crm/dashboard">Open opportunity board <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </section>

        <div className="grid gap-4 pb-8 xl:grid-cols-2">
        <CRMWorkspaceWidget id="summary" className="xl:col-span-2">
        <section aria-label="CRM summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Tracked leads" value={leads.length.toLocaleString("en-IN")} detail="Leads in your permitted view" icon={<CircleUserRound aria-hidden="true" />} href="/crm/leads" />
          <SummaryCard label="Active opportunities" value={openOpportunities.length.toLocaleString("en-IN")} detail="Potential residential projects" icon={<BriefcaseBusiness aria-hidden="true" />} href="/crm/opportunities" />
          <SummaryCard label="Open pipeline" value={inr.format(pipelineValue)} detail="Expected revenue, falling back to budget" icon={<TrendingUp aria-hidden="true" />} href="/crm/opportunities" />
          <SummaryCard label="Needs follow-up" value={followUpQueue.length.toLocaleString("en-IN")} detail="No next step or activity in 14 days" icon={<CalendarClock aria-hidden="true" />} href="/crm/opportunities" />
        </section>
        </CRMWorkspaceWidget>

        <CRMWorkspaceWidget id="followups">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
              <div>
                <CardTitle className="text-lg">Follow-up focus</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Active opportunities that need a next action or a recent update.</p>
              </div>
              <Button asChild variant="ghost" size="sm"><Link href="/crm/opportunities">All opportunities <ArrowRight aria-hidden="true" /></Link></Button>
            </CardHeader>
            <CardContent className="p-0">
              {followUpQueue.length ? (
                <ul className="divide-y">
                  {followUpQueue.map((item) => {
                    const inactiveDays = item.last_activity
                      ? Math.floor((now - new Date(item.last_activity).getTime()) / (24 * 60 * 60 * 1000))
                      : null;
                    return (
                      <li key={item.id}>
                        <Link href={`/crm/opportunities/${item.id}`} className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{item.name || item.assigned_account?.name || "Untitled opportunity"}</span>
                              <Badge variant="outline">{item.assigned_sales_stage?.name || "Stage not set"}</Badge>
                            </div>
                            <p className="truncate text-sm text-muted-foreground">{item.next_step || "Add a next action"}</p>
                          </div>
                          <div className="flex shrink-0 items-center justify-between gap-4 text-sm sm:justify-end">
                            <span className="text-muted-foreground">{inactiveDays === null ? "No activity logged" : inactiveDays <= 0 ? "Updated today" : `${inactiveDays}d since activity`}</span>
                            <span className="font-medium">{inr.format(Number(item.expected_revenue || item.budget || 0))}</span>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="px-6 py-10 text-center">
                  <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 font-medium">Your follow-up list is clear</p>
                  <p className="mt-1 text-sm text-muted-foreground">Open opportunities will appear here when they need a next step.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CRMWorkspaceWidget>
        <CRMWorkspaceWidget id="pipeline">
          <Card>
            <CardHeader className="border-b px-5 py-4 sm:px-6">
              <CardTitle className="text-lg">Pipeline by stage</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">A quick view of active opportunities.</p>
            </CardHeader>
            <CardContent className="space-y-4 p-5 sm:p-6">
              {stageRows.length ? stageRows.map(([stage, count]) => (
                <div key={stage}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{stage}</span><span className="font-medium">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(8, (count / openOpportunities.length) * 100)}%` }} />
                  </div>
                </div>
              )) : <p className="text-sm text-muted-foreground">Add an opportunity to start tracking the pipeline.</p>}
              <div className="grid grid-cols-2 gap-2 border-t pt-4">
                <QuickLink href="/crm/leads" icon={<CircleUserRound aria-hidden="true" />} title="Enquiries" detail="Review leads" />
                <QuickLink href="/crm/accounts" icon={<ClipboardList aria-hidden="true" />} title="Clients" detail="Open accounts" />
                <QuickLink href="/crm/opportunities" icon={<BriefcaseBusiness aria-hidden="true" />} title="Pipeline" detail="View deals" />
                <QuickLink href="/crm/contacts" icon={<Plus aria-hidden="true" />} title="Contacts" detail="Find people" />
              </div>
            </CardContent>
          </Card>
        </CRMWorkspaceWidget>

        <CRMWorkspaceWidget id="leads" className="xl:col-span-2">
        <section aria-label="Latest enquiries">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><h3 className="text-lg font-semibold">Latest enquiries</h3><p className="text-sm text-muted-foreground">New leads, referrals and qualification progress.</p></div>
            <Button asChild size="sm" variant="outline"><Link href="/crm/leads">View all leads <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {leads.slice(0, 6).map((lead) => (
              <Link key={lead.id} href={`/crm/leads/${lead.id}`} className="group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-medium">{[lead.firstName, lead.lastName].filter(Boolean).join(" ") || "New enquiry"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{lead.company || lead.assigned_accounts?.name || "Residential client"}</p></div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
                  <Badge variant="secondary">{lead.lead_status?.name || "Status not set"}</Badge>
                  <span className="text-muted-foreground">{shortDate(lead.createdAt)}</span>
                </div>
                <p className="mt-2 truncate text-xs text-muted-foreground">{lead.refered_by ? `Referred by ${lead.refered_by}` : lead.lead_source?.name || "Source not recorded"}</p>
              </Link>
            ))}
            {leads.length === 0 && <Card className="flex min-h-40 items-center justify-center border-dashed p-6 text-center md:col-span-2 xl:col-span-3"><div><p className="font-medium">No enquiries yet</p><p className="mt-1 text-sm text-muted-foreground">Create the first enquiry and keep its next step visible.</p><Button asChild size="sm" className="mt-4"><Link href="/crm/leads?create=1"><Plus aria-hidden="true" /> Add enquiry</Link></Button></div></Card>}
          </div>
        </section>
        </CRMWorkspaceWidget>
        </div>
      </CRMWorkspaceCustomizer>
    </Container>
  );
};

function SummaryCard({ label, value, detail, icon, href }: { label: string; value: string; detail: string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md">
        <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 truncate text-2xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div>
          <span className="rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function QuickLink({ href, icon, title, detail }: { href: string; icon: React.ReactNode; title: string; detail: string }) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <span className="shrink-0 text-primary">{icon}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{title}</span><span className="block truncate text-xs text-muted-foreground">{detail}</span></span>
    </Link>
  );
}

export default CrmPage;
