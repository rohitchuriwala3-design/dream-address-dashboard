import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Building2 } from "lucide-react";
import { listVendorAccounts, VendorBillError } from "@/actions/vendor-bills/service";
import { VendorDirectoryForm } from "./vendor-directory-form";

export default async function VendorsPage() {
  let vendors;
  try { vendors = await listVendorAccounts(); }
  catch (error) { if (error instanceof VendorBillError && error.code === "FORBIDDEN") notFound(); throw error; }
  return <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-4">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Finance · Payables</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">Vendors</h1><p className="mt-2 text-sm text-muted-foreground">Maintain supplier records used by project bills.</p></div><Link className="inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium hover:bg-accent" href="/vendor-bills">Vendor bills<ArrowUpRight className="ml-2 h-4 w-4"/></Link></header>
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Supplier directory</h2><span className="text-sm text-muted-foreground">{vendors.length} active</span></div><VendorDirectoryForm/></section>
    <div className="overflow-hidden rounded-xl border bg-card"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/40 text-left text-muted-foreground"><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Location</th></tr></thead><tbody>{vendors.map((vendor)=><tr key={vendor.id} className="border-b last:border-0"><td className="px-4 py-3"><span className="flex items-center gap-2 font-medium"><Building2 className="h-4 w-4 text-muted-foreground"/>{vendor.name}</span></td><td className="px-4 py-3 text-muted-foreground">{vendor.email||vendor.office_phone||"—"}</td><td className="px-4 py-3 text-muted-foreground">{vendor.billing_city||"—"}</td></tr>)}</tbody></table>{vendors.length===0&&<p className="p-8 text-center text-sm text-muted-foreground">No vendors yet. Add a supplier to start recording payable bills.</p>}</div>
  </main>;
}
