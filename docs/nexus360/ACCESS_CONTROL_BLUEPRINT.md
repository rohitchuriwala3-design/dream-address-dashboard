# MARK IV access control blueprint

## Decision

Use a configurable access hierarchy for organizational designation and a permission matrix for authorization. A user's title (Associate, Senior Associate, Manager, Senior Manager, Founder, or Administrator) is not itself an authorization rule. Each hierarchy level has a configurable baseline by module and action; individual users can receive explicit overrides. Keep a protected system-owner path for account recovery and access administration so a configuration mistake cannot lock every administrator out.

Hierarchy labels and parent/child relationships must be editable by an authorized administrator. Permission inheritance is configured per module/action, rather than assumed globally. Record-level scope is a separate control from module access.

## Current verified state

- Local schema now has configurable access-level rows, reporting-line links, per-user allow/deny and record-scope fields, and access-level permission rows. The additive migrations are applied to the isolated local PostgreSQL database; staging is not migrated or deployed.
- Local CRM scope helpers now constrain leads, accounts, contacts, opportunities, and contracts to the configured record scope. Associates are limited to own/assigned records; managers use their configured reporting tree; company-wide scope is reserved for Founder/Administrator. Related shared-account relationships no longer widen an associate's record list.
- Admin Users now has a local Team hierarchy editor for the seeded designations and reporting lines. Saving is admin-only, audited, rejects partner reporting targets, requires a higher-level manager, and prevents cycles. Editing designation labels/rank or arbitrary hierarchy tiers is not yet in the UI.
- Lead create now performs normalized email/India-phone duplicate detection inside a PostgreSQL transaction with advisory locks. The response identifies conflicting field(s) without exposing the other lead, and the create form displays an error/toast while retaining values. Normalization SQL was exercised against local PostgreSQL in a rolled-back fixture transaction; app-level cross-user testing on staging and update-time duplicate checks remain open.
- `NexusUserPermission.effect` and per-user scope are schema fields only; the general permission resolver does not yet implement deny precedence or configurable inherited module permissions. Current designation scopes govern CRM record visibility, while the existing module grants still decide CRM entry.
- The earlier QA profile verification only established that its `crm.view` grant was saved; end-to-end browser permission enforcement has not yet been verified against the new migration.
- `requirePermission` gives every `admin` a bypass and conditionally allows `partner`; CRM, projects, finance and reports have broad `view`/`manage` grants.
- `canSeeNavigationModule` also has hard-coded admin and partner behavior. Email and plugins remain admin-only.
- A staging QA profile `MARK IV QA — CRM View Only` (`test@test.com`) was created. The admin permission editor confirms `crm.view` is its only selected module grant. This verifies persistence of the checkbox grant, not a successful sign-in or end-to-end enforcement.
- Source inventory found 50 files containing `requireRole`; additional role checks exist in actions, pages, MCP tools, and record-scope functions. Admin/manager decisions currently protect settings, approvals, imports, finance actions, and user administration.

## Authorization model

1. **System recovery authority:** one or more explicitly designated system owners can repair access and manage the platform. This is an audited, protected capability, not an ordinary hierarchy tier. Prevent removal/demotion of the last active owner.
2. **Designation hierarchy:** editable levels such as Associate → Senior Associate → Manager → Senior Manager → Founder → Administrator. Store hierarchy separately from authentication identity and permissions.
3. **Per-level module matrix:** grant actions such as view, create, edit, archive, export, approve, and configure for each module. The administrator controls which levels inherit which permissions from parent levels.
4. **Per-user overrides:** explicit allow/deny entries can refine the level baseline. Deny wins over inherited allow. All changes require an audit record and a confirmation/readback in the admin UI.
5. **Record scope:** independently select own/assigned, reporting-tree, team, or company scope. A module grant never implies visibility of every record.
6. **Navigation:** derive visible modules from the same effective-permission resolver used by server pages, server actions, and APIs. Hiding navigation is not an authorization check.
7. **External clients/partners:** model their account scope explicitly. Do not let an internal designation hierarchy grant external users broader company visibility.

### Default lead data visibility

