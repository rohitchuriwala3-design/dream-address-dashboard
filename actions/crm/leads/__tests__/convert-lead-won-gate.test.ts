jest.mock("@/lib/authz", () => ({
  requirePermission: jest.fn(),
  assertCanWriteLead: jest.fn(),
  assertCanWriteAccount: jest.fn(),
  AuthenticationError: class AuthenticationError extends Error {},
  AuthorizationError: class AuthorizationError extends Error {},
  PARTNER_EDIT: { partnerEdit: true },
}));
jest.mock("@/lib/prisma", () => ({ prismadb: { $transaction: jest.fn() } }));
jest.mock("@/lib/audit-log", () => ({ writeAuditLog: jest.fn() }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

import { requirePermission, assertCanWriteLead, assertCanWriteAccount } from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import { convertLead } from "../convert-lead";

const tx = {
  $queryRaw: jest.fn(),
  crm_Leads: { findFirst: jest.fn(), update: jest.fn() },
  crm_Accounts: { create: jest.fn(), findFirst: jest.fn() },
  crm_Contacts: { create: jest.fn() },
  crm_Opportunities: { update: jest.fn() },
  documentsToAccounts: { createMany: jest.fn() },
  documentsToContacts: { createMany: jest.fn() },
  documentsToOpportunities: { createMany: jest.fn() },
  crm_ActivityLinks: { findMany: jest.fn(), createMany: jest.fn() },
};

beforeEach(() => {
  jest.clearAllMocks();
  (requirePermission as jest.Mock).mockResolvedValue({ id: "admin-1", role: "admin" });
  (assertCanWriteLead as jest.Mock).mockResolvedValue(undefined);
  (assertCanWriteAccount as jest.Mock).mockResolvedValue(undefined);
  tx.crm_Leads.findFirst.mockResolvedValue({
    id: "lead-1", firstName: "Asha", lastName: "Sharma", company: "Sharma Residence",
    email: "asha@example.test", phone: "9000000000", description: "Turnkey interiors",
    assigned_to: "admin-1", accountsIDs: null, convertedAt: null,
    convertedAccountId: null, convertedContactId: null, convertedOpportunityId: null,
    preClosureOpportunity: { id: "opp-1", status: "ACTIVE", account: null },
    documents: [],
  });
  tx.crm_Accounts.create.mockResolvedValue({ id: "account-1" });
  tx.crm_Contacts.create.mockResolvedValue({ id: "contact-1" });
  tx.crm_Opportunities.update.mockResolvedValue({});
  tx.crm_Leads.update.mockResolvedValue({});
  tx.crm_ActivityLinks.findMany.mockResolvedValue([]);
  (prismadb.$transaction as jest.Mock).mockImplementation((callback) => callback(tx));
});

describe("convertLead", () => {
  it("refuses to create a client account before the linked opportunity is Won", async () => {
    const result = await convertLead("lead-1");
    expect(result).toEqual({ error: "Start an opportunity and mark it Won after the client confirms before converting this lead to an account" });
    expect(tx.crm_Accounts.create).not.toHaveBeenCalled();
    expect(tx.crm_Contacts.create).not.toHaveBeenCalled();
  });

  it("converts a Won lead once and preserves the opportunity as the first account job", async () => {
    tx.crm_Leads.findFirst.mockResolvedValueOnce({
      id: "lead-1", firstName: "Asha", lastName: "Sharma", company: "Sharma Residence",
      email: "asha@example.test", phone: "9000000000", description: "Turnkey interiors",
      assigned_to: "admin-1", accountsIDs: null, convertedAt: null,
      convertedAccountId: null, convertedContactId: null, convertedOpportunityId: null,
      preClosureOpportunity: { id: "opp-1", status: "WON", account: null },
      documents: [{ document_id: "doc-1" }],
    });
    tx.crm_ActivityLinks.findMany.mockResolvedValueOnce([{ activityId: "activity-1" }]);

    await expect(convertLead("lead-1")).resolves.toEqual({
      accountId: "account-1", contactId: "contact-1", opportunityId: "opp-1", alreadyConverted: false,
    });
    expect(tx.crm_Opportunities.update).toHaveBeenCalledWith({
      where: { id: "opp-1" }, data: { account: "account-1", contact: "contact-1", updatedBy: "admin-1" },
    });
    expect(tx.documentsToAccounts.createMany).toHaveBeenCalledWith({ data: [{ document_id: "doc-1", account_id: "account-1" }], skipDuplicates: true });
    expect(tx.documentsToContacts.createMany).toHaveBeenCalledWith({ data: [{ document_id: "doc-1", contact_id: "contact-1" }], skipDuplicates: true });
    expect(tx.documentsToOpportunities.createMany).toHaveBeenCalledWith({ data: [{ document_id: "doc-1", opportunity_id: "opp-1" }], skipDuplicates: true });
    expect(tx.crm_ActivityLinks.createMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.arrayContaining([
        { activityId: "activity-1", entityType: "account", entityId: "account-1" },
        { activityId: "activity-1", entityType: "contact", entityId: "contact-1" },
        { activityId: "activity-1", entityType: "opportunity", entityId: "opp-1" },
      ]), skipDuplicates: true,
    }));
  });

  it("returns the original converted links on repeat submission without duplicating records", async () => {
    tx.crm_Leads.findFirst.mockResolvedValueOnce({
      id: "lead-1", convertedAt: new Date(), convertedAccountId: "account-old",
      convertedContactId: "contact-old", convertedOpportunityId: "opp-old",
    });
    await expect(convertLead("lead-1")).resolves.toEqual({
      accountId: "account-old", contactId: "contact-old", opportunityId: "opp-old", alreadyConverted: true,
    });
    expect(tx.crm_Accounts.create).not.toHaveBeenCalled();
  });
});
