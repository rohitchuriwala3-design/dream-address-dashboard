"use server";

import { revalidatePath } from "next/cache";
import { prismadb } from "@/lib/prisma";
import {
  assertCanWriteAccount,
  assertCanWriteLead,
  AuthenticationError,
  AuthorizationError,
  PARTNER_EDIT,
  requireAuthenticated,
} from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit-log";
import { handleStageTransition } from "@/lib/crm/stage-transition";

type ConversionResult = {
  accountId: string;
  contactId: string;
  opportunityId: string;
  alreadyConverted: boolean;
};

/** Convert a CRM lead once, atomically, into a client, contact, and opportunity. */
export async function convertLead(leadId: string): Promise<ConversionResult | { error: string }> {
  let user;
  try {
    user = await requireAuthenticated({ partner: true });
  } catch (error) {
    if (error instanceof AuthenticationError) return { error: "Unauthorized" };
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

      const entryStage = await tx.crm_Opportunities_Sales_Stages.findFirst({
        orderBy: { order: "asc" },
        select: { id: true },
      });
      const opportunity = await tx.crm_Opportunities.create({
        data: {
          name: `${lead.company?.trim() || contactName} — design opportunity`,
          description: lead.description ?? undefined,
          account: account.id,
          contact: contact.id,
          assigned_to: lead.assigned_to || user.id,
          createdBy: user.id,
          updatedBy: user.id,
          last_activity_by: user.id,
          last_activity: new Date(),
          currency: "INR",
          sales_stage: entryStage?.id,
          stage_entered_at: new Date(),
          status: "ACTIVE",
        },
      });

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
        const opportunity = await prismadb.crm_Opportunities.findUnique({
          where: { id: result.opportunityId },
          select: { sales_stage: true },
        });
        await handleStageTransition({
          opportunityId: result.opportunityId,
          fromStage: null,
          toStage: opportunity?.sales_stage ?? null,
        });
      } catch (error) {
        // Conversion already committed. Do not tell the user it failed and
        // encourage another conversion because a downstream automation failed.
        console.error("[convertLead] Stage automation failed after conversion", error);
      }
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
    revalidatePath("/[locale]/(routes)/crm/accounts", "page");
    revalidatePath("/[locale]/(routes)/crm/contacts", "page");
    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return result;
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: "Forbidden" };
    console.error("[convertLead] Error:", error);
    return { error: error instanceof Error ? error.message : "Failed to convert lead" };
  }
}
