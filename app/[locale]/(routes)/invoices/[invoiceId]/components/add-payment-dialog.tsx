"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPayment } from "@/actions/invoices/add-payment";

const PAYMENT_METHODS = [
  "Bank Transfer",
  "Cash",
  "Card",
  "Check",
  "PayPal",
  "Other",
];

interface AddPaymentDialogProps {
  invoiceId: string;
  balanceDue: string;
  currency: string;
  accounts: { id: string; name: string }[];
}

export function AddPaymentDialog({
  invoiceId,
  balanceDue,
  currency,
  accounts,
}: AddPaymentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState(balanceDue);
  const [paidAt, setPaidAt] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [treasuryAccountId, setTreasuryAccountId] = useState(accounts[0]?.id ?? "");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await addPayment({
        invoiceId,
        treasuryAccountId,
        idempotencyKey,
        amount: parseFloat(amount),
        paidAt: new Date(paidAt).toISOString(),
        method,
        reference: reference || null,
        note: note || null,
      });
      toast.success("Payment recorded");
      setIdempotencyKey(crypto.randomUUID());
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add payment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Add Payment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Add Payment ({currency} {balanceDue} due)
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              max={balanceDue}
              disabled={saving}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Deposit account</Label>
            <Select value={treasuryAccountId} onValueChange={setTreasuryAccountId}>
              <SelectTrigger disabled={saving}><SelectValue placeholder="Choose cash account" /></SelectTrigger>
              <SelectContent>{accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              disabled={saving}
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger disabled={saving}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference</Label>
            <Input
              value={reference}
              disabled={saving}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Transaction reference"
            />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <Input
              value={note}
              disabled={saving}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={saving || !treasuryAccountId || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(balanceDue)}
          >
            {saving ? "Saving..." : "Record Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
