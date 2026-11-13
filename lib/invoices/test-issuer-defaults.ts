/** Fictional, visibly marked issuer profile for isolated V1 testing only. */
export const TEST_ISSUER_DEFAULTS = {
  companyName: "Rainbow Space Studio — TEST",
  companyAddress: "TEST ADDRESS — NOT A REAL BUSINESS",
  companyCity: "Kolkata (TEST)",
  companyZip: "000000",
  companyCountry: "India",
  companyEmail: "test@example.com",
  companyWebsite: "https://example.com",
} as const;

export function getTestIssuerDefaultsForRuntime() {
  return process.env.MARK4_TEST_ISSUER === "true" ? TEST_ISSUER_DEFAULTS : null;
}
