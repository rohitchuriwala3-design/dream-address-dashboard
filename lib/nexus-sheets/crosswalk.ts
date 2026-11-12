import { prismadb } from "@/lib/prisma";

export const SHEET_ENTITY_OPTIONS: Record<string, readonly string[]> = {
  Clients: ["CLIENT"],
  Projects: ["PROJECT"],
  Accounts: ["TREASURY_ACCOUNT"],
  Quotations: ["QUOTE_REVISION"],
  "Quotation Lines": ["OPPORTUNITY_LINE_ITEM"],
  Invoices: ["INVOICE"],
  "Invoice Lines": ["INVOICE_LINE_ITEM"],
  Transactions: ["TREASURY_TRANSACTION"],
  Expenses: ["PROJECT_EXPENSE", "VENDOR_BILL"],
  Vendors: ["VENDOR"],
};

export type NexusSheetEntityType = (typeof SHEET_ENTITY_OPTIONS)[keyof typeof SHEET_ENTITY_OPTIONS][number];
export type NexusSheetTargetChoice = { id: string; entityType: NexusSheetEntityType; label: string };

export async function getNexusSheetTargetChoices(sheetTab: string): Promise<NexusSheetTargetChoice[]> {
  const allowed = SHEET_ENTITY_OPTIONS[sheetTab] ?? [];
  const choices: NexusSheetTargetChoice[] = [];
  for (const entityType of allowed) {
    switch (entityType) {
      case "CLIENT":
      case "VENDOR": {
        const type = entityType === "CLIENT" ? "Client" : "Vendor";
        const rows = await prismadb.crm_Accounts.findMany({ where: { type, deletedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: row.name })));
        break;
      }
      case "PROJECT": {
        const rows = await prismadb.studioProject.findMany({ where: { deletedAt: null }, select: { id: true, code: true, name: true }, orderBy: { name: "asc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.code} · ${row.name}` })));
        break;
      }
      case "TREASURY_ACCOUNT": {
        const rows = await prismadb.treasuryAccount.findMany({ select: { id: true, name: true, currency: true, accountMask: true }, orderBy: { name: "asc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.name} · ${row.currency}${row.accountMask ? ` · ••${row.accountMask}` : ""}` })));
        break;
      }
      case "QUOTE_REVISION": {
        const rows = await prismadb.opportunityQuoteRevision.findMany({ select: { id: true, revisionNo: true, opportunity: { select: { name: true } } }, orderBy: [{ submittedAt: "desc" }, { revisionNo: "desc" }], take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.opportunity.name ?? "Opportunity"} · revision ${row.revisionNo}` })));
        break;
      }
      case "OPPORTUNITY_LINE_ITEM": {
        const rows = await prismadb.crm_OpportunityLineItems.findMany({ select: { id: true, name: true, opportunity: { select: { name: true } } }, orderBy: { name: "asc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.opportunity.name ?? "Opportunity"} · ${row.name}` })));
        break;
      }
      case "INVOICE": {
        const rows = await prismadb.invoices.findMany({ select: { id: true, number: true, account: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.number ?? "Draft invoice"} · ${row.account.name}` })));
        break;
      }
      case "INVOICE_LINE_ITEM": {
        const rows = await prismadb.invoice_LineItems.findMany({ select: { id: true, description: true, invoice: { select: { number: true } } }, orderBy: [{ invoiceId: "asc" }, { position: "asc" }], take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.invoice.number ?? "Draft invoice"} · ${row.description}` })));
        break;
      }
      case "TREASURY_TRANSACTION": {
        const rows = await prismadb.treasuryTransaction.findMany({ select: { id: true, type: true, description: true, reference: true }, orderBy: { occurredAt: "desc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.type.replaceAll("_", " ")} · ${row.reference || row.description}` })));
        break;
      }
      case "PROJECT_EXPENSE": {
        const rows = await prismadb.studioProjectExpense.findMany({ select: { id: true, description: true, project: { select: { name: true } } }, orderBy: { incurredOn: "desc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.project.name} · ${row.description}` })));
        break;
      }
      case "VENDOR_BILL": {
        const rows = await prismadb.vendorBill.findMany({ select: { id: true, vendorInvoiceNumber: true, vendor: { select: { name: true } } }, orderBy: { invoiceDate: "desc" }, take: 500 });
        choices.push(...rows.map((row) => ({ id: row.id, entityType, label: `${row.vendor.name} · ${row.vendorInvoiceNumber}` })));
        break;
      }
    }
  }
  return choices;
}

export async function nexusSheetTargetExists(entityType: string, appRecordId: string) {
  switch (entityType) {
    case "CLIENT": return Boolean(await prismadb.crm_Accounts.findFirst({ where: { id: appRecordId, type: "Client" }, select: { id: true } }));
    case "VENDOR": return Boolean(await prismadb.crm_Accounts.findFirst({ where: { id: appRecordId, type: "Vendor" }, select: { id: true } }));
    case "PROJECT": return Boolean(await prismadb.studioProject.findFirst({ where: { id: appRecordId, deletedAt: null }, select: { id: true } }));
    case "TREASURY_ACCOUNT": return Boolean(await prismadb.treasuryAccount.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    case "QUOTE_REVISION": return Boolean(await prismadb.opportunityQuoteRevision.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    case "OPPORTUNITY_LINE_ITEM": return Boolean(await prismadb.crm_OpportunityLineItems.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    case "INVOICE": return Boolean(await prismadb.invoices.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    case "INVOICE_LINE_ITEM": return Boolean(await prismadb.invoice_LineItems.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    case "TREASURY_TRANSACTION": return Boolean(await prismadb.treasuryTransaction.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    case "PROJECT_EXPENSE": return Boolean(await prismadb.studioProjectExpense.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    case "VENDOR_BILL": return Boolean(await prismadb.vendorBill.findUnique({ where: { id: appRecordId }, select: { id: true } }));
    default: return false;
  }
}
