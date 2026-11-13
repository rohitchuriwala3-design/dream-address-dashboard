import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarDays,
  IndianRupee,
  ContactRound,
  FileText,
  FolderKanban,
  HandCoins,
  LayoutDashboard,
  ListTodo,
  Plus,
  ReceiptText,
  UsersRound,
} from "lucide-react";
import { getSession } from "@/lib/auth-server";
import { formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/client";
import { getTasksCount, getUsersTasksCount } from "@/actions/dashboard/get-tasks-count";
import { getInvoicesCount } from "@/actions/dashboard/get-invoices-count";
import { getCampaignsCount } from "@/actions/dashboard/get-campaigns-count";
import { getTargetsCount } from "@/actions/dashboard/get-targets-count";
import { getLeadsCount } from "@/actions/dashboard/get-leads-count";
import { countStudioProjects } from "@/actions/studio-projects/service";
import { getContactCount } from "@/actions/dashboard/get-contacts-count";
import { getAccountsCount } from "@/actions/dashboard/get-accounts-count";
import { getContractsCount } from "@/actions/dashboard/get-contracts-count";
import { getActiveUsersCount } from "@/actions/dashboard/get-active-users-count";
import { getOpportunitiesCount } from "@/actions/dashboard/get-opportunities-count";
import { getStudioFinanceSummary } from "@/actions/dashboard/get-studio-finance-summary";
import { getStudioPipelineSummary } from "@/actions/dashboard/get-studio-pipeline-summary";
import { Card, CardContent } from "@/components/ui/card";

const DashboardPage = async () => {
  const session = await getSession({ partner: true });
  if (!session) return null;

  const userId = session.user.id;
  const counts = await Promise.all([
      getTasksCount(), getUsersTasksCount(userId), getInvoicesCount(),
      getCampaignsCount(), getTargetsCount(), countStudioProjects(), getContactCount(),
      getAccountsCount(), getContractsCount(), getActiveUsersCount(),
      getOpportunitiesCount(), getLeadsCount(),
      getStudioFinanceSummary(), getStudioPipelineSummary(),
  ]);
  const [tasks, myTasks, invoices, campaigns, targets, boards, contacts, accounts,
    contracts, activeUsers, opportunities, leads, finance, pipelineValue] = counts;
  const formatINR = (value: string) => formatCurrencyUtil(new Decimal(value), "INR");
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata",
  }).format(new Date());

  const metrics = [
    { label: "Active opportunities", value: opportunities, note: "Open sales records", icon: BriefcaseBusiness, href: "/crm/opportunities", tone: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300" },
    { label: "INR opportunity forecast", value: formatINR(pipelineValue), note: "Active opportunities explicitly in INR", icon: IndianRupee, href: "/crm/opportunities", tone: "text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300" },
    { label: "Receivables", value: formatINR(finance.receivables), note: `${finance.overdueCount} past-due INR invoices`, icon: HandCoins, href: "/invoices", tone: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
    { label: "My open tasks", value: myTasks, note: `${tasks} tasks visible in workspace`, icon: ListTodo, href: `/projects/tasks/${userId}`, tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300" },
  ];

  const workspaces = [
    { title: "Leads", description: "Capture and qualify new enquiries", count: leads, href: "/crm/leads", icon: ContactRound },
    { title: "Clients", description: "Client accounts and relationships", count: accounts, href: "/crm/accounts", icon: UsersRound },
    { title: "Opportunities", description: "Pipeline, stages and next steps", count: opportunities, href: "/crm/opportunities", icon: BriefcaseBusiness },
    { title: "Studio projects", description: "Milestones, scope and handover", count: boards, href: "/studio-projects", icon: FolderKanban },
    { title: "Invoices", description: "Billing, receipts and balances", count: invoices, href: "/invoices", icon: ReceiptText },
    { title: "Tasks", description: "Team actions and deadlines", count: tasks, href: "/projects/tasks", icon: ListTodo },
  ];

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-7 px-1 pb-8">
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-6 py-7 text-white shadow-sm sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-3 -top-12 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-200">
              <LayoutDashboard className="h-4 w-4" /> MARK IV · Studio operations
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Your studio overview for today. Keep client relationships, project delivery, and cash flow moving from one workspace.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/crm/leads?create=1" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50">
              <Plus className="h-4 w-4" /> Add lead
            </Link>
            <Link href="/invoices/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10">
              <ReceiptText className="h-4 w-4" /> Create invoice
            </Link>
          </div>
        </div>
        <div className="relative mt-7 flex items-center gap-2 text-xs text-slate-300">
          <CalendarDays className="h-4 w-4" /> {today} · Asia/Kolkata
        </div>
      </section>

      <section aria-label="Studio performance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, note, icon: Icon, href, tone }) => (
          <Link href={href} key={label} className="group">
            <Card className="h-full transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{label}</p>
                    <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
                  </div>
                  <span className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{note}</span><ArrowRight className="h-4 w-4 shrink-0 transition group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.8fr)]">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Your workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">Jump into the work that needs attention.</p>
            </div>
            <Link href="/reports" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">View reports <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.map(({ title, description, count, href, icon: Icon }) => (
              <Link href={href} key={title} className="group">
                <Card className="h-full transition group-hover:border-primary/40 group-hover:shadow-sm">
                  <CardContent className="flex min-h-32 items-start justify-between gap-3 p-4">
                    <div>
                      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><h3 className="font-medium">{title}</h3></div>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
                    </div>
                    <div className="text-right"><div className="text-lg font-semibold tabular-nums">{count}</div><ArrowUpRight className="ml-auto mt-2 h-4 w-4 text-muted-foreground transition group-hover:text-primary" /></div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h2 className="font-semibold">Cash flow snapshot</h2><p className="mt-1 text-xs text-muted-foreground">Issued invoices denominated in INR</p></div>
                <HandCoins className="h-5 w-5 text-amber-600" />
              </div>
              <div className="mt-5 space-y-4">
                <CashRow label="Invoice value" value={formatINR(finance.issuedInvoiceValue)} icon={ReceiptText} />
                <CashRow label="Collected" value={formatINR(finance.collected)} icon={ArrowDownRight} />
                <CashRow label="Outstanding" value={formatINR(finance.receivables)} icon={ArrowUpRight} strong />
              </div>
              <p className="mt-4 border-t pt-3 text-[11px] leading-4 text-muted-foreground">{finance.issuedInvoiceCount} issued invoices counted. Other currencies and draft, cancelled, or credit-note records are excluded; figures reflect saved invoice totals.</p>
              <Link href="/invoices" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Open billing <ArrowRight className="h-4 w-4" /></Link>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold">Studio at a glance</h2>
              <p className="mt-1 text-xs text-muted-foreground">Current workspace records visible to your role</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <MiniStat label="Contacts" value={contacts} />
                <MiniStat label="Agreements" value={contracts} />
                <MiniStat label="Campaigns" value={campaigns} />
                <MiniStat label="Team members" value={activeUsers} />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
        <span>Figures use records visible to your account. Forecast and billed amounts are separate; non-INR records are excluded.</span>
        <div className="flex gap-4"><Link href="/campaigns/targets" className="hover:text-foreground">Campaign targets ({targets})</Link><Link href="/crm/contacts" className="inline-flex items-center gap-1 hover:text-foreground"><FileText className="h-3.5 w-3.5" /> Contact list</Link></div>
      </div>
    </main>
  );
};

function CashRow({ label, value, icon: Icon, strong = false }: { label: string; value: string; icon: LucideIcon; strong?: boolean }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{label}</span><span className={strong ? "font-semibold tabular-nums" : "font-medium tabular-nums"}>{value}</span></div>;
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg bg-muted/60 px-3 py-2"><div className="text-lg font-semibold tabular-nums">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}

export default DashboardPage;
