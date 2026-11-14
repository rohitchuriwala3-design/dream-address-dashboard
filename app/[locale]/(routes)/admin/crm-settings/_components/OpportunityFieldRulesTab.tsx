"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeadCustomField } from "@/lib/crm/leads/field-settings-shared";
import { updateAdminOpportunityFieldSettings } from "../_actions/crm-settings";

type Settings = { customFields: LeadCustomField[] };

export function OpportunityFieldRulesTab({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<LeadCustomField["type"]>("text");
  const [options, setOptions] = useState("");
  const [saving, setSaving] = useState(false);

  function addField() {
    const cleanLabel = label.trim();
    const key = cleanLabel.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 36);
    const choices = options.split(",").map((choice) => choice.trim()).filter(Boolean);
    if (!cleanLabel || !key || settings.customFields.some((field) => field.key === key)) return toast.error("Enter a unique field name.");
    if (settings.customFields.length >= 20) return toast.error("A maximum of 20 custom opportunity fields is supported.");
    if (type === "select" && !choices.length) return toast.error("Add at least one pick-list choice.");
    setSettings((current) => ({ ...current, customFields: [...current.customFields, { key, label: cleanLabel, type, ...(type === "select" ? { options: choices } : {}), required: false, hidden: false }] }));
    setLabel("");
    setOptions("");
  }

  async function save() {
    setSaving(true);
    try {
      await updateAdminOpportunityFieldSettings(settings);
      toast.success("Opportunity form settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save opportunity form settings");
    } finally { setSaving(false); }
  }

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="text-lg font-semibold">Opportunity form fields</h2><p className="max-w-3xl text-sm text-muted-foreground">Customize the interior project and sales conversation details collected on opportunities. Every field is optional; hide or archive anything your team does not use.</p></div>
      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save opportunity fields"}</Button>
    </div>
    <section className="space-y-4 rounded-xl border p-4">
      <div><h3 className="font-semibold">Add a custom opportunity field</h3><p className="text-sm text-muted-foreground">Use text for scope notes, number for measurements, date for planned dates, pick list for controlled choices, or yes/no.</p></div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_auto]">
        <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Field name (e.g. Wardrobe scope)" aria-label="New opportunity field name" />
        <Select value={type} onValueChange={(value: LeadCustomField["type"]) => setType(value)}><SelectTrigger aria-label="Opportunity field type"><SelectValue /></SelectTrigger><SelectContent>{[["text", "Text"], ["number", "Number"], ["date", "Date"], ["select", "Pick list"], ["checkbox", "Yes / no"]].map(([value, name]) => <SelectItem key={value} value={value}>{name}</SelectItem>)}</SelectContent></Select>
        {type === "select" ? <Input value={options} onChange={(event) => setOptions(event.target.value)} placeholder="Choices, separated by commas" aria-label="Opportunity field choices" /> : <span className="hidden sm:block" />}
        <Button type="button" variant="outline" onClick={addField} disabled={settings.customFields.length >= 20}>Add field</Button>
      </div>
      <div className="divide-y rounded-lg border">
        {settings.customFields.map((field) => <div key={field.key} className="flex flex-wrap items-center gap-3 p-3">
          <div className="grid min-w-48 flex-1 gap-2">
            <Input aria-label={`Opportunity field label ${field.key}`} value={field.label} onChange={(event) => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, label: event.target.value } : item) }))} />
            <span className="text-xs text-muted-foreground">Optional · {field.type}</span>
            {field.type === "select" && <Input aria-label={`Choices for ${field.label}`} value={field.options?.join(", ") ?? ""} onChange={(event) => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, options: event.target.value.split(",").map((choice) => choice.trim()).filter(Boolean) } : item) }))} placeholder="Comma-separated choices" />}
          </div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={!field.hidden} onCheckedChange={(value) => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, hidden: !value } : item) }))} />Show in opportunity form</label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, hidden: true } : item) }))}>Archive</Button>
        </div>)}
      </div>
      <p className="text-xs text-muted-foreground">Changing pick-list choices does not allow removing a choice already used by an opportunity.</p>
    </section>
  </div>;
}
