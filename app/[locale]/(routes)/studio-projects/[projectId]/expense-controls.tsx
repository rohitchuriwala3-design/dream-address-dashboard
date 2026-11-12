"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createStudioProjectExpenseAction, markStudioProjectExpensePaidAction, reviewStudioProjectExpenseAction } from "@/actions/studio-projects/actions";

const categories = ["Materials", "Contractor", "Design", "Logistics", "Site", "Permit", "Other"];
const todayKolkata = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

export function AddProjectExpense({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return <div className="space-y-3">
    {!open ? <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4"/>Add expense</Button> : (
      <form className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2" onSubmit={(event) => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        const values = Object.fromEntries(form.entries());
        startTransition(async () => {
          const result = await createStudioProjectExpenseAction({ ...values, projectId });
          if ("error" in result) { toast.error(result.error); return; }
          toast.success("Expense submitted for review"); setOpen(false); router.refresh();
        });
      }}>
        <label className="space-y-1 text-xs font-medium">Category<select name="category" required className="h-10 w-full rounded-md border bg-background px-3 text-sm">{categories.map((item)=><option key={item}>{item}</option>)}</select></label>
        <label className="space-y-1 text-xs font-medium">Amount (INR)<Input name="amount" type="number" min="0.01" step="0.01" required placeholder="0.00"/></label>
        <label className="space-y-1 text-xs font-medium">Vendor / supplier<Input name="vendorName" maxLength={160} placeholder="Optional"/></label>
        <label className="space-y-1 text-xs font-medium">Expense date<Input name="incurredOn" type="date" required defaultValue={todayKolkata()}/></label>
        <label className="space-y-1 text-xs font-medium sm:col-span-2">Description<Input name="description" required minLength={2} maxLength={1000} placeholder="What was purchased or completed?"/></label>
        <label className="space-y-1 text-xs font-medium sm:col-span-2">Invoice / receipt reference<Input name="reference" maxLength={120} placeholder="Optional reference number"/></label>
        <div className="flex gap-2 sm:col-span-2"><Button size="sm" disabled={pending}>{pending ? "Submitting…" : "Submit for review"}</Button><Button size="sm" type="button" variant="ghost" disabled={pending} onClick={()=>setOpen(false)}>Cancel</Button></div>
      </form>
    )}
  </div>;
}

export function ProjectExpenseActions({ expenseId, status, canReview, accounts = [] }: { expenseId: string; status: string; canReview: boolean; accounts?: {id:string;name:string;currency:string}[] }) {
  const [pending, startTransition] = useTransition();
  const [paying, setPaying] = useState(false);
  const router = useRouter();
  if (!canReview || !["SUBMITTED", "APPROVED"].includes(status)) return null;
  const act = (run: () => Promise<{ error?: string; success?: boolean }>, done: string) => startTransition(async () => {
    const result = await run(); if ("error" in result) { toast.error(result.error); return; }
    toast.success(done); router.refresh();
  });
  if (status === "APPROVED") return paying?<form className="min-w-52 space-y-2" onSubmit={(event)=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget).entries());act(()=>markStudioProjectExpensePaidAction(expenseId,String(values.treasuryAccountId),String(values.paymentReference)),"Expense paid and posted to Treasury");}}><select required name="treasuryAccountId" className="h-9 w-full rounded-md border bg-background px-2 text-xs"><option value="">Pay from…</option>{accounts.map((account)=><option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select><Input name="paymentReference" required minLength={2} maxLength={160} placeholder="Bank / payment reference"/><div className="flex gap-1"><Button size="sm" disabled={pending||accounts.length===0}>Confirm paid</Button><Button size="sm" type="button" variant="ghost" onClick={()=>setPaying(false)}>Cancel</Button></div></form>:<Button size="sm" variant="outline" disabled={pending||accounts.length===0} title={accounts.length===0?"Add an active cash account in Treasury first":undefined} onClick={()=>setPaying(true)}><Check className="mr-1 h-3.5 w-3.5"/>Mark paid</Button>;
  return <div className="flex gap-1"><Button size="sm" disabled={pending} onClick={()=>act(()=>reviewStudioProjectExpenseAction(expenseId,"APPROVED"),"Expense approved")}><Check className="mr-1 h-3.5 w-3.5"/>Approve</Button><Button size="sm" variant="outline" disabled={pending} onClick={()=>{
    const note = window.prompt("Why is this expense being rejected?")?.trim();
    if (!note) { toast.error("A rejection reason is required"); return; }
    act(()=>reviewStudioProjectExpenseAction(expenseId,"REJECTED",note),"Expense rejected");
  }}><X className="mr-1 h-3.5 w-3.5"/>Reject</Button></div>;
}
