"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveInvoiceSettings } from "../_actions/invoice-settings";
import type { InvoiceSettingsInput } from "../_actions/invoice-settings";
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
    };

    startTransition(async () => {
      const res = await saveInvoiceSettings(payload);
      if (res.ok) {
        toast.success("Settings saved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="w-full max-w-2xl min-w-0 space-y-6">
      <div className="flex min-w-0 flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 space-y-1">
          <h3 className="font-semibold">Shared business identity</h3>
          <p className="break-words text-sm text-muted-foreground">Manage the company details used by invoices and approved quotations from the Business Profile page.</p>
        </div>
        <Button asChild variant="outline" className="w-full shrink-0 sm:w-auto">
          <Link href="/admin/business-profile">Open Business Profile</Link>
        </Button>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Invoice Defaults
        </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
