import { createInvoiceSchema } from "@/types/invoice";

const validInvoice = {
  accountId: "5f4e5fca-5f55-4b68-89d9-9c88e70567ba",
  currency: "INR",
  lineItems: [{ position: 0, description: "Interior design", quantity: 1, unitPrice: 1000 }],
};

describe("India bank details on invoice inputs", () => {
  it("allows optional bank transfer details", () => {
    expect(createInvoiceSchema.safeParse(validInvoice).success).toBe(true);
  });

  it("accepts and normalizes an Indian IFSC code", () => {
    const result = createInvoiceSchema.parse({ ...validInvoice, bankIfsc: "hdfc0001234" });
    expect(result.bankIfsc).toBe("HDFC0001234");
  });

  it("rejects malformed IFSC codes", () => {
    const result = createInvoiceSchema.safeParse({ ...validInvoice, bankIfsc: "not-an-ifsc" });
    expect(result.success).toBe(false);
  });
});
