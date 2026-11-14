"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLeadOpportunity, type StartLeadOpportunityInput } from "@/actions/crm/leads/create-lead-opportunity";
import type { LeadCustomField } from "@/lib/crm/leads/field-settings-shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type ConfigItem = { id: string; name: string };
type FieldValue = string | number | boolean;

export function StartOpportunityForm({ lead, stages, types, customFields, open, onOpenChange }: {
  lead: { id: string; firstName?: string | null; lastName: string; company?: string | null; description?: string | null };
  stages: ConfigItem[];
  types: ConfigItem[];
  customFields: LeadCustomField[];
  open: boolean;
  onOpenChange: (value: boolean) => void;
}) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();
  const [fieldValues, setFieldValues] = useState<Record<string, FieldValue>>({});
  const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ");

  function updateField(key: string, value: FieldValue) {
    setFieldValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const budget = String(formData.get("budget") ?? "").trim();
    const expectedRevenue = String(formData.get("expectedRevenue") ?? "").trim();
    if ([budget, expectedRevenue].some((value) => value && (!/^\d+(\.\d{1,2})?$/.test(value) || Number(value) > 100_000_000_000))) {
      toast.error("Enter valid non-negative INR amounts.");
      return;
    }
    const payload: StartLeadOpportunityInput = {
      name: String(formData.get("name") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      budget: budget || undefined,
      expectedRevenue: expectedRevenue || undefined,
      closeDate: String(formData.get("closeDate") ?? "") || undefined,
      deliveryDeadline: String(formData.get("deliveryDeadline") ?? "") || undefined,
      salesStage: String(formData.get("salesStage") ?? "") || undefined,
      type: String(formData.get("type") ?? "") || undefined,
      nextStep: String(formData.get("nextStep") ?? "").trim() || undefined,
      nextStepDueAt: String(formData.get("nextStepDueAt") ?? "") || undefined,
      customFields: Object.fromEntries(Object.entries(fieldValues).filter(([, value]) => value !== "")),
    };
    startSaving(async () => {
      const result = await createLeadOpportunity(lead.id, payload);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Opportunity created with lead context");
      onOpenChange(false);
      router.refresh();
      router.push(`/crm/opportunities/${result.opportunity.id}`);
    });
  }

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
      <SheetHeader>
        <SheetTitle>Start opportunity</SheetTitle>
        <SheetDescription>Capture the job scope and sales discussion for {lead.company || fullName}. Every field is optional; add details as the conversation develops.</SheetDescription>
      </SheetHeader>
      <form onSubmit={submit} className="mt-6 space-y-5 pb-6">
        <section className="space-y-3 rounded-lg border p-4">
          <h3 className="text-sm font-semibold">Opportunity basics</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="opportunity-name">Opportunity / project name</Label><Input id="opportunity-name" name="name" defaultValue={`${lead.company?.trim() || fullName || "Residential client"} — interiors project`} /><p className="text-xs text-muted-foreground">Optional. A default name will be generated from this lead.</p></div>
            <div className="space-y-1.5"><Label htmlFor="opportunity-type">Service type</Label><Select name="type"><SelectTrigger id="opportunity-type"><SelectValue placeholder="Choose later" /></SelectTrigger><SelectContent>{types.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="opportunity-stage">Sales stage</Label><Select name="salesStage"><SelectTrigger id="opportunity-stage"><SelectValue placeholder="Use first configured stage" /></SelectTrigger><SelectContent>{stages.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label htmlFor="opportunity-budget">Approximate project budget (₹)</Label><Input id="opportunity-budget" name="budget" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Optional estimate" /></div>
            <div className="space-y-1.5"><Label htmlFor="opportunity-revenue">Expected quotation value (₹)</Label><Input id="opportunity-revenue" name="expectedRevenue" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Optional estimate" /></div>
            <div className="space-y-1.5"><Label htmlFor="opportunity-close-date">Target decision date</Label><Input id="opportunity-close-date" name="closeDate" type="date" /></div>
            <div className="space-y-1.5"><Label htmlFor="opportunity-delivery-deadline">Expected project handover</Label><Input id="opportunity-delivery-deadline" name="deliveryDeadline" type="date" /></div>
          </div>
        </section>

        <section className="space-y-3 rounded-lg border p-4">
          <div><h3 className="text-sm font-semibold">Sales conversation</h3><p className="text-xs text-muted-foreground">Use follow-up activities for dated calls and meetings; use these fields for the current summary.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label htmlFor="opportunity-next-step">Next action</Label><Input id="opportunity-next-step" name="nextStep" placeholder="e.g. Share revised design estimate" /></div>
            <div className="space-y-1.5"><Label htmlFor="opportunity-next-step-date">Next action due</Label><Input id="opportunity-next-step-date" name="nextStepDueAt" type="date" /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="opportunity-description">Project brief and discussion notes</Label><Textarea id="opportunity-description" name="description" defaultValue={lead.description ?? ""} rows={4} placeholder="Client requirements, areas discussed, preferences, constraints, decisions, and open questions…" /></div>
          </div>
        </section>

        {customFields.filter((field) => !field.hidden).length > 0 && <section className="space-y-3 rounded-lg border p-4">
          <div><h3 className="text-sm font-semibold">Interior project scope</h3><p className="text-xs text-muted-foreground">All scope and qualification fields are optional and can be changed by an administrator.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {customFields.filter((field) => !field.hidden).map((field) => <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`opp-custom-${field.key}`}>{field.label}</Label>
              {field.type === "select" ? <Select value={String(fieldValues[field.key] ?? "")} onValueChange={(value) => updateField(field.key, value)}><SelectTrigger id={`opp-custom-${field.key}`}><SelectValue placeholder="Not specified" /></SelectTrigger><SelectContent>{field.options?.map((choice) => <SelectItem key={choice} value={choice}>{choice}</SelectItem>)}</SelectContent></Select>
                : field.type === "checkbox" ? <div className="flex min-h-10 items-center gap-2"><input id={`opp-custom-${field.key}`} type="checkbox" checked={Boolean(fieldValues[field.key])} onChange={(event) => updateField(field.key, event.target.checked)} /><span className="text-sm text-muted-foreground">{fieldValues[field.key] ? "Yes" : "No / not specified"}</span></div>
                  : <Input id={`opp-custom-${field.key}`} type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"} min={field.type === "number" ? "0" : undefined} value={String(fieldValues[field.key] ?? "")} onChange={(event) => updateField(field.key, field.type === "number" ? event.target.value === "" ? "" : Number(event.target.value) : event.target.value)} placeholder="Optional" />}
            </div>)}
          </div>
        </section>}

        <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create opportunity"}</Button></div>
      </form>
    </SheetContent>
  </Sheet>;
}
