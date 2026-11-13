"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { toast } from "sonner";
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
import { LineItemsEditor, LineItemRow } from "./line-items-editor";
import { TotalsPanel } from "./totals-panel";
import { AccountSearchCombobox } from "@/components/ui/account-search-combobox";
import { INVOICE_TYPES } from "@/types/invoice";
import { createInvoice } from "@/actions/invoices/create-invoice";
import { updateInvoice } from "@/actions/invoices/update-invoice";

interface Product {
  id: string;
  name: string;
}

interface Series {
  id: string;
  name: string;
}

interface Currency {
  code: string;
  name: string;
}

interface Settings {
  baseCurrency: string;
  defaultSeriesId: string | null;
  defaultDueDays: number;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  bankIfsc: string | null;
}

interface InvoiceProjectOption {
  id: string;
  code: string;
  name: string;
  accountId: string;
  accountName: string;
}

interface InvoiceFormProps {
  products: Product[];
  series: Series[];
  currencies: Currency[];
  settings: Settings | null;
  projects?: InvoiceProjectOption[];
  initialStudioProjectId?: string;
  labels?: Record<string, string>;
  /** Existing invoice data for edit mode */
  initialData?: {
    id: string;
    type: string;
    accountId: string;
    seriesId: string | null;
    currency: string;
    dueDate: string | null;
    bankName: string | null;
    bankAccount: string | null;
    bankAccountHolder: string | null;
    bankIfsc: string | null;
    publicNotes: string | null;
    internalNotes: string | null;
    lineItems: Array<{
      productId: string | null;
      description: string;
      quantity: string;
      unitPrice: string;
      discountPercent: string;
      taxRateId: string | null;
    }>;
  };
}

