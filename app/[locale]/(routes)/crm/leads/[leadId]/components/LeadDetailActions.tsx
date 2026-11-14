"use client";

import { useState, useTransition } from "react";
import { Pencil, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertLead } from "@/actions/crm/leads/convert-lead";
import Link from "next/link";
import { StartOpportunityForm } from "./StartOpportunityForm";
import type { LeadCustomField } from "@/lib/crm/leads/field-settings-shared";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UpdateLeadForm } from "../../components/UpdateLeadForm";
import type { LeadFieldSettings } from "@/lib/crm/leads/field-settings-shared";

type ConfigItem = { id: string; name: string };

interface LeadDetailActionsProps {
  lead: any;
  leadSources: ConfigItem[];
  leadStatuses: ConfigItem[];
  leadTypes: ConfigItem[];
  leadFieldSettings: LeadFieldSettings;
  opportunityStages: ConfigItem[];
  opportunityTypes: ConfigItem[];
  opportunityCustomFields: LeadCustomField[];
}

export function LeadDetailActions({
  lead,
  leadSources,
  leadStatuses,
  leadTypes,
  leadFieldSettings,
  opportunityStages,
  opportunityTypes,
  opportunityCustomFields,
}: LeadDetailActionsProps) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [opportunityOpen, setOpportunityOpen] = useState(false);
  const [converting, startConversion] = useTransition();
  const router = useRouter();

  const onConvert = () => startConversion(async () => {
    const result = await convertLead(lead.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(result.alreadyConverted ? "This lead was already converted" : "Lead converted to client and opportunity");
    router.refresh();
    router.push(`/crm/opportunities/${result.opportunityId}`);
  });

  return (
    <>
      {!lead?.convertedOpportunityId && !lead?.preClosureOpportunity && (
        <Button size="sm" variant="secondary" onClick={() => setOpportunityOpen(true)}>
          Start opportunity
        </Button>
      )}
      {lead?.preClosureOpportunity && !lead?.convertedOpportunityId && (
        <Link href={`/crm/opportunities/${lead.preClosureOpportunity.id}`} className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-accent">
          Opportunity · {lead.preClosureOpportunity.status === "WON" ? "Won" : lead.preClosureOpportunity.assigned_sales_stage?.name || lead.preClosureOpportunity.status || "Open"}
        </Link>
      )}
      {lead?.preClosureOpportunity?.status === "WON" && !lead?.convertedOpportunityId && (
        <Button size="sm" onClick={onConvert} disabled={converting}>
          <UserRoundCheck className="mr-2 h-4 w-4" />
          {converting ? "Converting…" : "Convert won lead to account"}
        </Button>
      )}
      <Sheet open={updateOpen} onOpenChange={setUpdateOpen}>
        <SheetContent className="w-full md:max-w-[771px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Update lead - {lead?.firstName} {lead?.lastName}
            </SheetTitle>
            <SheetDescription>Update lead details</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <UpdateLeadForm
              initialData={lead}
              setOpen={setUpdateOpen}
              leadSources={leadSources}
              leadStatuses={leadStatuses}
              leadTypes={leadTypes}
              leadFieldSettings={leadFieldSettings}
            />
          </div>
        </SheetContent>
      </Sheet>

      <StartOpportunityForm
        lead={lead}
        stages={opportunityStages}
        types={opportunityTypes}
        customFields={opportunityCustomFields}
        open={opportunityOpen}
        onOpenChange={setOpportunityOpen}
      />

      <Button variant="outline" size="sm" onClick={() => setUpdateOpen(true)} data-testid="lead-detail-actions-btn">
        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />Edit lead
      </Button>
    </>
  );
}
