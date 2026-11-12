import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrencies } from "./_actions/currencies";

export default async function CurrenciesPage() {
  const currencies = await getCurrencies();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Regional settings</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">All new MARK IV V1 financial activity uses Indian rupees (INR).</p>
          <div className="rounded-lg border p-4 text-sm"><span className="font-semibold">Active currency: INR</span>{currencies.find((c) => c.code === "INR")?.isEnabled ? " · Enabled" : " · Not enabled in the database yet"}</div>
        </CardContent>
      </Card>
    </div>
  );
}