- Associates and Senior Associates can read/write leads assigned to them (plus records they created only where a workflow needs that distinction). They do not see another Associate's or Senior Associate's lead records.
- Managers can read/write their own records and the records of users in their configured reporting tree. A Manager can see the Associates and Senior Associates assigned below them; unrelated teams remain private.
- Founders have company-wide read access. Their write, export, approval, and user-management actions remain independently configurable in the module matrix.
- Administrators can be configured separately. Keep a protected system-owner recovery capability so a permissions mistake cannot remove all access administration.
- Access-level hierarchy and reporting hierarchy are separate: designation inheritance does not silently make an unrelated manager a record owner.

### Lead duplicate rule

- On create, compare normalized email and Indian phone values independently. A match on either field blocks the save. Normalize emails by trim + lowercase; normalize Indian numbers by stripping formatting and canonicalizing `+91`/leading `0` to the same 10-digit value. Update-time duplicate checks remain planned.
- Make the check atomic under concurrent submissions (transaction advisory locks) so two associates cannot create the same lead at the same time. Do not expose another team's lead details in the conflict response; show which submitted field conflicts and keep the user's current form values open for correction.
- If the match is an existing Lead, provide a safe route to request manager review. If the match is an existing client Contact/Account, offer the existing client workflow to create another Opportunity instead of asking staff to falsify the contact information to get past a duplicate warning.
- Existing-data cleanup and a database uniqueness index are a separate decision: the staging Postgres database currently rejects external read-only queries due to its IP allowlist, and the allowlist will not be widened for this task. First run an internal duplicate audit and resolve any existing collisions, then decide whether a database-level unique index is safe.

## Suggested V1 permission modules

- Home and dashboard
- Nexus 360 CRM: leads, contacts, accounts, opportunities, quotations, activities, custom fields
- Projects and design delivery
- Finance and accounting: expenses, vendor bills, invoices, receipts, ledgers, reports, treasury
- Documents and design files
- Reports and analytics
- Users and access administration
- Business and CRM settings
- Integrations and Google Sheets
- Campaigns and email

Each module/action can be enabled independently; avoid creating permission keys for features not delivered in V1. Use explicit action-level grants for approvals, exports, bulk changes, and settings because they carry more impact than ordinary view access.

## Safe migration sequence

1. Inventory all role checks, permission decisions, record-scope rules, and navigation entries. Tag each as module authorization, system administration, workflow approval, or external-user record scope.
2. Define a typed permission catalog and a single effective-permission resolver. Add access-level hierarchy, configurable level grants, per-user allow/deny overrides, and scope fields additively; keep legacy columns readable.
3. Backfill legacy admin/manager/user grants into explicit access levels and grants. Compare the old and new decision for every current profile before switching a route.
4. Convert one bounded module at a time. Begin with CRM because the current QA profile is CRM-only. Check both direct page access and every server action/API; test allow, deny, inheritance, and record scope.
5. Convert projects, finance/accounting, reports, documents, integrations, communications, and administration. Keep critical operations such as user management, credential reset, permission editing, and system integrations behind explicit high-impact capabilities.
6. Replace role-based navigation and module guards only after each module has matching server enforcement. Preserve partner record scope as a distinct policy.
7. Run a migration and regression audit; compare effective access for all accounts and verify no accidental access expansion, lockout, or route bypass. Remove legacy role-based authorization only after complete parity evidence.

## Phase 1B acceptance checks

- CRM-only account sees CRM navigation only, uses the current Leads workspace, and cannot open dashboard, finance, projects, settings, or administrative APIs directly.
- A CRM view-only account cannot create or edit CRM records; CRM manage enables only its configured write actions.
- Per-level inheritance and per-user deny behave as configured, with direct navigation/API requests enforcing the same decision.
- Record scope prevents access to unassigned or out-of-scope records even when module access is granted.
- Associates cannot read one another's leads; managers can read their configured reporting tree; founders can read all company leads.
- Duplicate email **or** normalized phone blocks create without closing the form or exposing another team's lead details. Update-time checks are still needed.
- The last system owner cannot be locked out; permission changes are auditable and revocable.
- Admin screen can add, rename, reorder, parent, and deactivate hierarchy levels and configure grants per module/action without changing code.

## Current boundary

This is an additive access-control foundation, not permission to remove legacy guards immediately. Until the migration sequence reaches parity, retain current role checks as defense-in-depth and do not mark the CRM-only sign-in issue as fixed based only on the stored grant.
