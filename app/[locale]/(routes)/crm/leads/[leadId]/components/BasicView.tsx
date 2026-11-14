import { CalendarDays, FileText, Landmark, Mail, Phone, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeadDetailActions } from "./LeadDetailActions";
import { LeadDetailCard } from "./LeadDetailCard";
import { LeadCommercialPanel } from "./LeadCommercialPanel";
import { getLeadFormOptions } from "@/actions/crm/get-lead-form-options";
import { getSaleStages } from "@/actions/crm/get-sales-stage";
import { getSalesType } from "@/actions/crm/get-sales-type";
import { getOpportunityFieldSettings } from "@/lib/crm/opportunities/field-settings";
import type { Prisma } from "@prisma/client";

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
  customFields?: Prisma.JsonValue;
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
    quoteRevisions: Array<{ id: string; revisionNo: number; status: string; snapshot: unknown; submittedAt: Date | string; reviewNote: string | null; reopenReason: string | null }>;
  } | null;
  [key: string]: unknown;
}

interface Props { data: LeadDetailData }

function DetailItem({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return <div className="flex min-w-0 items-start gap-2.5 rounded-md border bg-card px-3 py-2.5">
    <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
    <div className="min-w-0 space-y-0.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium">{value}</p>
    </div>
  </div>;
}

function formatDate(value?: Date | string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(date);
}

function normalizeWebsite(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function LeadStatusPath({ statuses, currentStatus, closed }: { statuses: Array<{ id: string; name: string }>; currentStatus?: string; closed: boolean }) {
  if (!statuses.length) return null;
  const currentIndex = statuses.findIndex((status) => status.id === currentStatus);
  const progress = currentIndex < 0 ? 0 : (currentIndex + 1) / statuses.length;
  return <section className="space-y-2" aria-label="Lead status progress">
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="font-medium text-muted-foreground">Lead status</span>
      <span className="font-semibold">{closed ? "Converted to account" : statuses[currentIndex]?.name ?? "Status not set"}</span>
    </div>
    <div className="flex items-center gap-1.5" role="list" aria-label="Configured lead statuses">
      {statuses.map((status, index) => {
        const active = currentIndex >= index;
        return <div key={status.id} role="listitem" title={status.name} aria-current={currentIndex === index ? "step" : undefined} className={`h-1.5 min-w-0 flex-1 rounded-full ${active ? "bg-primary" : "bg-muted"}`} />;
      })}
    </div>
    <div className="flex justify-between gap-2 overflow-hidden text-[10px] text-muted-foreground">
      {statuses.map((status, index) => <span key={status.id} className={`min-w-0 flex-1 truncate ${index === currentIndex ? "font-semibold text-foreground" : ""}`}>{status.name}</span>)}
    </div>
    {currentIndex < 0 && <p className="text-xs text-muted-foreground">Choose a lead status to show progress through your configured stages.</p>}
  </section>;
}

export async function BasicView({ data }: Props) {
  const [leadOptions, opportunityStages, opportunityTypes, opportunityFieldSettings] = await Promise.all([
    getLeadFormOptions(), getSaleStages(), getSalesType(), getOpportunityFieldSettings(),
  ]);
  const { leadSources, leadStatuses, leadTypes, leadFieldSettings } = leadOptions;
  const customValues = data.customFields && typeof data.customFields === "object" && !Array.isArray(data.customFields)
    ? data.customFields as Record<string, string | number | boolean | null>
    : {};
  const visibleCustomFields = leadFieldSettings.customFields.filter((field) => !field.hidden && customValues[field.key] !== undefined && customValues[field.key] !== null && customValues[field.key] !== "");
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const website = normalizeWebsite(data.website);
  const isConverted = Boolean(data.convertedAt);

  return <div className="space-y-3">
    <LeadDetailCard
      title="Lead overview"
      description={<div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="break-words font-medium text-foreground">{data.company || fullName || "Lead"}</span>
          {fullName && data.company && <span>· {fullName}{data.jobTitle ? `, ${data.jobTitle}` : ""}</span>}
          <Badge variant="outline">{isConverted ? "Converted to account" : "Pre-closure lead"}</Badge>
        </div>
        <LeadStatusPath statuses={leadStatuses} currentStatus={data.lead_status?.id} closed={isConverted} />
        {data.assigned_accounts?.id && <Link className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline" href={`/crm/accounts/${data.assigned_accounts.id}`}>Client account · {data.assigned_accounts.name} →</Link>}
      </div>}
      action={<LeadDetailActions lead={data} leadSources={leadSources} leadStatuses={leadStatuses} leadTypes={leadTypes} leadFieldSettings={leadFieldSettings} opportunityStages={opportunityStages} opportunityTypes={opportunityTypes} opportunityCustomFields={opportunityFieldSettings.customFields} />}
    >
      <CardContent className="space-y-2 pt-0">
        <div className="flex flex-wrap gap-2 border-t pt-3">
          {data.phone && <Button asChild size="sm" variant="outline"><a href={`tel:${data.phone}`}><Phone className="mr-1.5 h-3.5 w-3.5" />Call</a></Button>}
          {data.email && <Button asChild size="sm" variant="outline"><a href={`mailto:${data.email}`}><Mail className="mr-1.5 h-3.5 w-3.5" />Email</a></Button>}
        </div>
      </CardContent>
    </LeadDetailCard>

    <LeadDetailCard title="Contact & enquiry" description="Client contact, ownership, and referral details" defaultOpen>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
          <DetailItem icon={UserRound} label="Lead contact" value={fullName} />
          <DetailItem icon={Landmark} label="Company / client" value={data.company} />
          <DetailItem icon={Phone} label="Phone" value={data.phone} />
          {data.email && <div className="flex min-w-0 items-start gap-2.5 rounded-md border bg-card px-3 py-2.5"><Mail aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0 space-y-0.5"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email</p><Link className="block break-all text-sm font-medium text-primary underline-offset-4 hover:underline" href={`mailto:${data.email}`}>{data.email}</Link></div></div>}
          {website && <div className="flex min-w-0 items-start gap-2.5 rounded-md border bg-card px-3 py-2.5"><Landmark aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" /><div className="min-w-0 space-y-0.5"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Website</p><a className="block break-all text-sm font-medium text-primary underline-offset-4 hover:underline" href={website} target="_blank" rel="noreferrer">{data.website}</a></div></div>}
          <DetailItem icon={UsersRound} label="Lead owner" value={data.assigned_to_user?.name} />
          <DetailItem icon={FileText} label="Enquiry type" value={data.lead_type?.name} />
          <DetailItem icon={UsersRound} label="Referral source" value={data.lead_source?.name} />
          <DetailItem icon={UserRound} label="Referred by" value={data.refered_by} />
          <DetailItem icon={CalendarDays} label="Enquiry added" value={formatDate(data.createdAt as Date | string | null)} />
          <DetailItem icon={CalendarDays} label="Last updated" value={formatDate(data.updatedAt as Date | string | null)} />
        </div>
      </CardContent>
    </LeadDetailCard>

    <LeadDetailCard title="Qualification & notes" description={`${visibleCustomFields.length} custom ${visibleCustomFields.length === 1 ? "detail" : "details"}${data.campaign ? " · campaign recorded" : ""}`}>
      <CardContent className="space-y-4 pt-0">
        {visibleCustomFields.length ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{visibleCustomFields.map((field) => {
          const value = customValues[field.key];
          return <DetailItem key={field.key} icon={FileText} label={field.label} value={typeof value === "boolean" ? value ? "Yes" : "No" : String(value)} />;
        })}</div> : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">No additional qualification details recorded.</p>}
        {data.description?.trim() ? <section className="space-y-1.5 border-t pt-3" aria-labelledby="lead-notes-heading"><h3 id="lead-notes-heading" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enquiry notes</h3><p className="whitespace-pre-wrap break-words text-sm leading-6">{data.description}</p></section> : <section className="space-y-1.5 border-t pt-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Enquiry notes</h3><p className="text-sm text-muted-foreground">No enquiry notes recorded.</p></section>}
        {data.campaign?.trim() && <p className="border-t pt-3 text-sm"><span className="text-muted-foreground">Campaign:</span> {data.campaign}</p>}
      </CardContent>
    </LeadDetailCard>

    <LeadCommercialPanel opportunity={data.preClosureOpportunity ?? null} account={data.assigned_accounts?.id ? { id: data.assigned_accounts.id, name: data.assigned_accounts.name } : null} />
  </div>;
}
