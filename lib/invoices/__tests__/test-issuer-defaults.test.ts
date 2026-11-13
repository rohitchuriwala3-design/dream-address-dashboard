import { buildInvoicePdfData } from "@/lib/invoices/pdf/build-pdf-data";
import { TEST_ISSUER_DEFAULTS } from "@/lib/invoices/test-issuer-defaults";

const invoice = {
  id: "invoice-test",
  type: "INVOICE",
  number: "TEST-001",
  issueDate: new Date("2026-11-14T00:00:00.000Z"),
  dueDate: null,
  taxableSupplyDate: null,
  currency: "INR",
  subtotal: "100.00",
  vatTotal: "0.00",
  grandTotal: "100.00",
  billingSnapshot: null,
  bankName: null,
  iban: null,
  swift: null,
  variableSymbol: null,
  publicNotes: null,
  account: {
    name: "Test Client",
    billing_street: null,
    billing_city: null,
    billing_postal_code: null,
    billing_country: null,
    vat: null,
    company_id: null,
  },
  lineItems: [],
};

describe("staging test issuer defaults", () => {
  const priorTestFlag = process.env.MARK4_TEST_ISSUER;
  const priorAppName = process.env.NEXT_PUBLIC_APP_NAME;

  afterEach(() => {
    if (priorTestFlag === undefined) delete process.env.MARK4_TEST_ISSUER;
    else process.env.MARK4_TEST_ISSUER = priorTestFlag;
    if (priorAppName === undefined) delete process.env.NEXT_PUBLIC_APP_NAME;
    else process.env.NEXT_PUBLIC_APP_NAME = priorAppName;
  });

  it("prints the fictional issuer in staging when saved issuer fields are empty", () => {
    process.env.MARK4_TEST_ISSUER = "true";
    const data = buildInvoicePdfData(invoice, null, "en");

    expect(data.supplier).toMatchObject({
      name: TEST_ISSUER_DEFAULTS.companyName,
      street: TEST_ISSUER_DEFAULTS.companyAddress,
      city: TEST_ISSUER_DEFAULTS.companyCity,
      zip: TEST_ISSUER_DEFAULTS.companyZip,
      country: TEST_ISSUER_DEFAULTS.companyCountry,
    });
  });

  it("does not leak the test issuer into non-staging output", () => {
    delete process.env.MARK4_TEST_ISSUER;
    delete process.env.NEXT_PUBLIC_APP_NAME;
    const data = buildInvoicePdfData(invoice, null, "en");

    expect(data.supplier.name).toBe("MARK IV");
    expect(data.supplier.street).toBeUndefined();
  });
});
