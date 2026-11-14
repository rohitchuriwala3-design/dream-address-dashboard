"use server";

import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import {
  assertCanWriteAccount,
  assertCanWriteLead,
  requirePermission,
  AuthenticationError,
  AuthorizationError,
  PARTNER_EDIT,
} from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit-log";

type ConversionResult = {
  accountId: string;
  contactId: string;
  opportunityId: string;
  alreadyConverted: boolean;
};

/** Convert a lead only after its linked pre-closure opportunity is confirmed Won. */
export async function convertLead(leadId: string): Promise<ConversionResult | { error: string }> {
  let user;
  try {
    user = await requirePermission("crm.manage", { partner: true });
  } catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }

  try {
    await assertCanWriteLead(user, leadId, PARTNER_EDIT);
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    throw error;
  }

  try {
    const result = await prismadb.$transaction(async (tx) => {
      // Serialize repeat clicks and concurrent conversion requests for this lead.
      await tx.$queryRaw`SELECT "id" FROM "crm_Leads" WHERE "id" = ${leadId}::uuid FOR UPDATE`;
      const lead = await tx.crm_Leads.findFirst({
        where: { id: leadId, deletedAt: null },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          jobTitle: true,
          email: true,
          phone: true,
          description: true,
          assigned_to: true,
          accountsIDs: true,
          convertedAt: true,
          convertedAccountId: true,
          convertedContactId: true,
          convertedOpportunityId: true,
          preClosureOpportunity: {
            select: { id: true, status: true, account: true },
          },
          documents: { select: { document_id: true } },
        },
      });
      if (!lead) throw new Error("Lead not found");

      if (lead.convertedAccountId && lead.convertedContactId && lead.convertedOpportunityId) {
        return {
          accountId: lead.convertedAccountId,
          contactId: lead.convertedContactId,
          opportunityId: lead.convertedOpportunityId,
          alreadyConverted: true,
        };
      }

      const opportunity = lead.preClosureOpportunity;
      if (!opportunity || opportunity.status !== "WON") {
        throw new Error("Start an opportunity and mark it Won after the client confirms before converting this lead to an account");
      }

      const contactName = [lead.firstName, lead.lastName].filter(Boolean).join(" ").trim();
      if (!contactName) throw new Error("Add a contact name before converting this lead");
      if (lead.accountsIDs) await assertCanWriteAccount(user, lead.accountsIDs, PARTNER_EDIT);

      const account = lead.accountsIDs
        ? await tx.crm_Accounts.findFirst({ where: { id: lead.accountsIDs, deletedAt: null } })
        : await tx.crm_Accounts.create({
            data: {
              v: 0,
              name: lead.company?.trim() || contactName,
              email: lead.email ?? undefined,
              office_phone: lead.phone ?? undefined,
              description: lead.description ?? undefined,
              status: "Active",
              type: "Customer",
              assigned_to: lead.assigned_to || user.id,
              createdBy: user.id,
            },
          });
      if (!account) throw new Error("Linked client account was not found");

      const contact = await tx.crm_Contacts.create({
        data: {
          v: 0,
          first_name: lead.firstName ?? undefined,
          last_name: lead.lastName,
          email: lead.email ?? undefined,
          mobile_phone: lead.phone ?? undefined,
          position: lead.jobTitle ?? undefined,
          accountsIDs: account.id,
          assigned_to: lead.assigned_to || user.id,
          createdBy: user.id,
        },
      });

      await tx.crm_Opportunities.update({
        where: { id: opportunity.id },
        data: { account: account.id, contact: contact.id, updatedBy: user.id },
      });

      const documentIds = lead.documents.map((item) => item.document_id);
      if (documentIds.length) {
        await tx.documentsToAccounts.createMany({
          data: documentIds.map((document_id) => ({ document_id, account_id: account.id })),
          skipDuplicates: true,
        });
        await tx.documentsToContacts.createMany({
          data: documentIds.map((document_id) => ({ document_id, contact_id: contact.id })),
          skipDuplicates: true,
        });
        await tx.documentsToOpportunities.createMany({
          data: documentIds.map((document_id) => ({ document_id, opportunity_id: opportunity.id })),
          skipDuplicates: true,
        });
      }
      const leadActivityLinks = await tx.crm_ActivityLinks.findMany({
        where: { entityType: "lead", entityId: lead.id },
        select: { activityId: true },
      });
      const activityIds = Array.from(new Set(leadActivityLinks.map(({ activityId }) => activityId)));
      if (activityIds.length) {
        await tx.crm_ActivityLinks.createMany({
          data: [account.id, contact.id, opportunity.id].flatMap((entityId, index) =>
            activityIds.map((activityId) => ({
              activityId,
              entityType: ["account", "contact", "opportunity"][index],
              entityId,
            })),
          ),
          skipDuplicates: true,
        });
      }

      await tx.crm_Leads.update({
        where: { id: lead.id },
        data: {
          accountsIDs: account.id,
          convertedAt: new Date(),
          convertedAccountId: account.id,
          convertedContactId: contact.id,
          convertedOpportunityId: opportunity.id,
          updatedBy: user.id,
        },
      });

      return {
        accountId: account.id,
        contactId: contact.id,
        opportunityId: opportunity.id,
        alreadyConverted: false,
      };
    });

    if (!result.alreadyConverted) {
      try {
        await writeAuditLog({
          entityType: "lead",
          entityId: leadId,
          action: "updated",
          changes: [
            { field: "convertedAccountId", old: null, new: result.accountId },
            { field: "convertedContactId", old: null, new: result.contactId },
            { field: "convertedOpportunityId", old: null, new: result.opportunityId },
          ],
          userId: user.id,
        });
      } catch (error) {
        console.error("[convertLead] Audit event failed after conversion", error);
      }
    }

    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    revalidatePath("/[locale]/(routes)/crm/leads/[leadId]", "page");
    revalidatePath("/[locale]/(routes)/crm/accounts", "page");
    revalidatePath("/[locale]/(routes)/crm/accounts/[accountId]", "page");
    revalidatePath("/[locale]/(routes)/crm/contacts", "page");
    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    revalidatePath("/[locale]/(routes)/crm/opportunities/[opportunityId]", "page");
    return result;
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    console.error("[convertLead] Error:", error);
    return { error: error instanceof Error ? error.message : "Failed to convert lead" };
  }
}
