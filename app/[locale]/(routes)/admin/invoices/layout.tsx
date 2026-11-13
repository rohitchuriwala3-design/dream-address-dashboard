import { InvoicesTabs } from "./_components/InvoicesTabs";

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Manage invoice settings and number series.
        </p>
      </div>
      <InvoicesTabs />
      {children}
    </div>
  );
}
