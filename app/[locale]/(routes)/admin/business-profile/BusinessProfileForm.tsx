"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveBusinessProfile } from "./_actions/save-business-profile";
import type { BusinessProfileInput } from "./_actions/save-business-profile";

export type BusinessProfileValues = {
  companyName: string;
  companyAddress: string;
  companyCity: string;
  companyZip: string;
  companyCountry: string;
  companyRegNo: string;
  companyEmail: string;
  companyPhone: string;
  companyWebsite: string;
};

const fields: Array<{ key: keyof BusinessProfileValues; label: string; required?: boolean; type?: string; placeholder?: string }> = [
  { key: "companyName", label: "Business name", required: true, placeholder: "Rainbow Space Studio — TEST" },
  { key: "companyAddress", label: "Street address", required: true, placeholder: "TEST ADDRESS — NOT A REAL BUSINESS" },
  { key: "companyCity", label: "City", required: true, placeholder: "Kolkata (TEST)" },
  { key: "companyZip", label: "PIN code", required: true, placeholder: "000000" },
  { key: "companyCountry", label: "Country", required: true, placeholder: "India" },
  { key: "companyRegNo", label: "Business registration number (optional)" },
  { key: "companyEmail", label: "Business email", type: "email", placeholder: "test@example.com" },
  { key: "companyPhone", label: "Business phone" },
  { key: "companyWebsite", label: "Website", type: "url", placeholder: "https://example.com" },
];

export function BusinessProfileForm({ initialValues }: { initialValues: BusinessProfileValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const update = (key: keyof BusinessProfileValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const save = () => {
    setErrors({});
    startTransition(async () => {
      const result = await saveBusinessProfile(values as BusinessProfileInput);
      if (result.ok) {
        toast.success("Business profile saved");
        router.refresh();
      } else {
        toast.error(result.error);
        if (result.fieldErrors) setErrors(result.fieldErrors);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, required, type = "text", placeholder }) => (
          <div key={key} className={`min-w-0 space-y-2 ${key === "companyAddress" ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={`business-${key}`}>{label}{required && <span className="text-destructive"> *</span>}</Label>
            <Input
              id={`business-${key}`}
              type={type}
              required={required}
              value={values[key]}
              placeholder={placeholder}
              aria-invalid={!!errors[key]}
              onChange={(event) => update(key, event.target.value)}
              autoComplete={key === "companyEmail" ? "email" : key === "companyAddress" ? "street-address" : "organization"}
            />
            {errors[key] && <p className="text-sm text-destructive">{errors[key]}</p>}
          </div>
        ))}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" disabled={isPending} onClick={save} className="w-full sm:w-auto">
          {isPending ? "Saving…" : "Save business profile"}
        </Button>
      </div>
    </div>
  );
}
