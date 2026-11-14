import { prismadb } from "@/lib/prisma";
import type { AuthzUser } from "@/lib/authz/session";
import { AuthorizationError } from "@/lib/authz/errors";
import { assertCanWriteAccount, assertCanWriteLead, PARTNER_EDIT } from "@/lib/authz/scopes/crm";
import { assertAssignableUser } from "@/lib/authz/assignable-user";
import { writeAuditLog, diffObjects } from "@/lib/audit-log";
import { inngest } from "@/inngest/client";
import sendEmail from "@/lib/sendmail";
import { LeadError, type LeadCreateInput, type LeadInput } from "./types";
import { validateRequiredLeadFields } from "./field-settings";

// Lead writes for every caller: server actions, MCP tools and the web-form route.
// Permission checks, the audit log, crm/lead.saved and the assignee email live
// here; revalidatePath stays in the actions. There is no crm/lead.deleted: no
// listener needs it (reads filter deletedAt, and the embedding row is kept so a
// restore needs no re-embed).

async function guard(check: () => Promise<void>) {
  try { await check(); } catch (e) { if (e instanceof AuthorizationError) throw new LeadError("forbidden"); throw e; }
}

// Status, source and type are rows in admin-managed lookup tables. A wrong id is notFound, not an FK error.
async function assertLeadOptions(input: LeadInput) {
  if (input.lead_status_id && !(await prismadb.crm_Lead_Statuses.findUnique({ where: { id: input.lead_status_id } })))
    throw new LeadError("notFound", "Lead status");
  if (input.lead_source_id && !(await prismadb.crm_Lead_Sources.findUnique({ where: { id: input.lead_source_id } })))
    throw new LeadError("notFound", "Lead source");
  if (input.lead_type_id && !(await prismadb.crm_Lead_Types.findUnique({ where: { id: input.lead_type_id } })))
    throw new LeadError("notFound", "Lead type");
}

