import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, FileCheck2 } from "lucide-react";
import { listVendorAccounts, listVendorBillProjects, listVendorBills, VendorBillError } from "@/actions/vendor-bills/service";
import { VendorBillActions, VendorBillForm } from "./vendor-bill-controls";
import { listActiveTreasuryAccounts } from "@/actions/treasury/service";

const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const formatMoney = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
const formatDate = (value: Date | string | null) => value ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "—";

export default async function VendorBillsPage() {
  let vendors; let projects; let bills; let treasuryAccounts;
  try { [vendors, projects, bills, treasuryAccounts] = await Promise.all([listVendorAccounts(), listVendorBillProjects(), listVendorBills(), listActiveTreasuryAccounts()]); }
  catch (error) { if (error instanceof VendorBillError && error.code === "FORBIDDEN") notFound(); throw error; }
  const inr = bills.filter((bill)=>bill.currency==="INR");
  const submitted = inr.filter((bill)=>bill.status==="SUBMITTED").reduce((sum,bill)=>sum+Number(bill.grossAmount),0);
  const approved = inr.filter((bill)=>bill.status==="APPROVED").reduce((sum,bill)=>sum+Number(bill.grossAmount),0);
  const overdue = inr.filter((bill)=>bill.status==="APPROVED"&&bill.dueDate&&new Date(bill.dueDate).toISOString().slice(0,10)<today).reduce((sum,bill)=>sum+Number(bill.grossAmount),0);
  const paid = inr.filter((bill)=>bill.status==="PAID").reduce((sum,bill)=>sum+Number(bill.grossAmount),0);
  return <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-4">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Finance · Payables</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Vendor bills</h1><p className="mt-2 text-sm text-muted-foreground">Track supplier invoices through review and payment recording.</p></div><Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent" href="/vendors">Vendors<ArrowUpRight className="ml-2 h-4 w-4"/></Link></header>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Summary label="Awaiting review (INR)" value={formatMoney(submitted)}/><Summary label="Approved payables (INR)" value={formatMoney(approved)}/><Summary label="Overdue approved (INR)" value={formatMoney(overdue)}/><Summary label="Marked paid (INR)" value={formatMoney(paid)}/></div>
    <section className="space-y-3"><VendorBillForm vendors={vendors} projects={projects}/><div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">Totals include INR bills only. Marking a bill paid debits the selected active treasury account; reconcile it against your bank statement.</div></section>
    <div className="overflow-x-auto rounded-xl border bg-card"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b bg-muted/40 text-left text-muted-foreground"><th className="px-4 py-3">Vendor bill</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Invoice / due date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Payable</th><th className="px-4 py-3">Payment reference / note</th><th className="px-4 py-3">Action</th></tr></thead><tbody>{inr.map((bill)=><tr key={bill.id} className="border-b align-top last:border-0"><td className="px-4 py-3"><p className="font-medium">{bill.vendor.name}</p><p className="text-xs text-muted-foreground">#{bill.vendorInvoiceNumber} · {bill.description}</p></td><td className="px-4 py-3">{bill.project?`${bill.project.code} · ${bill.project.name}`:"Unallocated"}</td><td className="px-4 py-3">{formatDate(bill.invoiceDate)}<p className="text-xs text-muted-foreground">Due {formatDate(bill.dueDate)}</p></td><td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-1 text-xs">{bill.status.replaceAll("_"," ")}</span></td><td className="px-4 py-3 text-right font-medium">{formatMoney(Number(bill.grossAmount))}</td><td className="max-w-52 break-words px-4 py-3 text-xs text-muted-foreground">{bill.paymentReference||bill.reviewNote||"—"}</td><td className="px-4 py-3"><VendorBillActions billId={bill.id} status={bill.status} bill={bill} accounts={treasuryAccounts.filter((account)=>account.currency===bill.currency)}/></td></tr>)}</tbody></table>{inr.length===0&&<div className="p-10 text-center"><FileCheck2 className="mx-auto h-8 w-8 text-muted-foreground"/><p className="mt-3 font-medium">No vendor bills recorded</p><p className="mt-1 text-sm text-muted-foreground">Add an active vendor before submitting supplier invoices.</p></div>}</div>
  </main>;
}

function Summary({label,value}:{label:string;value:string}){return <div className="rounded-xl border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums">{value}</p></div>;}
