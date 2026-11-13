import { prismadb } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceSettingsForm } from "./_components/InvoiceSettingsForm";
import { getTestIssuerDefaultsForRuntime } from "@/lib/invoices/test-issuer-defaults";

export default async function InvoiceSettingsPage() {
  const [settings, currencies, series] = await Promise.all([
    prismadb.invoice_Settings.findFirst(),
    prismadb.currency.findMany({
      where: { isEnabled: true, code: "INR" },
      orderBy: { code: "asc" },
    }),
    prismadb.invoice_Series.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceSettingsForm
            settings={settings ? JSON.parse(JSON.stringify(settings)) : null}
            currencies={JSON.parse(JSON.stringify(currencies))}
            series={JSON.parse(JSON.stringify(series))}
            testIssuerDefaults={getTestIssuerDefaultsForRuntime()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