export function InvoiceForm({
  products,
  series,
  currencies,
  settings,
  projects = [],
  initialStudioProjectId,
  labels,
  initialData,
}: InvoiceFormProps) {
  const router = useRouter();
  const locale = useLocale();
  const [saving, setSaving] = useState(false);
  const isEdit = !!initialData;

  const [type, setType] = useState(initialData?.type ?? "INVOICE");
  const linkedProject = projects.find((project) => project.id === initialStudioProjectId);
  const [accountId, setAccountId] = useState(initialData?.accountId ?? linkedProject?.accountId ?? "");
  const [studioProjectId, setStudioProjectId] = useState(initialStudioProjectId ?? "");
  const [seriesId, setSeriesId] = useState(
    initialData?.seriesId ?? settings?.defaultSeriesId ?? ""
  );
  const [currency, setCurrency] = useState(
    initialData?.currency ?? settings?.baseCurrency ?? "INR"
  );
  const [dueDate, setDueDate] = useState(() => {
    if (initialData?.dueDate) {
      return new Date(initialData.dueDate).toISOString().split("T")[0];
    }
    if (settings?.defaultDueDays) {
      const d = new Date();
      d.setDate(d.getDate() + settings.defaultDueDays);
      return d.toISOString().split("T")[0];
    }
    return "";
  });
  const [bankName, setBankName] = useState(
    initialData?.bankName ?? settings?.bankName ?? ""
  );
  const [bankAccount, setBankAccount] = useState(
    initialData?.bankAccount ?? settings?.bankAccount ?? ""
  );
  const [bankAccountHolder, setBankAccountHolder] = useState(
    initialData?.bankAccountHolder ?? settings?.bankAccountHolder ?? ""
  );
  const [bankIfsc, setBankIfsc] = useState(
    initialData?.bankIfsc ?? settings?.bankIfsc ?? ""
  );
  const [publicNotes, setPublicNotes] = useState(
    initialData?.publicNotes ?? ""
  );
  const [internalNotes, setInternalNotes] = useState(
    initialData?.internalNotes ?? ""
  );


  const [lineItems, setLineItems] = useState<LineItemRow[]>(() => {
    if (initialData?.lineItems?.length) {
      return initialData.lineItems.map((li) => ({
        productId: li.productId ?? "",
        description: li.description,
        quantity: parseFloat(li.quantity) || 1,
        unitPrice: parseFloat(li.unitPrice) || 0,
        discountPercent: parseFloat(li.discountPercent) || 0,
        taxRateId: li.taxRateId ?? "",
      }));
    }
    return [
      {
        productId: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxRateId: "",
      },
    ];
  });

  const totalsInput = lineItems.map((li) => ({
    quantity: li.quantity,
    unitPrice: li.unitPrice,
    discountPercent: li.discountPercent,
    taxRate: 0,
  }));

  const handleSubmit = async () => {
    if (!accountId) {
      toast.error("Please select an account");
      return;
    }
    if (lineItems.length === 0 || !lineItems.some((l) => l.description)) {
      toast.error("At least one line item is required");
      return;
    }

    setSaving(true);
    try {
      const body = {
        type,
        accountId,
        studioProjectId: studioProjectId || null,
        seriesId: seriesId || null,
        currency,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankAccountHolder: bankAccountHolder || null,
        bankIfsc: bankIfsc || null,
        publicNotes: publicNotes || null,
        internalNotes: internalNotes || null,
        lineItems: lineItems
          .filter((l) => l.description)
          .map((l, i) => ({
            position: i,
            productId: l.productId || null,
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            taxRateId: null,
          })),
      };

      const result = isEdit
        ? await updateInvoice(initialData.id, body)
        : await createInvoice(body);

      toast.success(isEdit ? "Invoice updated" : "Invoice created");
      router.push(`/invoices/${result.id}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save invoice"
      );
    } finally {
      setSaving(false);
    }
  };

  const l = labels ?? {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Studio project (optional)</Label>
            <Select value={studioProjectId || "none"} onValueChange={(value) => {
              const selectedProject = projects.find((project) => project.id === value);
              setStudioProjectId(value === "none" ? "" : value);
              if (selectedProject) setAccountId(selectedProject.accountId);
            }}>
              <SelectTrigger><SelectValue placeholder="Link to a project" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((project) => <SelectItem key={project.id} value={project.id}>{project.code} · {project.name} — {project.accountName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{l.type ?? "Type"}</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOICE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{l.account ?? "Account"}</Label>
            <AccountSearchCombobox
              value={accountId}
              onChange={(value) => {
                setAccountId(value);
                if (studioProjectId && projects.find((project) => project.id === studioProjectId)?.accountId !== value) setStudioProjectId("");
              }}
              placeholder="Select account..."
            />
          </div>

          <div className="space-y-2">
            <Label>{l.series ?? "Series"}</Label>
            <Select
              value={seriesId || "none"}
              onValueChange={(v) => setSeriesId(v === "none" ? "" : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select series..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">-</SelectItem>
                {series.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>{l.currency ?? "Currency"}</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{l.dueDate ?? "Due Date"}</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

        </div>

        <div className="space-y-2">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold">Payment details (optional)</h3>
            <p className="text-sm text-muted-foreground">Shown on the invoice only when provided.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>{l.bankName ?? "Bank Name"}</Label>
              <Input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>{l.bankAccount ?? "Account Number"}</Label>
              <Input
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>{l.bankAccountHolder ?? "Account Holder Name"}</Label>
              <Input
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label>{l.bankIfsc ?? "IFSC Code"}</Label>
              <Input
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                maxLength={11}
                placeholder="Optional"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="mb-3 block">
            {l.lineItems ?? "Line Items"}
          </Label>
          <LineItemsEditor
            items={lineItems}
            onChange={setLineItems}
            products={products}
            labels={{
              product: l.product,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discount: l.discount,
              total: l.total,
              addLine: l.addLine,
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{l.publicNotes ?? "Public Notes"}</Label>
            <Textarea
              value={publicNotes}
              onChange={(e) => setPublicNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>{l.internalNotes ?? "Internal Notes"}</Label>
            <Textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? "Saving..."
              : isEdit
                ? "Update Draft"
                : (l.save ?? "Save Draft")}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <TotalsPanel lineItems={totalsInput} currency={currency} locale={locale} />
      </div>
    </div>
  );
}
