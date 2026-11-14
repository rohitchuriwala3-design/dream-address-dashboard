"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, UserRoundCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertLead } from "@/actions/crm/leads/convert-lead";
import { createLeadOpportunity } from "@/actions/crm/leads/create-lead-opportunity";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UpdateLeadForm } from "../../components/UpdateLeadForm";

type ConfigItem = { id: string; name: string };

interface LeadDetailActionsProps {
  lead: any;
  leadSources: ConfigItem[];
  leadStatuses: ConfigItem[];
  leadTypes: ConfigItem[];
}

export function LeadDetailActions({
  lead,
  leadSources,
  leadStatuses,
  leadTypes,
}: LeadDetailActionsProps) {
  const [updateOpen, setUpdateOpen] = useState(false);
  const [converting, startConversion] = useTransition();
  const [startingOpportunity, startOpportunity] = useTransition();
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

  const onStartOpportunity = () => startOpportunity(async () => {
    const result = await createLeadOpportunity(lead.id);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(result.created ? "Opportunity started; the lead remains pre-closure" : "Opportunity already exists");
    router.push(`/crm/opportunities/${result.opportunity.id}`);
  });

  return (
    <>
      {!lead?.convertedOpportunityId && !lead?.preClosureOpportunity && (
        <Button size="sm" variant="secondary" onClick={onStartOpportunity} disabled={startingOpportunity}>
          {startingOpportunity ? "Starting…" : "Start opportunity"}
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
            />
          </div>
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            data-testid="lead-detail-actions-btn"
          >
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={() => setUpdateOpen(true)}>
            Update
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
