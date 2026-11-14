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
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadDetailActions } from "./LeadDetailActions";
import { LeadDetailCard } from "./LeadDetailCard";
import { LeadCommercialPanel } from "./LeadCommercialPanel";
import { getLeadFormOptions } from "@/actions/crm/get-lead-form-options";
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

export async function BasicView({ data }: Props) {
  const { leadSources, leadStatuses, leadTypes, leadFieldSettings } = await getLeadFormOptions();
  const customValues = data.customFields && typeof data.customFields === "object" && !Array.isArray(data.customFields)
    ? data.customFields as Record<string, string | number | boolean | null>
    : {};
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const website = data.website?.trim()
    ? /^https?:\/\//i.test(data.website.trim())
      ? data.website.trim()
      : `https://${data.website.trim()}`
    : undefined;

  return (
    <div className="space-y-4">
      <LeadDetailCard title={data.company || "Lead details"} action={
        <LeadDetailActions
          lead={data}
          leadSources={leadSources}
          leadStatuses={leadStatuses}
          leadTypes={leadTypes}
          leadFieldSettings={leadFieldSettings}
        />
      } description={
        <div className="space-y-2">
          <p className="break-words">{fullName}{data.jobTitle ? ` · ${data.jobTitle}` : ""}</p>
          <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{data.convertedAt ? "Converted to account" : "Pre-closure lead"}</Badge>
              {data.lead_status?.name ? <Badge variant="secondary">{data.lead_status.name}</Badge> : null}
          </div>
          {data.assigned_accounts?.id && <Link className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/crm/accounts/${data.assigned_accounts.id}`}>Client account · {data.assigned_accounts.name} →</Link>}
        </div>
      }>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
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
          {leadFieldSettings.customFields.some((field) => !field.hidden && customValues[field.key] !== undefined) ? <section className="space-y-3 border-t pt-4" aria-labelledby="lead-custom-fields-heading"><h3 id="lead-custom-fields-heading" className="text-sm font-semibold">Additional details</h3><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{leadFieldSettings.customFields.filter((field) => !field.hidden && customValues[field.key] !== undefined).map((field) => { const value = customValues[field.key]; return <DetailItem key={field.key} icon={FileText} label={field.label} value={typeof value === "boolean" ? value ? "Yes" : "No" : value == null ? undefined : String(value)} />; })}</div></section> : null}
        </CardContent>
      </LeadDetailCard>
      <LeadCommercialPanel opportunity={data.preClosureOpportunity ?? null} account={data.assigned_accounts?.id ? { id: data.assigned_accounts.id, name: data.assigned_accounts.name } : null} />
    </div>
  );
}
