"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveInvoiceSettings } from "../_actions/invoice-settings";
import type { InvoiceSettingsInput, FieldErrors } from "../_actions/invoice-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Currency {
  code: string;
  name: string;
}

interface Series {
  id: string;
  name: string;
}

interface Settings {
  id: string;
  baseCurrency: string;
  defaultSeriesId: string | null;
  defaultDueDays: number;
  bankName: string | null;
  bankAccount: string | null;
  iban: string | null;
  swift: string | null;
  footerText: string | null;
  companyName: string | null;
  companyAddress: string | null;
  companyCity: string | null;
  companyZip: string | null;
  companyCountry: string | null;
  companyVatId: string | null;
  companyTaxId: string | null;
  companyRegNo: string | null;
  companyEmail: string | null;
  companyPhone: string | null;
  companyWebsite: string | null;
}

interface Props {
  settings: Settings | null;
  currencies: Currency[];
  series: Series[];
}

export function InvoiceSettingsForm({
  settings,
  currencies,
  series,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _, ...rest } = prev;
      return rest;
    });

  const [baseCurrency] = useState<"INR">("INR");
  const [defaultSeriesId, setDefaultSeriesId] = useState(
    settings?.defaultSeriesId ?? ""
  );
  const [defaultDueDays, setDefaultDueDays] = useState(
    settings?.defaultDueDays?.toString() ?? "14"
  );
  const [bankName, setBankName] = useState(settings?.bankName ?? "");
  const [bankAccount, setBankAccount] = useState(
    settings?.bankAccount ?? ""
  );
  const [iban, setIban] = useState(settings?.iban ?? "");
  const [swift, setSwift] = useState(settings?.swift ?? "");
  const [footerText, setFooterText] = useState(settings?.footerText ?? "");
  const [companyName, setCompanyName] = useState(settings?.companyName ?? "");
  const [companyAddress, setCompanyAddress] = useState(settings?.companyAddress ?? "");
  const [companyCity, setCompanyCity] = useState(settings?.companyCity ?? "");
  const [companyZip, setCompanyZip] = useState(settings?.companyZip ?? "");
  const [companyCountry, setCompanyCountry] = useState(settings?.companyCountry ?? "India");
  const [companyRegNo, setCompanyRegNo] = useState(settings?.companyRegNo ?? "");
  const [companyEmail, setCompanyEmail] = useState(settings?.companyEmail ?? "");
  const [companyPhone, setCompanyPhone] = useState(settings?.companyPhone ?? "");
  const [companyWebsite, setCompanyWebsite] = useState(settings?.companyWebsite ?? "");

  const handleSave = () => {
    const payload: InvoiceSettingsInput = {
      baseCurrency,
      defaultSeriesId: defaultSeriesId || null,
      defaultTaxRateId: null,
      defaultDueDays: parseInt(defaultDueDays) || 14,
      bankName: bankName || null,
      bankAccount: bankAccount || null,
      iban: iban || null,
      swift: swift || null,
      footerText: footerText || null,
      companyName,
      companyAddress,
      companyCity,
      companyZip,
      companyCountry,
      companyRegNo,
      companyVatId: settings?.companyVatId ?? null,
      companyTaxId: settings?.companyTaxId ?? null,
      companyEmail: companyEmail || null,
      companyPhone: companyPhone || null,
      companyWebsite: companyWebsite || null,
    };

    setErrors({});
    startTransition(async () => {
      const res = await saveInvoiceSettings(payload);
      if (res.ok) {
        toast.success("Settings saved");
        router.refresh();
      } else {
        toast.error(res.error);
        if (res.fieldErrors) setErrors(res.fieldErrors);
      }
    });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Company Details
        </h3>
        <div className="space-y-2">
          <Label>Company Name <span className="text-destructive">*</span></Label>
          <Input
            value={companyName}
            onChange={(e) => {
              setCompanyName(e.target.value);
              clearError("companyName");
            }}
            placeholder="e.g. Impressive Creators"
            aria-invalid={!!errors.companyName}
          />
          {errors.companyName && (
            <p className="text-xs text-destructive">{errors.companyName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Street Address <span className="text-destructive">*</span></Label>
          <Input
            value={companyAddress}
            onChange={(e) => {
              setCompanyAddress(e.target.value);
              clearError("companyAddress");
            }}
            placeholder="Street address"
            aria-invalid={!!errors.companyAddress}
          />
          {errors.companyAddress && (
            <p className="text-xs text-destructive">{errors.companyAddress}</p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>City <span className="text-destructive">*</span></Label>
            <Input
              value={companyCity}
              onChange={(e) => {
                setCompanyCity(e.target.value);
                clearError("companyCity");
              }}
              aria-invalid={!!errors.companyCity}
            />
            {errors.companyCity && (
              <p className="text-xs text-destructive">{errors.companyCity}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>ZIP / Postal Code <span className="text-destructive">*</span></Label>
            <Input
              value={companyZip}
              onChange={(e) => {
                setCompanyZip(e.target.value);
                clearError("companyZip");
              }}
              aria-invalid={!!errors.companyZip}
            />
            {errors.companyZip && (
              <p className="text-xs text-destructive">{errors.companyZip}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Country <span className="text-destructive">*</span></Label>
            <Input
              value={companyCountry}
              onChange={(e) => {
                setCompanyCountry(e.target.value);
                clearError("companyCountry");
              }}
              placeholder="India"
              aria-invalid={!!errors.companyCountry}
            />
            {errors.companyCountry && (
              <p className="text-xs text-destructive">{errors.companyCountry}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Business registration number (optional)</Label>
            <Input
              value={companyRegNo}
              onChange={(e) => {
                setCompanyRegNo(e.target.value);
                clearError("companyRegNo");
              }}
              aria-invalid={!!errors.companyRegNo}
            />
            {errors.companyRegNo && (
              <p className="text-xs text-destructive">{errors.companyRegNo}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={companyEmail}
              onChange={(e) => {
                setCompanyEmail(e.target.value);
                clearError("companyEmail");
              }}
              aria-invalid={!!errors.companyEmail}
            />
            {errors.companyEmail && (
              <p className="text-xs text-destructive">{errors.companyEmail}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="e.g. https://acme.com"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Invoice Defaults
        </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Base Currency</Label>
          <Select value={baseCurrency} disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR — Indian Rupee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Default Due Days</Label>
          <Input
            type="number"
            value={defaultDueDays}
            onChange={(e) => setDefaultDueDays(e.target.value)}
            min={1}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Default Series</Label>
          <Select value={defaultSeriesId} onValueChange={setDefaultSeriesId}>
            <SelectTrigger>
              <SelectValue placeholder="Select series..." />
            </SelectTrigger>
            <SelectContent>
              {series.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Bank Name</Label>
          <Input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          placeholder="Bank name"
          />
        </div>
        <div className="space-y-2">
          <Label>Bank Account</Label>
          <Input
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
          placeholder="Bank account number"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>IBAN</Label>
          <Input
            value={iban}
            onChange={(e) => setIban(e.target.value)}
          placeholder="IBAN, if applicable"
          />
        </div>
        <div className="space-y-2">
          <Label>SWIFT</Label>
          <Input
            value={swift}
            onChange={(e) => setSwift(e.target.value)}
          placeholder="SWIFT code, if applicable"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Footer Text</Label>
        <Textarea
          value={footerText}
          onChange={(e) => setFooterText(e.target.value)}
          placeholder="Text displayed at the bottom of invoices"
          rows={3}
        />
      </div>

      </div>

      <Button onClick={handleSave} disabled={isPending}>
        {isPending ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
