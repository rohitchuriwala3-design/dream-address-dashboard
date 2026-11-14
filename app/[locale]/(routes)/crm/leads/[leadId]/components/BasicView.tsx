import {
  CalendarDays,
  FileText,
  Landmark,
  Mail,
  Phone,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadDetailActions } from "./LeadDetailActions";
import { getLeadFormOptions } from "@/actions/crm/get-lead-form-options";

interface LeadDetailData {
  id: string;
  firstName?: string | null;
  lastName: string;
  company?: string | null;
  jobTitle?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  refered_by?: string | null;
  campaign?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  lead_status?: { id: string; name: string } | null;
  lead_source?: { id: string; name: string } | null;
  lead_type?: { id: string; name: string } | null;
  assigned_to_user?: { id: string; name: string | null } | null;
  assigned_accounts?: { id: string; name: string } | null;
  preClosureOpportunity?: {
    id: string;
    name: string | null;
    status: string | null;
    budget: string | number;
    expected_revenue: string | number;
    next_step: string | null;
    next_step_due_at: Date | string | null;
    assigned_sales_stage?: { name: string } | null;
    _count: { quoteRevisions: number };
  } | null;
  [key: string]: unknown;
}

interface Props {
  data: LeadDetailData;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value?: string | null;
}) {
  if (!value?.trim()) return null;

  return (
    <div className="flex min-w-0 items-start gap-3 rounded-lg border bg-card p-3">
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function formatDate(value?: Date | string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: value % 1 === 0 ? 0 : 2 }).format(value);
}

export async function BasicView({ data }: Props) {
  const { leadSources, leadStatuses, leadTypes, leadFieldSettings } = await getLeadFormOptions();
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const website = data.website?.trim()
    ? /^https?:\/\//i.test(data.website.trim())
      ? data.website.trim()
      : `https://${data.website.trim()}`
    : undefined;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl sm:text-2xl">{fullName}</CardTitle>
              {data.lead_status?.name ? <Badge variant="secondary">{data.lead_status.name}</Badge> : null}
            </div>
            <CardDescription className="break-words">
              {data.company || data.jobTitle || "Residential enquiry"}
              {data.company && data.jobTitle ? ` · ${data.jobTitle}` : ""}
            </CardDescription>
          </div>
          <div className="w-full sm:w-auto sm:shrink-0">
            <LeadDetailActions
              lead={data}
              leadSources={leadSources}
              leadStatuses={leadStatuses}
              leadTypes={leadTypes}
              leadFieldSettings={leadFieldSettings}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem icon={UserRound} label="Lead contact" value={fullName} />
            <DetailItem icon={Landmark} label="Company / client" value={data.company} />
            <DetailItem icon={Phone} label="Phone" value={data.phone} />
            {data.email ? (
              <div className="flex min-w-0 items-start gap-3 rounded-lg border bg-card p-3">
                <Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                  <Link className="block break-all text-sm font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${data.email}`}>
                    {data.email}
                  </Link>
                </div>
              </div>
            ) : null}
            {website ? (
              <div className="flex min-w-0 items-start gap-3 rounded-lg border bg-card p-3">
                <Landmark aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Website</p>
                  <a className="block break-all text-sm font-medium text-primary underline-offset-4 hover:underline" href={website} target="_blank" rel="noreferrer">
                    {data.website}
                  </a>
                </div>
              </div>
            ) : null}
            <DetailItem icon={UsersRound} label="Lead owner" value={data.assigned_to_user?.name} />
            <DetailItem icon={FileText} label="Enquiry type" value={data.lead_type?.name} />
            <DetailItem icon={UsersRound} label="Referral source" value={data.lead_source?.name} />
            <DetailItem icon={UserRound} label="Referred by" value={data.refered_by} />
            <DetailItem icon={CalendarDays} label="Enquiry added" value={formatDate(data.createdAt as Date | string | null)} />
            <DetailItem icon={CalendarDays} label="Last updated" value={formatDate(data.updatedAt as Date | string | null)} />
          </div>

          {data.description?.trim() ? (
            <section className="space-y-2 border-t pt-4" aria-labelledby="lead-notes-heading">
              <h3 id="lead-notes-heading" className="text-sm font-semibold">Enquiry notes</h3>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">{data.description}</p>
            </section>
          ) : null}
          {data.campaign?.trim() ? (
            <p className="text-xs text-muted-foreground">Campaign: {data.campaign}</p>
          ) : null}
          <p className="border-t pt-3 text-xs text-muted-foreground">Record reference: {data.id}</p>
        </CardContent>
      </Card>
      {data.preClosureOpportunity && (
        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><CardTitle className="text-base">Current job discussion</CardTitle><CardDescription>Each Opportunity represents one possible interiors job; quote revisions stay with that job.</CardDescription></div>
            <Link className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border px-3 text-sm font-medium hover:bg-accent" href={`/crm/opportunities/${data.preClosureOpportunity.id}`}>Open opportunity →</Link>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <DetailItem icon={Landmark} label="Opportunity" value={data.preClosureOpportunity.name} />
            <DetailItem icon={FileText} label="Pipeline stage" value={data.preClosureOpportunity.status === "WON" ? "Won · client confirmed" : data.preClosureOpportunity.status === "LOST" ? "Lost" : data.preClosureOpportunity.assigned_sales_stage?.name || "Qualification"} />
            <DetailItem icon={Landmark} label="Expected job value" value={formatINR(Number(data.preClosureOpportunity.expected_revenue) || Number(data.preClosureOpportunity.budget) || 0)} />
            <DetailItem icon={FileText} label="Quote revisions" value={String(data.preClosureOpportunity._count.quoteRevisions)} />
            <DetailItem icon={CalendarDays} label="Next step" value={data.preClosureOpportunity.next_step} />
            <DetailItem icon={CalendarDays} label="Next step due" value={formatDate(data.preClosureOpportunity.next_step_due_at)} />
          </CardContent>
        </Card>
      )}
      {data.assigned_accounts?.id && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Client account</p><p className="mt-1 font-semibold">{data.assigned_accounts.name}</p></div>
            <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/crm/accounts/${data.assigned_accounts.id}`}>Open client portfolio →</Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
