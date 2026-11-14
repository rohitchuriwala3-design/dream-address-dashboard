import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { crm_Opportunities } from "@prisma/client";
import {
  CalendarDays,
  ClipboardList,
  CoinsIcon,
  Combine,
  Landmark,
  List,
  SquareStack,
  Text,
  User,
} from "lucide-react";
import moment from "moment";
import { Clapperboard } from "lucide-react";
import { prismadb } from "@/lib/prisma";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { OpportunityDetailActions } from "./OpportunityDetailActions";
import RequestApprovalButton from "./RequestApprovalButton";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/client";
import { serializeDecimals } from "@/lib/serialize-decimals";
import ReopenQuoteButton from "./ReopenQuoteButton";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { OpportunityOutcomeActions } from "./OpportunityOutcomeActions";
import { getOpportunityFieldSettings } from "@/lib/crm/opportunities/field-settings";

interface OppsViewProps {
  data: {
    assigned_sales_stage: { name: string };
    assigned_to_user: { name: string };
    assigned_account: { name: string };
    assigned_type: { name: string };
    sourceLead: { lead_source: { name: string } | null } | null;
    assigned_campaings: { name: string } | null;
  } & crm_Opportunities;
}

export async function BasicView({ data }: OppsViewProps) {
  //console.log(data, "data");
  const [users, crmData, fieldSettings] = await Promise.all([prismadb.users.findMany(), getAllCrmData(), getOpportunityFieldSettings()]);
  const { saleTypes, saleStages, campaigns } = crmData;
  if (!data) return <div>Opportunity not found</div>;

  const customValues = data.customFields && typeof data.customFields === "object" && !Array.isArray(data.customFields)
    ? data.customFields as Record<string, string | number | boolean | null>
    : {};
  const populatedCustomFields = fieldSettings.customFields.filter((field) => !field.hidden && customValues[field.key] != null && customValues[field.key] !== "");

  const fromCurrency = data.currency;
  const budgetAmount = new Decimal(data.budget?.toString() ?? "0");
  return (
    <>
    <Card>
      <CardHeader className="pb-3">
        <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex min-w-0 flex-wrap items-center gap-2 break-words">
              {data.name}
              {data.approval_status === "PENDING" && (
                <Badge variant="secondary">Approval pending</Badge>
              )}
              {data.approval_status === "APPROVED" && <Badge>Approved</Badge>}
              {data.approval_status === "REOPENED" && <Badge variant="outline">Reopened for revision</Badge>}
              {data.approval_status === "REJECTED" && (
                <Badge variant="destructive" title={data.approval_note ?? undefined}>
                  Rejected
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="break-all">ID: {data.id}</CardDescription>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-start gap-2 sm:w-auto sm:justify-end">
          {(data.approval_status === "NONE" ||
            data.approval_status === "REJECTED" || data.approval_status === "REOPENED") && (
            <RequestApprovalButton opportunityId={data.id} />
          )}
          {data.approval_status === "APPROVED" && <ReopenQuoteButton opportunityId={data.id} />}
          {data.approval_status === "APPROVED" && (
            <Button asChild size="sm" variant="outline">
              <Link href={`/api/opportunities/${data.id}/quote`}><Download className="mr-2 h-4 w-4" />Download approved quote</Link>
            </Button>
          )}
          <OpportunityOutcomeActions
            opportunityId={data.id}
            status={data.status}
            sourceLead={(data as any).sourceLead ?? null}
          />
          <OpportunityDetailActions
            opportunity={serializeDecimals(data)}
            saleTypes={saleTypes}
            saleStages={saleStages}
            campaigns={campaigns}
            currencies={[{ code: "INR", name: "Indian Rupee", symbol: "₹" }]}
            customFields={fieldSettings.customFields}
          />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-1 md:grid-cols-2">
        <div className="min-w-0">
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CoinsIcon className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Opportunity amount
              </p>
              <p className="text-sm text-muted-foreground">
                {fromCurrency === "INR" ? formatCurrency(budgetAmount, "INR") : "Amount needs INR review"}
              </p>
            </div>
          </div>

          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <SquareStack className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Sales stage</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_sales_stage?.name
                  ? data.assigned_sales_stage?.name
                  : "Not assigned"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Combine className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Next step</p>
              <p className="text-sm text-muted-foreground">{data.next_step}</p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2">
            <CalendarDays className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Next step due</p>
              <p className="text-sm text-muted-foreground">
                {data.next_step_due_at ? moment(data.next_step_due_at).format("MMM DD YYYY") : "Not set"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <ClipboardList className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Description</p>
              <p className="text-sm text-muted-foreground">
                {data.description}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <User className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Assigned to</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_to_user.name}
              </p>
            </div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Landmark className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Account name</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_account?.name
                  ? data.assigned_account?.name
                  : "Not assigned"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CalendarDays className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Expected close date
              </p>
              <p className="text-sm text-muted-foreground">
                {data.close_date ? moment(data.close_date).format("MMM DD YYYY") : "Not set"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CalendarDays className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Date created</p>
              <p className="text-sm text-muted-foreground">
                {moment(data.createdAt).format("MMM DD YYYY")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Created by</p>
              <p className="text-sm text-muted-foreground">
                {users.find((user) => user.id === data.createdBy)?.name}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <CalendarDays className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Last update</p>
              <p className="text-sm text-muted-foreground">
                {moment(data.updatedAt).format("MMM DD YYYY")}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Last update by</p>
              <p className="text-sm text-muted-foreground">
                {users.find((user) => user.id === data.updatedBy)?.name}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <List className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Type</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_type?.name ? data.assigned_type?.name : "N/A"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Landmark className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Lead source</p>
              <p className="text-sm text-muted-foreground">
                {data.sourceLead?.lead_source?.name ?? "Not set"}
              </p>
            </div>
          </div>
          <div className="-mx-2 flex items-start space-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
            <Clapperboard className="mt-px h-5 w-5" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Campaign</p>
              <p className="text-sm text-muted-foreground">
                {data.assigned_campaings?.name ?? "Not set"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    {fieldSettings.customFields.some((field) => !field.hidden) && <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">Interior project scope</CardTitle><CardDescription>Optional project details configured by your administrator.</CardDescription></CardHeader>
      <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {populatedCustomFields.length ? populatedCustomFields.map((field) => {
          const value = customValues[field.key];
          return <div key={field.key} className="rounded-md border px-3 py-2.5"><p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{field.label}</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{value == null || value === "" ? <span className="text-muted-foreground">Not specified</span> : typeof value === "boolean" ? value ? "Yes" : "No" : String(value)}</p></div>;
        }) : <p className="text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">No interior scope details recorded yet. Update this opportunity as the project discussion develops.</p>}
      </CardContent>
    </Card>}
    </>
  );
}
