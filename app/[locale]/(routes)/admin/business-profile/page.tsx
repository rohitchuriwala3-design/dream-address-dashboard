import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Container from "../../components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { getTestIssuerDefaultsForRuntime } from "@/lib/invoices/test-issuer-defaults";
import { BusinessProfileForm, type BusinessProfileValues } from "./BusinessProfileForm";

export default async function BusinessProfilePage() {
  const [settings, testDefaults] = await Promise.all([
    prismadb.invoice_Settings.findFirst({
      select: {
        companyName: true, companyAddress: true, companyCity: true, companyZip: true,
        companyCountry: true, companyRegNo: true, companyEmail: true, companyPhone: true,
        companyWebsite: true,
      },
    }),
    Promise.resolve(getTestIssuerDefaultsForRuntime()),
  ]);

  const initialValues: BusinessProfileValues = {
    companyName: settings?.companyName?.trim() || testDefaults?.companyName || "",
    companyAddress: settings?.companyAddress?.trim() || testDefaults?.companyAddress || "",
    companyCity: settings?.companyCity?.trim() || testDefaults?.companyCity || "",
    companyZip: settings?.companyZip?.trim() || testDefaults?.companyZip || "",
    companyCountry: settings?.companyCountry?.trim() || testDefaults?.companyCountry || "India",
    companyRegNo: settings?.companyRegNo ?? "",
    companyEmail: settings?.companyEmail?.trim() || testDefaults?.companyEmail || "",
    companyPhone: settings?.companyPhone ?? "",
    companyWebsite: settings?.companyWebsite?.trim() || testDefaults?.companyWebsite || "",
  };

  return (
    <Container title="Business Profile" description="One saved company identity for invoices, approved quotations, and other company documents.">
      <Card className="min-w-0 max-w-4xl">
        <CardHeader className="space-y-2">
          <CardTitle>Business details</CardTitle>
          <CardDescription>
            Update the shared issuer information once. Invoice and quotation documents read from this profile. Staging values are marked TEST; replace them before issuing client documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessProfileForm initialValues={initialValues} />
        </CardContent>
      </Card>
    </Container>
  );
}
