"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createVendorBillAction, markVendorBillPaidAction, reviewVendorBillAction, reviseRejectedVendorBillAction } from "@/actions/vendor-bills/actions";

type Vendor = { id: string; name: string };
type Project = { id: string; code: string; name: string; currency: string };

export function VendorBillForm({ vendors, projects }: { vendors: Vendor[]; projects: Project[] }) {
  const [open, setOpen] = useState(false); const [pending, startTransition] = useTransition(); const router = useRouter();
  if (!open) return <Button disabled={!vendors.length} onClick={()=>setOpen(true)}><Plus className="mr-2 h-4 w-4"/>Record vendor bill</Button>;
  return <form className="grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-2 lg:grid-cols-3" onSubmit={(event)=>{
    event.preventDefault(); const values=Object.fromEntries(new FormData(event.currentTarget).entries());
    startTransition(async()=>{const result=await createVendorBillAction(values);if("error" in result){toast.error(result.error);return;}toast.success("Vendor bill submitted for review");setOpen(false);router.refresh();});
  }}>
    <label className="space-y-1 text-xs font-medium">Vendor<select name="vendorAccountId" required className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">Select vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
    <label className="space-y-1 text-xs font-medium">Project (optional)<select name="projectId" className="h-10 w-full rounded-md border bg-background px-3 text-sm"><option value="">General / unallocated</option>{projects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label>
    <label className="space-y-1 text-xs font-medium">Vendor invoice number<Input name="vendorInvoiceNumber" required maxLength={120}/></label>
    <label className="space-y-1 text-xs font-medium">Gross payable amount<Input name="grossAmount" type="number" min="0.01" step="0.01" required placeholder="0.00"/></label>
    <label className="space-y-1 text-xs font-medium">Invoice date<Input name="invoiceDate" type="date" required defaultValue={new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())}/></label>
    <label className="space-y-1 text-xs font-medium">Due date<Input name="dueDate" type="date"/></label>
    <label className="space-y-1 text-xs font-medium md:col-span-2 lg:col-span-3">Description<Input name="description" required minLength={2} maxLength={1000} placeholder="Materials, work, or service billed"/></label>
    <p className="text-xs text-muted-foreground md:col-span-2 lg:col-span-3">Enter the supplier’s gross payable amount. This record does not post to a bank ledger.</p>
    <div className="flex gap-2 md:col-span-2 lg:col-span-3"><Button disabled={pending}>{pending?"Submitting…":"Submit for review"}</Button><Button type="button" variant="ghost" disabled={pending} onClick={()=>setOpen(false)}>Cancel</Button></div>
  </form>;
}

export function VendorBillActions({ billId, status, bill, accounts = [] }: { billId: string; status: string; bill?: { vendorAccountId: string; projectId: string | null; vendorInvoiceNumber: string; description: string; grossAmount: unknown; invoiceDate: Date | string; dueDate: Date | string | null }; accounts?: { id: string; name: string; currency: string }[] }) {
  const [pending,startTransition]=useTransition();const [revising,setRevising]=useState(false);const [paying,setPaying]=useState(false);const router=useRouter();
  const act=(run:()=>Promise<{error?:string;success?:boolean}>,message:string)=>startTransition(async()=>{const result=await run();if("error" in result){toast.error(result.error);return;}toast.success(message);router.refresh();});
  if(status==="SUBMITTED")return <div className="flex gap-1"><Button size="sm" disabled={pending} onClick={()=>act(()=>reviewVendorBillAction(billId,"APPROVED"),"Vendor bill approved")}><Check className="mr-1 h-3.5 w-3.5"/>Approve</Button><Button size="sm" variant="outline" disabled={pending} onClick={()=>{const note=window.prompt("Why is this vendor bill being rejected?")?.trim();if(!note){toast.error("A rejection reason is required");return;}act(()=>reviewVendorBillAction(billId,"REJECTED",note),"Vendor bill rejected");}}><X className="mr-1 h-3.5 w-3.5"/>Reject</Button></div>;
  if(status==="APPROVED")return paying?<form className="min-w-52 space-y-2" onSubmit={(event)=>{event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget).entries());act(()=>markVendorBillPaidAction(billId,String(values.paymentReference),String(values.treasuryAccountId)),"Vendor bill paid and posted to Treasury");}}><select required name="treasuryAccountId" className="h-9 w-full rounded-md border bg-background px-2 text-xs"><option value="">Pay from…</option>{accounts.map((account)=><option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select><Input name="paymentReference" required minLength={2} maxLength={160} placeholder="Bank / UTR reference"/><div className="flex gap-1"><Button size="sm" disabled={pending||accounts.length===0}>Confirm paid</Button><Button size="sm" type="button" variant="ghost" onClick={()=>setPaying(false)}>Cancel</Button></div></form>:<Button size="sm" variant="outline" disabled={pending||accounts.length===0} title={accounts.length===0?"Add an active cash account in Treasury first":undefined} onClick={()=>setPaying(true)}>Mark paid</Button>;
  if(status==="REJECTED"&&bill){
    if(!revising)return <Button size="sm" variant="outline" onClick={()=>setRevising(true)}>Revise &amp; resubmit</Button>;
    return <form className="min-w-64 space-y-2 rounded-md border bg-background p-3" onSubmit={(event)=>{
      event.preventDefault();const values=Object.fromEntries(new FormData(event.currentTarget).entries());
      startTransition(async()=>{const result=await reviseRejectedVendorBillAction(billId,values);if("error" in result){toast.error(result.error);return;}toast.success("Revised bill resubmitted");setRevising(false);router.refresh();});
    }}>
      <input type="hidden" name="vendorAccountId" value={bill.vendorAccountId}/><input type="hidden" name="projectId" value={bill.projectId||""}/>
      <label className="block space-y-1 text-xs">Invoice number<Input name="vendorInvoiceNumber" required maxLength={120} defaultValue={bill.vendorInvoiceNumber}/></label>
      <label className="block space-y-1 text-xs">Description<Input name="description" required maxLength={1000} defaultValue={bill.description}/></label>
      <label className="block space-y-1 text-xs">Gross payable<Input name="grossAmount" type="number" min="0.01" step="0.01" required defaultValue={Number(bill.grossAmount).toFixed(2)}/></label>
      <label className="block space-y-1 text-xs">Invoice date<Input name="invoiceDate" type="date" required defaultValue={new Date(bill.invoiceDate).toISOString().slice(0,10)}/></label>
      <label className="block space-y-1 text-xs">Due date<Input name="dueDate" type="date" defaultValue={bill.dueDate?new Date(bill.dueDate).toISOString().slice(0,10):""}/></label>
      <p className="text-xs text-muted-foreground">The rejection reason remains in the audit log.</p>
      <div className="flex gap-2"><Button size="sm" disabled={pending}>{pending?"Saving…":"Resubmit"}</Button><Button size="sm" type="button" variant="ghost" onClick={()=>setRevising(false)}>Cancel</Button></div>
    </form>;
  }
  return null;
}