async function notifyAssignee(lead: { id: string; firstName: string | null; lastName: string }, assigneeId: string) {
  const recipient = await prismadb.users.findFirst({ where: { id: assigneeId } });
  if (!recipient?.email) return;
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/crm/leads/${lead.id}`;
  const en = recipient.userLanguage === "en";
  await sendEmail({
    from: process.env.EMAIL_FROM as string,
    to: recipient.email,
    subject: en
      ? `New lead ${name} has been added to the system and assigned to you.`
      : `Nová příležitost ${name} byla přidána do systému a přidělena vám.`,
    text: en
      ? `New lead ${name} has been added to the system and assigned to you. You can click here for detail: ${url}`
      : `Nová příležitost ${name} byla přidána do systému a přidělena vám. Detaily naleznete zde: ${url}`,
  });
}

function emitSaved(leadId: string) {
  void inngest.send({ name: "crm/lead.saved", data: { record_id: leadId } });
}

function normalizeEmail(value?: string | null) {
  const normalized = value?.trim().toLowerCase();
  return normalized || null;
}

/** Canonical Indian phone comparison: 10 digits, with +91/91/leading zero treated equally. */
function normalizePhone(value?: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

/**
 * Serialize concurrent creates with the same email or phone, then compare against
 * active leads. The message reveals only which field conflicts, never another
 * associate's lead identity or record contents.
 */
async function createLeadWithoutDuplicate(userId: string | null, input: LeadCreateInput, assignee: string | null) {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  return prismadb.$transaction(async (tx) => {
    const lockKeys = [email && `lead-email:${email}`, phone && `lead-phone:${phone}`]
      .filter((key): key is string => Boolean(key))
      .sort();

    for (const key of lockKeys) {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
    }

    const duplicates = await tx.$queryRaw<Array<{ email_match: boolean; phone_match: boolean }>>`
      SELECT
        ${email !== null} AND EXISTS (
          SELECT 1 FROM "crm_Leads" l
          WHERE l."deletedAt" IS NULL
            AND lower(trim(l."email")) = ${email}
        ) AS email_match,
        ${phone !== null} AND EXISTS (
          SELECT 1 FROM "crm_Leads" l
          WHERE l."deletedAt" IS NULL
            AND CASE
              WHEN length(regexp_replace(coalesce(l."phone", ''), '\\D', '', 'g')) = 12
                AND left(regexp_replace(coalesce(l."phone", ''), '\\D', '', 'g'), 2) = '91'
                THEN right(regexp_replace(coalesce(l."phone", ''), '\\D', '', 'g'), 10)
              WHEN length(regexp_replace(coalesce(l."phone", ''), '\\D', '', 'g')) = 11
                AND left(regexp_replace(coalesce(l."phone", ''), '\\D', '', 'g'), 1) = '0'
                THEN right(regexp_replace(coalesce(l."phone", ''), '\\D', '', 'g'), 10)
              ELSE regexp_replace(coalesce(l."phone", ''), '\\D', '', 'g')
            END = ${phone}
        ) AS phone_match
    `;

    const duplicate = duplicates[0];
    if (duplicate?.email_match || duplicate?.phone_match) {
      const fields = [
        duplicate.email_match && "email",
        duplicate.phone_match && "phone number",
      ].filter(Boolean);
      throw new LeadError("duplicate", `A lead with this ${fields.join(" and ")} already exists. Check the value and try again.`);
    }

    return tx.crm_Leads.create({
      data: {
        v: 1,
        ...input,
        email: input.email?.trim() || input.email,
        phone: input.phone?.trim() || input.phone,
        ...(userId ? { assigned_to: assignee, createdBy: userId, updatedBy: userId } : {}),
      },
    });
  });
}

/** Unassigned input goes to the caller; a partner always assigns to himself and must link one of his accounts. */
export async function createLead(user: AuthzUser, input: LeadCreateInput) {
  if (user.role === "partner" && !input.accountsIDs) throw new LeadError("forbidden");
  if (input.accountsIDs) await guard(() => assertCanWriteAccount(user, input.accountsIDs!, PARTNER_EDIT));
  const assignee = user.role === "partner" ? user.id : input.assigned_to || user.id;
  if (assignee !== user.id) await guard(() => assertAssignableUser(user, assignee));
  await validateRequiredLeadFields(input);
  await assertLeadOptions(input);
  const lead = await createLeadWithoutDuplicate(user.id, input, assignee);
  if (assignee !== user.id) await notifyAssignee(lead, assignee);
  await writeAuditLog({ entityType: "lead", entityId: lead.id, action: "created", changes: null, userId: user.id });
  emitSaved(lead.id);
  return lead;
}

/** Leads from the public web form (NEXTCRM_TOKEN): no signed-in user, so no scope check and no assignee. */
export async function createWebLead(input: LeadCreateInput) {
  await validateRequiredLeadFields(input);
  const lead = await createLeadWithoutDuplicate(null, input, null);
  // Marks the row as the web form's, as plugin writes record their plugin id.
  await writeAuditLog({ entityType: "lead", entityId: lead.id, action: "created", changes: [{ field: "web_form", old: null, new: "create-lead-from-web" }] as never, userId: null });
  emitSaved(lead.id);
  return lead;
}

/**
 * Linking a lead to another account needs write access to that account, as in createLead; re-saving the
 * current link (the form sends it on every save) and unlinking are not checked. A partner never changes the
 * assignee or unlinks the account, so he may relink only to another of his accounts.
 */
export async function updateLead(user: AuthzUser, id: string, input: LeadInput) {
  await guard(() => assertCanWriteLead(user, id, PARTNER_EDIT));
  const before = await prismadb.crm_Leads.findUnique({ where: { id, deletedAt: null } });
  const { accountsIDs } = input;
  if (accountsIDs && accountsIDs !== before?.accountsIDs) await guard(() => assertCanWriteAccount(user, accountsIDs, PARTNER_EDIT));
  const partner = user.role === "partner";
  await validateRequiredLeadFields({ ...input, customFields: input.customFields ?? (before?.customFields as Record<string, string | number | boolean | null> | undefined) });
  const data = partner ? { ...input, assigned_to: undefined, accountsIDs: input.accountsIDs || undefined } : input;
  // Only a new assignee other than the caller is checked and mailed; re-saving the current one is neither.
  const { assigned_to } = data;
  const newAssignee = assigned_to && assigned_to !== before?.assigned_to && assigned_to !== user.id ? assigned_to : null;
  if (newAssignee) await guard(() => assertAssignableUser(user, newAssignee));
  await assertLeadOptions(data);
  const lead = await prismadb.crm_Leads.update({ where: { id }, data: { v: 1, ...data, updatedBy: user.id } });
  if (newAssignee) await notifyAssignee(lead, newAssignee);
  const changes = before ? diffObjects(before as Record<string, unknown>, lead as Record<string, unknown>) : null;
  await writeAuditLog({ entityType: "lead", entityId: id, action: "updated", changes, userId: user.id });
  emitSaved(id);
  return lead;
}

/** Soft delete. Partners are refused (no PARTNER_EDIT). */
export async function deleteLead(user: AuthzUser, id: string) {
  await guard(() => assertCanWriteLead(user, id));
  const lead = await prismadb.crm_Leads.update({ where: { id }, data: { deletedAt: new Date(), deletedBy: user.id } });
  await writeAuditLog({ entityType: "lead", entityId: id, action: "deleted", changes: null, userId: user.id });
  return lead;
}

/** Admin only. */
export async function restoreLead(user: AuthzUser, id: string) {
  if (user.role !== "admin") throw new LeadError("forbidden");
  const lead = await prismadb.crm_Leads.update({ where: { id }, data: { deletedAt: null, deletedBy: null } });
  await writeAuditLog({ entityType: "lead", entityId: id, action: "restored", changes: null, userId: user.id });
  return lead;
}
