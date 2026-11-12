import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getTranslations } from "next-intl/server";
import { prismadb } from "@/lib/prisma";
import { InvoiceForm } from "../components/invoice-form";
import { listInvoiceProjectOptions } from "@/actions/studio-projects/service";

export default async function NewInvoicePage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const query = await searchParams;
  const t = await getTranslations("InvoicesPage");

  const [products, taxRates, series, currencies, settings, projects] =
    await Promise.all([
      prismadb.crm_Products.findMany({
        select: { id: true, name: true },
        where: { status: "ACTIVE" },
        orderBy: { name: "asc" },
      }),
      prismadb.invoice_TaxRates.findMany({
        where: { active: true },
        orderBy: { rate: "desc" },
      }),
      prismadb.invoice_Series.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      prismadb.currency.findMany({
        where: { isEnabled: true },
        orderBy: { code: "asc" },
      }),
      prismadb.invoice_Settings.findFirst(),
      listInvoiceProjectOptions(),
    ]);

  const formLabels = {
    type: t("form.type"),
    account: t("form.account"),
    currency: t("form.currency"),
    series: t("form.series"),
    dueDate: t("form.dueDate"),
    lineItems: t("form.lineItems"),
    addLine: t("form.addLine"),
    product: t("form.product"),
    description: t("form.description"),
    quantity: t("form.quantity"),
    unitPrice: t("form.unitPrice"),
    discount: t("form.discount"),
    taxRate: t("form.taxRate"),
    total: t("form.total"),
    publicNotes: t("form.publicNotes"),
    internalNotes: t("form.internalNotes"),
    save: t("form.save"),
    bankName: t("form.bankName"),
    iban: t("form.iban"),
    swift: t("form.swift"),
    variableSymbol: t("form.variableSymbol"),
  };
  const selectedProject = projects.find((project) => project.id === query.projectId);

  return (
    <Container title={t("new")} description={t("description")}>
      <InvoiceForm
        products={JSON.parse(JSON.stringify(products))}
        taxRates={JSON.parse(JSON.stringify(taxRates))}
        series={JSON.parse(JSON.stringify(series))}
        currencies={JSON.parse(JSON.stringify(currencies))}
        settings={settings ? JSON.parse(JSON.stringify(settings)) : null}
        labels={formLabels}
        projects={projects.map((project) => ({ id: project.id, code: project.code, name: project.name, accountId: project.accountId, accountName: project.account.name }))}
        initialStudioProjectId={selectedProject?.id}
      />
    </Container>
  );
}
