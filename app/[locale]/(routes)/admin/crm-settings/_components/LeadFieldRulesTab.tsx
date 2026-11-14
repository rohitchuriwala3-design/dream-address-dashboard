"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONFIGURABLE_LEAD_FIELDS, type LeadCustomField, type LeadFieldSettings } from "@/lib/crm/leads/field-settings-shared";
import { updateAdminLeadFieldSettings } from "../_actions/crm-settings";

export function LeadFieldRulesTab({ initial }: { initial: LeadFieldSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<LeadCustomField["type"]>("text");
  const [newOptions, setNewOptions] = useState("");

  function addCustomField() {
    const label = newLabel.trim();
    const key = label.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 36);
    const options = newOptions.split(",").map((option) => option.trim()).filter(Boolean);
    if (!label || !key || settings.customFields.some((field) => field.key === key)) {
      toast.error("Enter a unique field name.");
      return;
    }
    if (settings.customFields.length >= 20) {
      toast.error("A maximum of 20 custom fields is supported.");
      return;
    }
    if (newType === "select" && !options.length) {
      toast.error("Add at least one comma-separated choice.");
      return;
    }
    setSettings((current) => ({ ...current, customFields: [...current.customFields, { key, label, type: newType, ...(newType === "select" ? { options } : {}), required: false, hidden: false }] }));
    setNewLabel("");
    setNewOptions("");
  }

  function toggle(key: (typeof CONFIGURABLE_LEAD_FIELDS)[number]["key"], group: "hidden" | "required", checked: boolean) {
    setSettings((current) => {
      if (group === "hidden" && checked) {
        return { ...current, hidden: [...current.hidden, key], required: current.required.filter((item) => item !== key) };
      }
      const values = current[group].filter((item) => item !== key);
      if (checked) values.push(key);
      return { ...current, [group]: values };
    });
  }

  async function save() {
    setSaving(true);
    try {
      await updateAdminLeadFieldSettings(settings);
      toast.success("Lead form rules saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save Lead form rules");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Lead form fields</h2>
          <p className="text-sm text-muted-foreground">Choose which qualification fields appear and which are required when Leads are created or edited. Client name remains required; relationship and ownership controls stay available.</p>
        </div>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save field rules"}</Button>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <div className="grid min-w-[560px] grid-cols-[1fr_130px_130px] gap-3 border-b bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span>Lead field</span><span>Show field</span><span>Required</span>
        </div>
        {CONFIGURABLE_LEAD_FIELDS.map(({ key, label }) => {
          const visible = !settings.hidden.includes(key);
          return <div key={key} className="grid min-w-[560px] grid-cols-[1fr_130px_130px] items-center gap-3 border-b px-4 py-3 last:border-0">
            <span className="text-sm font-medium">{label}</span>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={visible} onCheckedChange={(value) => toggle(key, "hidden", !value)} />Show</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={settings.required.includes(key)} disabled={!visible} onCheckedChange={(value) => toggle(key, "required", Boolean(value))} />Required</label>
          </div>;
        })}
      </div>
      <p className="text-xs text-muted-foreground">Rules apply to the Lead create/edit forms and server-side record creation. Hiding a field also clears its required rule.</p>
      <section className="space-y-4 rounded-xl border p-4">
        <div><h3 className="font-semibold">Custom lead fields</h3><p className="text-sm text-muted-foreground">Add up to 20 fields for details your studio tracks. Existing values stay on records if a field is later removed from this form.</p></div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_auto]">
          <Input value={newLabel} onChange={(event) => setNewLabel(event.target.value)} placeholder="Field name (e.g. Site locality)" aria-label="New custom lead field name" />
          <Select value={newType} onValueChange={(value: LeadCustomField["type"]) => setNewType(value)}><SelectTrigger aria-label="Custom field type"><SelectValue /></SelectTrigger><SelectContent>{[["text", "Text"], ["number", "Number"], ["date", "Date"], ["select", "Pick list"], ["checkbox", "Yes / no"]].map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
          {newType === "select" ? <Input value={newOptions} onChange={(event) => setNewOptions(event.target.value)} placeholder="Choices, separated by commas" aria-label="Custom field choices" /> : <span className="hidden sm:block" />}
          <Button type="button" variant="outline" onClick={addCustomField} disabled={settings.customFields.length >= 20}>Add field</Button>
        </div>
        {settings.customFields.length ? <div className="divide-y rounded-lg border">{settings.customFields.map((field) => <div key={field.key} className="flex flex-wrap items-center gap-3 p-3">
          <div className="grid min-w-48 flex-1 gap-2">
            <Input aria-label={`Field label ${field.key}`} value={field.label} onChange={(event) => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, label: event.target.value } : item) }))} />
            <span className="text-xs text-muted-foreground">{field.type} field · stored values remain attached to this field</span>
            {field.type === "select" && <Input aria-label={`Choices for ${field.label}`} value={field.options?.join(", ") ?? ""} onChange={(event) => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, options: event.target.value.split(",").map((option) => option.trim()).filter(Boolean) } : item) }))} placeholder="Comma-separated choices" />}
          </div>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={!field.hidden} onCheckedChange={(value) => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, hidden: !value } : item) }))} />Show</label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={field.required} disabled={field.hidden} onCheckedChange={(value) => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, required: Boolean(value) } : item) }))} />Required</label>
          <Button type="button" variant="ghost" size="sm" disabled={field.hidden} onClick={() => setSettings((current) => ({ ...current, customFields: current.customFields.map((item) => item.key === field.key ? { ...item, hidden: true, required: false } : item) }))}>Archive</Button>
        </div>)}</div> : <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No custom fields yet.</p>}
        <p className="text-xs text-muted-foreground">Field validation is enforced on the server, including required values, number/date types and allowed pick-list options.</p>
      </section>
    </div>
  );
}
