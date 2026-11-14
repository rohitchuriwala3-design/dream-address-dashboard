"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { LeadCustomField } from "@/lib/crm/leads/field-settings-shared";

export function CustomLeadFieldsForm({ fields }: { fields: LeadCustomField[] }) {
  const { register, setValue, watch, formState: { errors } } = useFormContext();
  const visible = fields.filter((field) => !field.hidden);
  if (!visible.length) return null;
  return <section className="space-y-3 rounded-lg border p-4" aria-label="Additional lead details">
    <div><h3 className="text-sm font-semibold">Additional details</h3><p className="text-xs text-muted-foreground">Studio-specific fields configured by an administrator.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      {visible.map((field) => {
        const name = `customFields.${field.key}`;
        const error = (errors.customFields as Record<string, { message?: string }> | undefined)?.[field.key]?.message;
        const required = field.required ? { required: `${field.label} is required.` } : undefined;
        if (field.type === "checkbox") return <label key={field.key} className="flex min-h-10 items-center gap-3 text-sm sm:col-span-2">
          <Checkbox checked={Boolean(watch(name))} onCheckedChange={(value) => setValue(name, Boolean(value), { shouldDirty: true, shouldValidate: true })} />
          <span>{field.label}{field.required ? <span className="text-destructive"> *</span> : null}{error ? <span className="ml-2 text-destructive" role="alert">{error}</span> : null}</span>
        </label>;
        if (field.type === "select") return <label key={field.key} className="grid gap-2 text-sm">
          <span className="font-medium">{field.label}{field.required ? <span className="text-destructive"> *</span> : null}</span>
          <select aria-invalid={Boolean(error)} className="h-10 rounded-md border bg-background px-3" defaultValue="" {...register(name, required)}><option value="">Select…</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select>
          {error && <span className="text-xs text-destructive" role="alert">{error}</span>}
        </label>;
        return <label key={field.key} className="grid gap-2 text-sm">
          <span className="font-medium">{field.label}{field.required ? <span className="text-destructive"> *</span> : null}</span>
          <Input aria-invalid={Boolean(error)} type={field.type} step={field.type === "number" ? "any" : undefined} {...register(name, { ...required, ...(field.type === "number" ? { setValueAs: (value: string) => value === "" ? undefined : Number(value) } : {}) })} />
          {error && <span className="text-xs text-destructive" role="alert">{error}</span>}
        </label>;
      })}
    </div>
  </section>;
}
