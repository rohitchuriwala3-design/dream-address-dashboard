"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CONFIGURABLE_LEAD_FIELDS, type LeadFieldSettings } from "@/lib/crm/leads/field-settings-shared";
import { updateAdminLeadFieldSettings } from "../_actions/crm-settings";

export function LeadFieldRulesTab({ initial }: { initial: LeadFieldSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);

  function toggle(key: (typeof CONFIGURABLE_LEAD_FIELDS)[number]["key"], group: "hidden" | "required", checked: boolean) {
    setSettings((current) => {
      if (group === "hidden" && checked) {
        return { hidden: [...current.hidden, key], required: current.required.filter((item) => item !== key) };
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
    </div>
  );
}
