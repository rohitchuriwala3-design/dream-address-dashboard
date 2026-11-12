import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectVendorBill = {
  id: string; vendorInvoiceNumber: string; description: string; grossAmount: unknown;
  currency: string; invoiceDate: Date | string; dueDate: Date | string | null; status: string;
  vendor?: { name: string };
};

export function ProjectVendorBills({ bills }: { bills: ProjectVendorBill[] }) {
  return <Card>
    <CardHeader className="flex flex-row items-center justify-between gap-3"><div><CardTitle>Supplier bills</CardTitle><p className="mt-1 text-sm text-muted-foreground">Payables linked to this project.</p></div><Link className="inline-flex items-center text-sm font-medium text-primary hover:underline" href="/vendor-bills">Open finance<ArrowUpRight className="ml-1 h-4 w-4"/></Link></CardHeader>
    <CardContent>{bills.length===0?<p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">No supplier bills are linked to this project.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[600px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="py-2">Supplier / bill</th><th>Due date</th><th>Status</th><th className="text-right">Gross payable</th></tr></thead><tbody>{bills.map((bill)=><tr key={bill.id} className="border-b last:border-0"><td className="py-3"><p className="font-medium">{bill.vendor?.name||"Vendor"}</p><p className="text-xs text-muted-foreground">{bill.vendorInvoiceNumber} · {bill.description}</p></td><td>{bill.dueDate?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric"}).format(new Date(bill.dueDate)):"Not set"}</td><td><span className="rounded-full bg-muted px-2 py-1 text-xs">{bill.status.replaceAll("_"," ")}</span></td><td className="text-right font-medium">{new Intl.NumberFormat("en-IN",{style:"currency",currency:bill.currency,maximumFractionDigits:2}).format(Number(bill.grossAmount))}</td></tr>)}</tbody></table></div>}</CardContent>
  </Card>;
}
