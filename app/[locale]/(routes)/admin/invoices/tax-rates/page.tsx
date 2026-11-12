import { redirect } from "next/navigation";

export default async function TaxRatesPage() {
  redirect("/admin/invoices/settings");
}
