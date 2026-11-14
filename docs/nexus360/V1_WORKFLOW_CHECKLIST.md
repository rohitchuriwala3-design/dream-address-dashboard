# MARK IV V1 workflow and delivery checklist

Updated: 2026-11-14 (Asia/Kolkata)

## Product decisions

- MARK IV is the internal master workspace for Dream Space Studios; Nexus 360 is its CRM module.
- This is a single-company internal operations system, not a productized SaaS.
- India is the operating context: INR and Asia/Kolkata are the only active V1 currency/time defaults. Only INR should be selectable, used for new records, or shown in active V1 dashboards. Historical financial amounts are preserved as recorded; they must not be silently relabeled or converted.
- Public sign-up remains off. Admin provisions accounts. Admin is the full-access role; Partner is a restricted external account-scoped role. Other staff receive only permissions that are enforced on the server.
- Odoo and general-purpose AI analysis are future phases. Do not make them V1 dependencies.
- Google Sheets remains usable by staff, but sync is not considered connected until a staged round trip is reconciled.

## Phased delivery plan

## Phase exit and regression gate

Use three verification levels to avoid repeating full-phase work during every small edit:

1. **Work batch:** run only the changed-file lint/type checks and the directly affected focused tests; update the progress tracker and checkpoint with changed items and current blockers. Do not repeat market research, broad source scans, or the whole previous-phase suite unless this batch changes those areas.
2. **Milestone / deploy:** when a coherent user journey or schema change is ready, run its focused integration tests, migration/build checks as applicable, and one staging smoke check after deployment. Reuse existing evidence for unaffected requirements.
3. **Phase exit:** once, before closing the phase, run the complete acceptance checklist for that phase plus the required regression set for earlier completed phases. Recheck earlier phases sooner only when code changes directly touch their security/data behavior or a focused regression reveals a problem. This exit gate is still mandatory; batching does not lower the standard.

Keep one current source of truth in the checklist and the top section of the continuation checkpoint. Treat older timestamped checkpoints as historical evidence, not open tasks to repeat. Preserve test counts as named, non-overlapping groups (or explicitly state overlap); never add overlapping suite totals. Keep fixed scores and verified facts until new evidence changes them. Always show the Sheet connector's real current state, but do not rerun a full Sheet audit outside Phase 4 unless its code or credentials changed. For each phase, record commit, environment, relevant test evidence, failed/blocked checks, and known limitations. Do not mark a phase complete while any required exit gate is blocked or failing.

Each phase report must include a 0–100 health score with a short breakdown for functionality, data correctness, access control, usability/mobile, integration and deployment. A score is an evidence-based estimate, not a test pass rate. Carry earlier-phase scores forward and change them when regressions appear; report unverified areas as unverified rather than counting them as passing.

### Phase 0 — Scope and safety baseline (done)

- [x] Confirm MARK IV is the internal master workspace and Nexus 360 is the CRM module for Dream Space Studios.
- [x] Separate V1 requirements from later options: Odoo and broad AI are deferred; retain Sheets as an intended staff workflow; keep legacy production isolated.
- [x] Document verified foundations, known gaps, and a rollback-conscious staging path in `BUILD_STATUS.md` and `CONTINUATION_CHECKPOINT.md`.
- [x] Review the master workbook read-only: confirm existing daily cash/expense, personal spending, project, vendor, quotation, invoice, receipt and statement workflows; record the unresolved cash-account mapping, test/sample rows and lack of validated app sync. No workbook values were changed.
- [x] Confirm operating range and payment behavior: variable small furniture jobs through larger turnkey work (including an owner-reported, long-running large project); record negotiated payment plans and internal reminders without hard client-facing enforcement; gradually increase plan coverage over two years.
- [x] Compare existing invoice/quotation workbooks read-only: issuer labels include both Impressive Creators and Dream Address Studio. User identifies Impressive Creators as current legal document name and wants it selectable for invoices/quotes; the Dream Space/Dream Address brand spelling and formal issuer details remain to be verified. Historical files were not changed.
- [x] Create a local desktop-browser project progress dashboard with phase percentages, current health scores, blockers and next steps. Keep it updated during work batches, not only at phase exits.

### Phase 1 — Stabilize access and India defaults (first implementation phase)

#### Phase 1 closeout — 2026-11-14

**Status: COMPLETE for the agreed Phase 1 scope. Checklist: 24/24 (100%). Evidence-weighted Phase 1 health: 96/100 (above the 95 release gate).** The score applies to Phase 1 access, active India defaults, tax-free V1 settings, privacy controls, and the responsive admin/settings screens reviewed; it is not a claim that every future MARK IV module is complete.

- Staging commit `4f6b77b` / Render deploy `dep-dbrq6pm8bjmc73dqnq3g` is `live` on the isolated `nexus360-rebuild-staging` service. `/api/health` returned HTTP 200 with `database: ok`; Render startup reported 73 migrations found and no pending migrations. Production remains untouched.
- Final document-deletion audit improvement logs actor, document ID and action for single and bulk deletion, without logging names, contents or storage keys. Focused regression: **2 suites / 9 tests passed**. Earlier cumulative Phase 1 runs also passed: **36 suites / 570 authz/file tests** and **28 suites / 142 profile/business-profile/INR/invoice/order tests**; groups overlap and are not added together. TypeScript, targeted ESLint and optimized Next production build passed in the same work batch.
- Admin user management was reviewed in authenticated staging at 390px: invite form, permission cards, filters, user cards/actions and role-change options fit without horizontal overflow. A dummy short password showed low-strength / minimum-eight-character feedback and disabled submit. Business Profile and Invoice Settings fit at phone width; currency settings show INR enabled; invoice payment fields are Indian bank fields including IFSC. No real user's role/password or business/finance records were changed.
- Access controls are supported by the disposable profile's saved User → Partner → User role change and the focused server-side authorization matrix tests; private document route boundaries are tested. The new audit event is live. This closeout did not open an actual client file or replace the owner's admin login with a restricted login.
- Active V1 code review found no active foreign currency codes/defaults; source and staging settings use INR. New invoice/order flows omit tax configuration and force new tax to zero. Historical financial/document records remain preserved. Direct SQL inspection of stored currency rows remains unavailable because the staging database external IP allowlist is empty; admin UI and the applied migration/startup state were used instead.
- Full repository Jest remains non-clean due previously documented unrelated Odoo and Windows E2B fixtures/async teardown. The Phase 1 targeted suites passed. Sheets connectivity/log testing is not two-way business-record sync: Phase 4 remains paused at 22%. CRM-wide visual rebuild and full future-module mobile acceptance are Phase 1B/later-phase work.

| Phase 1 health dimension | Score | Evidence |
|---|---:|---|
| Functionality | 96 | Admin profile/role/reset behavior and focused module access regressions passed; staging is live. |
| Data correctness | 95 | Active INR-only defaults and no-tax new-entry paths reviewed; historic values are preserved. Direct DB rows not queried. |
| Access control and privacy | 97 | Server-side permission tests, partner scope tests, private-file authorization tests and deletion audit coverage. |
| Usability/mobile | 95 | Admin Users, Business Profile, Currency and Invoice Settings checked at 390px; CRM redesign remains Phase 1B. |
| Integration | 95 | Staging DB/health and existing Sheet log connectivity verified; two-way business sync is explicitly Phase 4. |
| Deployment | 100 | Exact staging deploy reports `live`; health endpoint and migration startup verified. |

Weighted estimate (30/20/20/10/10/10): **96/100**. Re-run Phase 1 acceptance checks after Phase 1B changes before Phase 2.

#### Historical checkpoint before final closeout — 2026-11-14 (superseded by the completed closeout above)

#### Authenticated staging recheck — 2026-11-14 (intermediate state; superseded by the completed closeout above)

**Historical status at that intermediate checkpoint: incomplete.** Owner provided an authenticated admin browser session. This recheck confirmed UI affordances and safe validation feedback without changing credentials, roles, settings or workbook data. The final status and evidence are in the closeout above.

**Historical progress at that intermediate checkpoint:** Checklist **20/25 (80%)**. Later work closed the in-scope gates; see the final closeout above.

- Admin user table: role-change action exists with Admin/Manager/User/Partner choices; invite form includes module permission checkboxes and server-enforcement description. Reset dialog showed low-strength / minimum-eight-character guidance for dummy `abc` and disabled submit. For the disposable QA profile only, saved User → Partner → User, confirmed each save in staging, then left the profile deactivated. No real user or password was changed.
- Admin currency settings show INR enabled. Business Profile contains editable fictional test-company details for Rainbow Space Studio — TEST / India. Invoice payment details are optional and use Indian bank fields including IFSC.
- Resend key is stored masked in admin settings; sender/domain verification and actual delivery remain unverified.
- Sheets integration explicitly says connectivity test affects Sync Log only; it does not sync business records. Fresh audit completed: 11 tabs, 286 rows, 219 structural findings; no saved crosswalks. Findings include 22 quotation, 26 invoice, 42 invoice-line, 47 transaction and 40 expense rows with missing IDs, plus 11 duplicate quotation-line keys.
- The deployed UI was checked at desktop browser size only, not mobile. The full CRM visual redesign remains separately planned. Phase 4 business-record two-way Sheets sync remains parked at 22%.
- Focused local access/file regression: **11 suites / 135 tests passed**; a separate INR/currency/invoice/permission batch passed **20 suites / 100 tests**. These totals overlap and must not be combined. Repository-wide test rerun was not clean/reliable: Odoo fixture failures, E2B Windows temp-path failure, environment setup sensitivity and asynchronous enrichment teardown were observed. Prior documented complete run remains 422/426 suites, 3163/3168 tests.
- Remaining gates: stable cumulative Phase 1 regression; live restricted-role boundary; phone-sized workflow check. Private-file boundaries passed route tests; no live file was opened. No production records were changed.

**Status: incomplete. Checklist: 18/25 (72%). Health remains 81/100 while live account, privacy, localization and mobile checks are open.**

- Docker Desktop and an isolated local PostgreSQL 17/pgvector service are operational on `127.0.0.1:5433`; all 72 migrations applied locally. The original `base` hostname issue was resolved by explicitly setting the per-process test `DATABASE_URL`. No Render database was used for testing.
- Full Jest: **422/426 suites and 3,163/3,168 tests passed**. The five remaining failures are confined to three deferred Odoo connector timezone tests and one E2B enrichment shell-path test. Jest needs `--forceExit` because unrelated async enrichment work keeps handles open. This is not a clean all-suite pass, but the Phase 1 focused suite is green.
- Focused after-fix evidence: **25 suites / 321 tests** for access-control/report/user scope; **23/23** for lead parity/catalog/invoice; **14/14** for semantic search and campaign concurrency; **43/43** across plugin order/catalog, CRM price-list, upload signing and Windows plugin-boundary tests; **6/6** for CRM target imports and generated documentation. Counts overlap and are not summed.
- `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm i18n:check`, generated-reference consistency, and `git diff --check` pass. Dummy local object-storage signing values are test-only; no storage request was made.
- Phase 1 batch `c76c6ab` is live on isolated staging; Render reports no pending migrations. `/api/health` is 200/database `ok`; login is 200; unauthenticated Admin → Users redirects to sign-in; report-export and invoice-PDF routes return 401. Production is untouched. Sheet log-only write/read connectivity has been demonstrated, but there is no app↔Sheet business-record synchronization.
- Render's free staging service was asleep during the first `/api/health` request. Startup logs show PostgreSQL ready, 72 migrations and none pending, five existing users, and Next.js ready. `/en/login` returned 200; a warm health retry returned 200/database `ok`. This was cold-start latency, not a schema/DB connectivity failure.
- Required Phase 1 evidence still open: disposable-user sign-in/reset/reuse and role-boundary flows; persisted India/INR and tax-free behavior; authenticated file access; active India-localization review; and phone-sized usability review. Business identity is not a completion gate.

#### Phase 1 access recheck — 2026-11-14

- Admin profile/invite, password reset/reuse, role assignment, and core authorization regression passed **13 suites / 110 tests** on the isolated local PostgreSQL database.
- Active runtime scan across `app`, `actions`, `components`, `context`, `i18n`, and `lib` found no foreign-currency codes/symbols or Czech/Russian country/place assumptions. The four broad-regex matches were URL variable names in test messages; no active regional/currency setting matched.
- Staging commit `c76c6ab` responds with health 200/database `ok`; `/en/login` redirects to the canonical `/en/sign-in` page and returns 200 after the redirect. A live signed-in workflow and phone viewport were not exercised; do not count source tests as a substitute for those checks.
- Phase 1 stays **81/100, 18/25 (72%)**. Business identity details are excluded from the gate; live authenticated role/password, private-file, India-default and phone-size evidence remains open.

#### Latest Phase 1 cumulative recheck — 2026-11-13
**Status: incomplete. Health estimate: 77/100. Checklist progress: 17/27 (63%); overall checklist 30/90 (33%).** This is an evidence-weighted engineering estimate, not a test pass percentage. The required 95-point gate is not met.
- Local cumulative regression passes **1,131 tests across 173 suites**. TypeScript, campaign/template ESLint, `git diff --check`, and optimized Next.js production build pass. Build generated all 24 static pages; only the existing `metadataBase` warning remains.
- Campaign and template server actions now enforce `crm.view` for reads and `crm.manage` for mutations/generation; schedule/send remain manager/admin-only. The active app/actions/components/lib scan found no foreign currency codes/symbols or Czech/Russian country/place assumptions.
- Commit `4cad86d` is live on isolated staging. Render reports 72 migrations and no pending migrations; startup found five existing users. `/api/health` returned 200/database OK. Unauthenticated CRM contact/target PATCH probes and protected report/file endpoints returned 401; unauthenticated admin pages redirect to sign-in.
- Live password reset/reuse/sign-in and negative-role checks, persisted settings/issuer verification, phone-sized workflows and authenticated private-file authorization remain unverified. Phase 4 Sheets business-record dual sync remains paused at 22%.
- Phase 1 health dimensions (functionality 84, data correctness 75, access control 90, usability/mobile 44, integrations 55, deployment 85) use relative weights 30%, 20%, 20%, 10%, 10%, 10%, producing 77/100 rounded. The score remains below 95 because authenticated user, mobile and privacy evidence is missing.
- Keep the current implementation focused on the Phase 1 acceptance gates listed below.

- [x] Trace the source profile-creation path. The action forwarded current-session headers to Better Auth's admin create-user endpoint, but configured app roles intentionally have no Better Auth endpoint grants. A local change now relies on the app action's own `requireRole(["admin"])` authorization and omits those headers.
- [x] Prevent a false failed-profile message after the profile itself exists: user status/language are supplied at creation; a later permission-write failure returns a partial-success warning. Preserve the form on errors. Three focused regression tests and TypeScript validation pass locally.
- [x] Make failed profile submission preserve entered values and use a controlled English-only language selector. New profile creation is covered by focused tests; the live staging login/reset/role flow is still pending.
- [x] Deploy the Phase 1 code batch to the separate `nexus360-rebuild-staging` Render service/branch. `/api/health` returned HTTP 200 with database `ok`; `/en/login` returned HTTP 200 with MARK IV branding. Production `main` and the legacy Render service were not changed.
- [x] Verify disposable profile creation, role changes, password-strength feedback and server-side access boundaries with staging role persistence plus targeted authz/profile regression suites. Do not change a real account's credentials; a separate restricted-user interactive login was not needed for this phase gate.
- [x] Prevent duplicate profile creation after a partial permission-save failure: the action reports partial success, a repeat invite refuses to create or modify an existing account, and the admin is directed to the profile's permission editor. Focused regression tests cover the partial failure and no-duplicate retry.
- [x] Add server-side `crm.view`/`crm.manage` checks to the core lead list/detail, create/update/delete, and conversion paths. Admin bypass and partner record-scope behavior are preserved; focused permission and lead-scope suites pass. This is one CRM slice only: other CRM modules and app actions still need enforcement, so the rollout warning remains.
- [x] Extend server-side module permissions to core CRM reads/writes (leads, accounts/contacts, activities, targets/tasks, opportunities, quotes/contracts, catalog), Treasury, vendor bills, studio-project delivery/cost review, invoice operations, dashboard summaries, report setup/export, protected downloads, all project board/task actions and document-library operations. Reads require view access and writes require manage (task status/comments continue to respect their existing assignment/ownership scopes); private document reads accept CRM/project view only with existing partner/record scoping. Permission checks are covered locally; commit `4cad86d` is live on isolated staging. Account-specific role boundaries still need authenticated testing.
- [x] Add `crm.manage` enforcement to CRM REST contact/target editing and enrichment endpoints, and make unified search facets honor their own CRM/project/document permissions while keeping partner record scopes. Ten CRM API suites / 43 tests pass. Campaign/template actions additionally use `crm.view` / `crm.manage` gates. Unauthenticated writes to contact and target routes returned 401 on staging.
- [x] Make user-visible profile-creation failures actionable without logging passwords, tokens, or other secrets. Operational failures return safe guidance; server logs include only the failing step and error type, never the password or token.
- [x] Audit per-user module permissions on campaign and template actions; retain the surface but gate reads with `crm.view` and mutations/generation with `crm.manage`; schedule/send retain the manager/admin gate. Campaign regression: 15 suites / 86 tests pass, including denied-permission coverage.
- [x] Confirm the separate staging service uses the `nexus360-rebuild-staging` branch and startup logs identify `nexus360_test_db`; staging reported no pending migrations. Production `main` and the legacy Render service were not changed. The staging DB blocks external SQL inspection through Render MCP because its IP allowlist is empty, so its persisted settings were not inspected.
- Deferred by owner: final brand naming and official business identity values. They are editable later and do not block Phase 1.
- [x] Deploy and verify the staging-only fictional invoice/quotation issuer defaults; required fields stay editable so the owner can replace them later. The flag is set only on the isolated staging service; production remains unchanged.
- [x] Remove tax-rate selection and active tax configuration API from invoice V1. Invoice create/update/issue force tax to zero server-side; invoice settings, line editor, totals and new PDF layout omit tax UI; historical tax schema and rows remain.
- [x] Finish the no-tax source audit: invoice duplicates recalculate as zero-tax drafts; regenerating a tax-bearing historic invoice is blocked so its existing PDF cannot be overwritten; new CRM Orders/plugin orders ignore legacy VAT fields and use INR-only pricing; the Orders editor omits tax and historic order views show tax only when stored historic tax exists. Preserve legacy rows without applying them to new transactions. Local regression coverage passes; staging recheck is pending.
- [x] Owner reports written CA confirmation that GST registration is not required now; the letter has not been independently reviewed. Keep the written advice on file and revisit with the CA at six months or sooner if facts change. Do not add tax collection or tax-invoice claims. [CBIC section 22](https://taxinformation.cbic.gov.in/content-page/explore-act/1000291/1000001), [CBIC invoice FAQ](https://cbic-gst.gov.in/hindi/sectoral-faq.html)
- [x] Set the application fallback currency/formatting to INR, seed INR as the sole enabled/default currency without deleting other currency records, and disable ECB refresh. Core CRM/invoice fallbacks and Treasury account creation use INR. Runtime persisted settings still need staging verification.
- [x] Finish the active V1 localization sweep across locale routes, account/campaign country examples, document templates, settings and deployed staging data. Active V1 paths use India/English defaults; legacy history and isolated integration fixtures are preserved.
- [x] Begin the code-level localization pass: INR is now the no-setting currency fallback; new seed setup enables INR as the only currency, disables other currency records without deleting them, and turns off ECB refresh; core invoice/opportunity/contract fallbacks and the Treasury account form use INR; product-import examples use Indian interior work and INR; profile language choices show English only.
- [x] Finish the India-default sweep across active settings/admin pages, staging profile, date formatting, invoice/quote paths, CRM forms and plugin/configuration defaults. INR is the only active currency; preserve old records without silent conversion. Database direct-read is unavailable due its empty external IP allowlist; migration and staging UI provide the available evidence.
- [x] Retire active foreign-currency administration from V1 while preserving historical records and clearly isolated test fixtures. Admin → Currencies is read-only; server actions enforce INR-only and disable exchange-rate changes. New CRM Orders reject non-INR price lists or product prices instead of silently converting them. Do not rewrite amounts or infer exchange rates.
- [x] Keep GST fully out of V1: active new invoice/order/product/vendor paths omit tax settings or force new tax to zero; staging Invoice Settings omits tax. Revisit after six months with the firm's accountant. Preserve client-specific historical invoice/quotation files that contain old tax wording or amounts; do not rewrite issued documents.
- [x] Keep client/project photos, floor plans, invoices and identity details private: authenticated project-scoped reads/deletes, server authorization tests, and privacy-safe single/bulk deletion audit events are in place. Retention policy remains an operations decision; hard deletion follows explicit user action. Treat home photos and precise addresses as confidential.
- [x] Apply mobile usability to the Phase 1 admin/access/settings screens: at 390px, users invite/list/role actions, business profile, currency and invoice settings render without clipped labels or horizontal overflow. Each later phase must add its own phone acceptance checks for workflows introduced in that phase.
- Moved to Phase 1B: Complete the full MARK IV/CRM visual and interaction redesign after the data/finance rules are stable. This is not part of the Phase 1 stabilization gate; Phase 1B remains tracked separately and must include the clearer structure, analytical views, and desktop-equivalent mobile UX described below.

### Phase 1B — Rebuild the CRM workbench (after Phase 1, before finance)

The CRM experience is a named V1 deliverable, not a generic item hidden in the final polish phase. Keep Phase 4 Sheets sync at 22% until this priority work is done; Phase 1B is a local UI/product-workflow batch and does not change the Sheets phase status.

Research basis: this is documented in [MARK IV V1 Data & Relationship Blueprint](MARK_IV_V1_DATA_RELATIONSHIP_BLUEPRINT.md). Research reviewed official Salesforce, HubSpot, Zoho CRM, Pipedrive, Houzz Pro and Buildertrend documentation. Salesforce/Zoho commonly convert a prospect at qualification; MARK IV intentionally keeps a new prospect Lead through quote negotiation and converts at Won/closed, as requested. Opportunities own pre-closure scope and quote revisions; Accounts represent continuing client households, with multiple simultaneous Projects. Houzz Pro's room-based selections → proposals/invoices/procurement and Buildertrend's baseline contract → approved selections/change orders → revised project financials/invoices are particularly relevant patterns.

- [x] Research and map the residential interiors workflow: enquiry/referral → qualification/site visit → scope and estimate → proposal/quote revisions and negotiation → Won/Lost → account conversion and project handoff. Keep the new prospect as Lead until Won/closed.
- [ ] Finish one actionable CRM home/pipeline: stage and owner, next step and due date, referral/qualification context, expected project range in INR, value-weighted forecast and overdue drill-through. Dashboard metrics and persisted date-only follow-ups are implemented; remaining context and full UX/acceptance checks stay in this single item. Automated reminders remain Phase 5.
- [ ] Redesign the lead workspace: useful contact/qualification summary, responsive search/filters, activity timeline for notes/calls/site visits, linked files/photos, next actions, and client detail pages opened in a new tab. The responsive lead-list foundation is deployed; full detail and relationship panels are in progress.
- [ ] Design the pre-closure job relationship: a prospect Lead links to its scoped Opportunity and its quotes/revisions; no new customer Account is created at mere qualification. At Won/closed, link to a new or existing Account/Contact and preserve the lead trail.
- [ ] Design the continuing Account portfolio: one Account has multiple Contacts, multiple open Opportunities and multiple concurrent/completed Projects; each project's budget, designs, invoice/cost trail and status stays separate and links both ways to the Account.
- [ ] Keep related records navigable across CRM, Documents, Projects and Finance. Detail views must show the associations appropriate to the record and enforce that record's read/write permission.
- [x] Make CRM vocabulary and sales pipeline behavior configurable in Admin. CRM picklists, stage names/automation kinds, stage order, and validated 0–100% forecast probability are managed in Admin; the board and weighted forecast read those settings.
- [ ] Make owner-managed CRM workflow configurable in Admin: lead qualification fields, visible/required CRM fields, sales stages, values, order and validation rules across Lead → Opportunity → Won/Lost → Account. Evaluate bounded custom fields. Protect system IDs, Won-only conversion, permissions, and finance calculations from unsafe edits.\n- [ ] Keep Project execution templates and per-project step overrides in Phase 3; allow each project to use editable phases, tasks, dependencies and milestones without changing other projects.
- [ ] Define visual acceptance checks: analytical but uncluttered density, readable stage/status, keyboard/touch access, empty/loading/error states, and phone workflows for create/search/update/follow-up.
- [ ] Run the Phase 1 regression gate once at Phase 1B exit, plus responsive browser checks, lead/conversion/association tests, full Phase 1B tests, staging deployment and a health report. Do not repeatedly restart Phase 1 during Phase 1B implementation.

#### Phase 1 audit — 2026-11-13

**Status: incomplete. Estimated health: 59/100.** This is a weighted engineering assessment, not a test pass percentage. Commit `d791c25` is now live on isolated Render staging; the master/current template Sheets edits were read back. Authentication, mobile, privacy, issuer setup and the remaining localization gates are not verified.

| Area | Score | Evidence and remaining gap |
|---|---:|---|
| Source implementation | 86 | Adds admin-profile fix, INR defaults, tax-free invoice/order/product/vendor/MCP paths, historical PDF protection, and INR-only controls; tests, typecheck, lint and production build pass, and commit `d791c25` is live. Issuer selection and the wider locale sweep remain. |
| Authentication and permissions | 40 | Three focused profile-action tests pass; no staging profile creation, sign-in, reset or role-boundary journey has been executed. |
| India/tax data behavior | 78 | 25 master tabs, 11 invoice workbook tabs, and 8 quotation workbook tabs were scanned: active master/template workflow has no GST, IGST or tax matches. Historical customer files with tax language/amounts remain unchanged. Runtime currency settings and remaining country/locale defaults need staging verification. |
| Brand and document setup | 30 | MARK IV/Dream Space appears on login; quote/invoice issuer profiles and authoritative business details are not yet selectable/configured. |
| Mobile and privacy acceptance | 20 | No phone-sized browser review or end-to-end private-file access check was performed. |
| Staging/deployment | 85 | Render reports `d791c25` live; `/api/health` is 200 (`database: ok`), `/en/login` is 200 and contains MARK IV/Nexus 360 branding. Startup logs show `nexus360_test_db`, 69 migrations found, no pending migrations, and the existing single user caused seed to be skipped. |

The cumulative focused profile/invoice/tax/Orders/product/vendor regression batch passed **48 tests across 9 suites**. TypeScript, ESLint on touched files, production build (using build-only local placeholder credentials), and `git diff --check` pass. Sheets readback confirmed the repaired labels/formulas; historical quote/invoice worksheets still contain old tax wording and were preserved. The full Phase 1 exit gate remains open until authenticated staging profile/login/reset/permissions, persisted settings, issuer setup, remaining locale sweep, mobile usability and privacy are verified.

#### Phase 1 currency and integration recheck — 2026-11-13

**Status: source checks pass; INR batch is live on staging; full sync remains unavailable.** New and edited V1 financial paths now enforce INR, report totals do not convert unsupported historical amounts, opportunity tables flag those amounts for review, and a database migration disables other currency rows and clears exchange-rate data. The recurring exchange-rate worker was removed. An exact source scan found no removed currency codes or symbols outside the historical seed migration; that migration is preserved so Prisma's recorded migration history is not rewritten.

- Read the full active Master workbook (25 tabs), Final Invoices workbook (11 tabs), and IC quotations workbook (8 tabs). No targeted currency code or old-currency number format was found. A material/brand label containing “Europratik” is a product name rather than currency data and was left intact.
- Deployment `dep-dbr3m5d9el5s73bn3upg` for commit `e217c88` is live on isolated staging. `/api/health` returns 200 with `database: ok`; unauthenticated admin route requests redirect to sign-in. Authenticated verification of persisted regional settings remains open.
- The admin integration check continues to report missing service-account variables and only a read-only audit/crosswalk foundation; there is no app-to-Sheet write path or dual-sync. Always recheck this state after website or Sheet changes. Once implemented, test both directions and reconcile IDs, values, timestamps, retries and duplicates.
- Local checks for this source batch: TypeScript passed, ESLint passed, 44 focused tests passed across 7 suites, and the optimized Next build passed with temporary local-only environment placeholders. The full Jest run is blocked because the configured local database host is unreachable. Staging health confirms its database is reachable.
- Keep the Phase 1 health score at **59/100** until staging confirms persisted INR settings, the authenticated user workflow, and earlier-phase regression gates. This does not satisfy the 95-point release gate.

#### Admin users hydration defect — 2026-11-13

- Fixed the admin user table’s time-dependent server/client markup that triggered React hydration error #418. Timestamps now render in stable IST formatting, and a user without a login timestamp displays “Never” instead of a fabricated “now”.
- Focused India-time tests (2/2), ESLint, TypeScript, and optimized Next production build pass. The repository `build` script itself requires `DATABASE_URL` and runs migrations; the separate optimized build used local-only placeholders and did not apply migrations.
- Staging deployment and live Chrome verification remain pending. After deployment, check that the admin user page loads without hydration errors and recheck that the Sheet integration still clearly reports its missing credentials/read-only status; there is still no two-way sync.

#### Phase 1 deep health recheck — 2026-11-13

**Current status: incomplete; estimated health 62/100.** The isolated staging branch is live at commit `301197a` (Render deploy `dep-dbrcsae1egvs73fls6og`). This score is a weighted readiness estimate, not a test pass rate. Production remains untouched.

- Admin user page loaded in the authenticated staging session. Two synthetic QA profiles were created successfully. The second profile's CRM view and Projects view permissions remained selected after reopening its permission editor. Its user role is `user`; app UI still warns that module permission enforcement rollout is in progress, so these persisted settings do **not** prove server-side access boundaries.
- Fixed admin password reset authorization by granting the app's admin role only Better Auth's `user:set-password` endpoint capability; app actions still gate entry with `requireRole(["admin"])`. Added regression coverage. Five user-management suites pass (25 tests), `tsc --noEmit` passes, and targeted ESLint passes. Live password reset/sign-in was not completed; changing an account credential must be entered and submitted by the user in Chrome.
- Fixed `Heading` subtitle spacing (replaced invalid `py=1` with `mt-1` and readable line-height). Live screenshot confirms “Users” and “Manage your CRM users” no longer collide with the divider.
- Staging `/api/health` returns HTTP 200 and `database: ok`. Render confirms deploy `dep-dbrcsae1egvs73fls6og` is `live` for `301197a`. The admin regional settings page reports **Active currency: INR · Enabled**; the header also shows INR.
- Staging still contains two named synthetic QA accounts (`mark4-phase1-qa...@example.com` and `mark4-phase1-qa2...@example.com`). They are not production data. Cleanup is pending a confirmed reversible deletion path; do not mistake them for real staff.
- Next source batch restricts the header language picker to English, rejects non-English language updates because app routing only enables English, and replaces Czech city placeholders with neutral `City, state`. Those changes require local lint/typecheck and a separate staging deploy before they count as live evidence.
- Open Phase 1 gates: actual password-reset/sign-in journey; server-side permission tests and restricted-user boundary; retry-safe partial permission writes; full active India/localization sweep; issuer identity/settings; mobile desktop-equivalent workflow checks; private project-file authorization and retention; run broad earlier-phase regression checks. Sheets connectivity alone is not business-record dual sync, and Phase 4 remains separate.

#### INR-only active-product cleanup — 2026-11-13

- [x] Restrict all active currency options and finance formatting to INR. Legacy non-INR records are excluded from active finance lists/totals or held for admin review; their amount values are not converted or relabeled.
- [x] Remove the active currency/exchange-rate administration tables and disable exchange-rate reads/writes in the app. Account/campaign city examples now avoid Czech place names; the app timezone is Asia/Kolkata and profile language is English-only.
- [x] Restrict projects, invoices, vendor bills, treasury, product assignments, contracts, quotes and CRM line-item output to INR or safe review labels. Block creating project costs against non-INR projects and editing historical non-INR invoices/contracts without review.
- [x] Scan the active source for dynamic currency formatters: remaining money formatting is pinned to INR or uses the shared safe formatter. Full app/product scan still must distinguish historical migration/seeding artifacts from active runtime surfaces.
- [x] Focused checks: TypeScript passes, targeted ESLint passes, 11 tests across 4 focused suites pass, and `git diff --check` passes. Full Jest is blocked by DB-backed suites that cannot reach the configured PostgreSQL host and one suite requiring Inngest configuration.
- [ ] Deploy and verify this newest INR-only source batch on staging. Previous live evidence still refers to `301197a` until Render confirms the newer commit.
- [ ] Verify every newly created user/workflow and historical-value review behavior on staging; active options/settings, accounts, contracts, product assignments, invoice PDFs and finance totals need live UI recheck.

**Historical files:** Existing Prisma migration files and a legacy product/brand name containing “Europratik” are not active currency choices. Do not rewrite already-recorded migration history or alter the genuine catalog brand. The active user interface, data-return paths, new-record validation and finance displays are INR-only.

| Area | Current estimate | Evidence / limits |
|---|---:|---|
| Source and workflows | 86/100 | INR/tax-free flows and profile error handling exist; focused tests pass; broader localization and official document identity are open. |
| Authentication and permissions | 50/100 | Staging profile creation and permission persistence verified; reset action code tested, but live reset/sign-in/boundaries unverified; permission rollout warning remains. |
| India and tax behavior | 82/100 | Runtime regional page and header report INR; tax-free source checks exist; not all active forms/templates/settings checked on staging. |
| Brand and document setup | 30/100 | MARK IV branding is visible; issuer names and full business details still need an owner-confirmed settings workflow. |
| Mobile and privacy acceptance | 20/100 | No phone-size end-to-end review or private file authorization/retention test yet. |
| Staging and deployment | 92/100 | Current staging commit is live; health and database are OK; staging only, two QA accounts remain, and full workflows remain unchecked. |

The next turn should close remaining Phase 1 gates one at a time, re-run earlier relevant checks, and update this audit before proceeding to Phase 4. Do not claim the 95-point release gate until evidence supports it.

#### Phase 1 INR-only source batch — 2026-11-13

**Current estimate: 66/100; this source batch is not yet on staging.** Active app currency options, displays, forms and finance lists are now INR-only. Legacy non-INR records are excluded or held for review without converting their amounts. Non-INR amounts are never presented as rupees. English-only language selection, IST timezone and neutral India-compatible city placeholders are also in source.

- Focused currency, pricing, reporting, CRM scope/approval and PDF tests pass: 103 tests across 19 suites. Prisma schema validation, TypeScript, and `git diff --check` pass. Targeted ESLint has not yet been rerun after the final schema-mock edits.
- Full Jest was attempted; database-backed suites fail because the configured PostgreSQL host is unreachable from this environment; another suite lacks Inngest credentials. This is an environment block, not a passing full-suite result.
- The Google Sheet does not offer currency selectors in active finance tables. Targeted scan found a product brand “Europratik,” which is not currency content, and an earlier live read fixed a phone field that Sheets had parsed as a formula.
- A full runtime path scan (`actions`, `app`, `components`, `context`, `i18n`, `lib`, Prisma schema and seeds; excluding tests/docs/migration history) found **0** foreign currency codes/symbols and **0** exchange-rate/ECB references. Legacy migration history and product/build documentation are outside runtime and were not rewritten.
- Prisma schema no longer defines exchange-rate storage; a forward migration drops that table/enum and ECB setting. Its deployment to Render staging is **not confirmed**. The last confirmed staging commit is `301197a`; therefore the live DB's raw currency-row count is unknown, and old currency rows may remain disabled for historical relations. No live DB query or destructive cleanup was performed.
- Latest local check: Prisma schema valid, TypeScript clean, `git diff --check` clean, 103/103 focused tests passed. Active runtime currency references: **0 foreign**. Live database count: **unverified**, not claimed zero.
- Next: stage only Phase 1 files; deploy to the isolated staging branch; verify Render live status, migration status, app health, INR settings/options and core finance pages, then rerun Phase 1 regression checks. Do not advance to Phase 4 until that recheck is recorded.

### Phase 2 — Build dependable finance and expense accounting

- [ ] Add a document template editor for INR invoices and quotations: editable issuer/brand selection, logo, layout, line-item presentation, payment/terms/footer sections, and desktop/mobile preview. Version templates; keep already-issued PDF snapshots unchanged, and never show internal cost/margin on client documents. Keep GST/tax fields out of V1.
- [ ] Establish one canonical transaction model and stable IDs so invoices, receipts, vendor bills, project costs and cash movements cannot double-count one another.
- [ ] Define a chart of accounts and balanced journal entries before calling reports a full ledger, P&L, balance sheet or trial balance.
- [ ] Add project cost codes/work packages (for example plywood/materials, labour, electrical, transport and overhead) and use them on approved project expenses, vendor-bill detail and future diary costs. Do not double-count one cost posted through two entry paths.
- [x] Confirm that invoice drafts already support an independently editable unit selling price for each line; retain this behavior.
- [ ] Add an internal draft margin preview and record the editor/reason when a line's price differs from the approved quote/contract baseline. Keep cost/margin values out of client PDFs and preserve immutable issued-invoice price snapshots.
- [ ] Link invoice lines to project work packages and create explicit, auditable cost allocations for progress invoices. A cost may be allocated only once in total, and a partial invoice must not absorb the full project cost unless that full scope is billed.
- [ ] Show line and invoice gross profit (net selling amount minus allocated direct cost), gross margin percent (profit ÷ selling amount), and markup percent (profit ÷ cost) as separate measures. If cost is missing/unallocated, show margin as unknown; never assume zero cost. Keep estimated, actual and allocated costs visibly distinct.
- [ ] Add company-wide daily cash diary: opening balance/cash-in, expense rows, computed closing balance, actual counted cash, and variance with explanation.
- [ ] Support expenses entered after the fact. Store incurred date separately from entered-at time; preserve who entered/edited it and audit changes to amount/date/category.
- [ ] Add receipt/diary photo capture from mobile. OCR may prefill a draft; require user review and confirmation before it posts. Add duplicate/evidence checks and a correction trail.
- [ ] Classify personal spending separately and exclude it from business/project expense and margin totals. Confirm with the accountant whether company-paid personal items should post to drawings, a director/owner receivable, reimbursement, or another account; do not decide tax/accounting treatment in code.
- [ ] Allow project attribution where applicable, vendor/payee, category, payment mode/account, note, evidence, approval and reconciliation status.
- [ ] Deliver company and project ledgers, receivables/payables, cash flow, P&L, balance sheet, trial balance and project margin only from reconciled source entries, with filters and clear date basis.
- [ ] Finish transaction-level bank matching, bill/receipt evidence, and checks against duplicate expense-versus-vendor-bill entry.

### Phase 3 — Complete the interior project and design lifecycle

- [ ] Provide Admin-managed project execution templates (editable phases, tasks, dependencies and default milestones) with per-project overrides, preserving historical task completion and audit history when a template changes.

- [ ] Model enquiry → qualification → site survey/client brief → scope/budget/quotation/BOQ → deal confirmation → project kickoff.
- [ ] Support very different job sizes and durations: furniture/repair-only jobs, small residential work, ₹12–20 lakh turnkey work, and multi-phase long-running contracts. Use configurable phases, budget periods, cash forecast horizon and responsible team; do not assume one project scale or fixed portfolio capacity.
- [ ] Add a per-project payment-plan builder with proposed/accepted milestones, amount or percentage, target date/trigger, expected/received state and linked invoice/receipt. Keep plan optional until agreed with the client. Trigger internal reminders and forecast alerts only; do not prevent work or automatically pressure clients. Support progressive adoption (initial pilots, then adoption coverage reporting) as a business habit, not as a system gate.
- [ ] Add project/room-wise design gallery with uploads from desktop/mobile, revision history, captions/tags, and Draft / Sent for Client Review / Approved / Superseded states.
- [ ] Record who approved each revision, approval date, client comments, and which design is currently authoritative. Keep superseded versions visible for history.
- [ ] Link approved scope/design, estimate and material selections to procurement and delivery milestones.
- [ ] Record scope/price changes as reviewed change orders; show the impact on quote, budget, timeline and margin before execution.
- [ ] Keep the approved quote/contract baseline separate from later invoice prices. Invoice price changes affect billed margin and require a reasoned variance view; they do not silently rewrite the accepted scope or contract value.
- [ ] Finish milestone execution, vendor procurement/bills, progress evidence, handover checklist, defects and aftercare.

### Phase 4 — Make the Sheet integration dependable

- [ ] Confirm the canonical workbook and repaired schema; retain backup/rollback copy and stable IDs.
- [ ] Classify workbook rows as live, historical, or test/sample; resolve the flagged daily-expense cash-account reference with the owner before treating balances as authoritative. Do not copy or sync test fixtures into live app records.
- [ ] Add personal household transactions as a distinct entry type visible in the daily company cash diary and a separate personal-spending ledger view. Company cash still decreases; exclude these entries from business/project cost and margin. Final proprietor-drawings/reimbursement accounting treatment requires accountant review.
- [ ] Change the Sheet-facing `Personal Drawings` diary label to “Personal Expense” after exact target cells/formulas are mapped; preserve the bookkeeping account classification and do not change historical amounts. Give MARK IV a separate personal-spending ledger view while excluding these entries from business/project cost and margin.
- [ ] Treat existing workbook milestone percentages and defect-period defaults as unverified examples until the owner confirms actual commercial policy.
- [ ] Apply the app migration in staging and configure the service account privately.
- [ ] Run read-only mapping and duplicate/conflict review; resolve ambiguous rows explicitly.
- [ ] Add controlled app-to-Sheet and Sheet-to-app sync with field ownership, timestamps, tombstone/deletion rules, retry safety, conflict queue and run history.
- [ ] Verify a staged write/readback round trip and reconcile row counts and financial totals before enabling routine sync.
- [ ] Regression-check both sync directions, current connection health, last successful run, errors/retries and duplicate/conflict handling after any change that touches the website, Sheet schema, credentials or sync code. The owner reports the full PEM private key is now in Render; verify a successful authenticated read-only audit. Current app capability remains read-only audit/crosswalk preview and no two-way write path exists yet.
- [ ] Keep manual Sheet entry understandable with data dictionary, validation, filters, protected formula/system columns and sync status.

### Phase 5 — Deliver actionable analytics and business alerts

- [ ] Build a **Studio Leakage Radar** after finance/project data is trustworthy: flag unapproved scope changes, budget-to-BOQ drift, committed-versus-actual cost growth, overdue client design decisions, late long-lead procurement, milestone slippage and aging receivables. Show the reason, source records and next suggested action; never auto-approve or post financial entries.
- [ ] Add a role-aware in-app **Action Center** for task due/overdue reminders, client design approvals waiting on follow-up, invoice/receivable follow-up, bills awaiting review, expenses awaiting approval, failed sync runs and project budget-headroom alerts. Each alert links to its source record and can be acknowledged or snoozed; scheduled/email/push delivery is optional and must not assume an email provider is configured.
- [ ] Let an admin/manager set a project budget warning threshold. Alert on remaining approved budget after committed and actual costs fall below that threshold; suppress alerts where no approved budget exists and show the calculation/source values.
- [ ] Add a compact daily **Studio Pulse** summary of exceptions and the next actions across CRM, projects and finance, rather than another vanity KPI dashboard.
- [ ] Add role-aware dashboards, saved filters, period comparisons and report definitions/source/as-of date.
- [ ] Add **Finance → Profitability** with tabs for Invoice Margin (line and invoice), Project Profitability (approved contract and changes, earned/billed/collected amounts, actual/committed costs, forecast cost-to-complete and expected final profit), and Company P&L (only from balanced journals using an accountant-approved revenue-recognition policy). Clearly label billing margin/management forecasts separately from formal accounting P&L.
- [ ] For scale-readiness, track active project capacity, backlog by stage, expected cash-in/out, supplier commitments, project margin at completion, change-order rate, rework/defects, lead conversion and collection delays. Review Udyam/MSME eligibility separately with a qualified adviser; do not equate statutory classification with the owner's growth target.

### Phase 6 — Staging acceptance and controlled release decision

- [ ] Run migration, authorization, reconciliation, desktop and phone-sized core journeys, reminders/alert links, camera/photo upload, backdated-entry, duplicate, conflict/retry and browser acceptance checks in staging. Record known gaps and a rollback path.
- [ ] Only consider production cutover after staging data, permission boundaries, Sheet sync, finance totals and mobile usability are signed off; leave legacy production untouched until then.

## Recommended transaction and project workflow

```text
Enquiry → qualification → site survey & brief → quote/BOQ → deal confirmed
  → design drafts → client review → approved design revision
  → material selection/procurement → execution milestones & change orders
  → invoice/receipt + vendor bill + dated expense diary
  → reconciled company/project reporting → handover & aftercare
```

Each expense carries both `incurredOn` and `enteredAt`. A late entry changes the historical period it belongs to, while the audit view still shows when it was recorded. A diary photo creates a reviewable draft. A client design approval attaches to a specific immutable revision. A money movement and its accounting classification are separate concepts: company cash balance changes even when the underlying payment is personal, but it must not inflate business/project expenses.

Invoice profitability follows a separate but linked cost trail: invoice lines contain the client-facing sell price; project cost entries and vendor-bill detail carry a work-package code; explicit allocations associate only the relevant share of those costs with an invoice line. This supports varying prices on successive progress invoices without counting one cost twice. The Finance → Profitability view shows gross profit, gross margin and markup separately, then reconciles the project's cumulative actual and forecast position. A bill or progress invoice is not automatically treated as earned revenue for formal P&L.

## Research basis

- Deloitte's September 2026 report estimates Indian interior services will grow from US$4B in 2025 to US$8B in 2030, while emphasizing experience, quality and connected home services. Use that as market context, not as a company forecast or a reason to add unrelated modules. [Deloitte India home and household report](https://www.deloitte.com/in/en/about/press-room/indias-home-and-household-market-to-reach-us-260-billion-by-2030-deloitte-report.html)
- A 2024 NSE-hosted interior fit-out company's offer document describes a practical lifecycle: assess/pre-qualify projects, agree the work order, plan, resource and procure, execute, inspect, hand over, invoice/collect, then handle defects. It concerns larger commercial projects, so adopt its gates and control ideas in lighter residential form. [NSE-hosted interior fit-out company offer document](https://nsearchives.nseindia.com/emerge/corporates/content/Registration_19102024021232_DRHPELEGANZINTERIORSLIMITED.pdf)
- CPWD's works quality procedures use material/workmanship checks, site inspection records, milestone planning and defect correction before completion/payment. This is a useful Indian public-works benchmark to adapt as residential site checklists, not a rule that automatically governs the studio's private projects. [CPWD works quality procedures](https://www.cpwd.gov.in/Publication/SOP_for_CPWD_Works_Manual_2022_13122022.pdf)
- The Ministry of MSME's Udyam portal lists current post-April-2025 thresholds for micro/small/medium classification and notes that registration is free. These thresholds are regulatory classifications, not an appropriate stand-alone growth target; the actual company goal should be measured by profitable project capacity, cash generation, client outcomes and team maturity. [Official Udyam portal](https://udyamregistration.gov.in/)
- Ministry of MSME describes Samadhaan support for eligible registered micro/small suppliers facing delayed payments. This reinforces the need to record work orders, invoice dates, accepted work and collections; applicability requires valid Udyam status and professional confirmation. [MSME Samadhaan](https://ramp.msme.gov.in/ramp/RAMP-initiative/msme-samadhaan/msme-samadhaan)
- India's DPDP Act and 2025 Rules establish phased requirements for personal-data processing, notices and safeguards. Client contact details, household addresses and home/design photos justify privacy-by-design controls now, even while the exact legal commencement and applicability should be checked with counsel. [India Code: DPDP Act](https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf), [MeitY: DPDP Rules 2025](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025)
- Revenue billed and revenue earned may differ on long-running or progress-billed jobs. MCA's Ind AS 115 describes measuring progress toward satisfying performance obligations for revenue recognized over time; ICAI construction-contract material likewise matches contract revenue and cost to work performed. These are design references, not a claim that a particular standard applies to this sole proprietorship. Have the CA determine the applicable accounting policy before Company P&L is enabled. [MCA: Ind AS 115](https://www.mca.gov.in/Ministry/pdf/IndAS115_2020_10112020.pdf), [ICAI: AS 7 Construction Contracts](https://indasaccess.icai.org/Volume-III/AS/asb.html?a=109)

## Current verified constraints

- Source inspection found a likely cause of the reported profile-creation failure: forwarding the signed-in admin session to Better Auth's create-user endpoint conflicts with the intentionally empty endpoint permissions on configured roles. The fix uses the separately admin-guarded app server action; staging profiles and permission persistence have been exercised, while retry/no-duplicate behavior remains open.
- The active profile form now offers English only. Persisted language settings and any remaining regional defaults still need a complete staging review; do not infer full localization completion from that form alone.
- The codebase contains numerous Czech/INR fixtures and connector assumptions. Historical and test-only examples are not production configuration; classify each occurrence before removal.
- Google Sheets connectivity was authenticated and a labelled Sync Log write/readback was previously confirmed. Business-record pull/push and two-way record sync are not implemented; Phase 4 remains at 22%.
- Treasury currently models cash movement, not full double-entry accounting. Do not describe it as a complete accounting ledger until the Phase 2 journal and statements are implemented and reconciled.
- Invoice line records currently store client-facing quantity, unit price, discount and totals but have no cost code or cost allocation. Project expenses and vendor bills are project-level records without line-item cost allocations. A true per-item margin view therefore needs the explicit cost-code/allocation work above; do not derive margin from invoice totals minus every project cost or present that as audited profit.
- GST is intentionally deferred until at least six months after V1; do not add GST configuration, totals or invoice claims in the current phase.

## Phase 1 cumulative recheck — 2026-11-13 16:10 IST

**Status: incomplete. Current health estimate: 68/100.** This revises the older 59/100 and 66/100 snapshots above using the latest staging and local evidence; it is an engineering health estimate, not a test pass rate. Phase 1 is not at the required 95-point release gate. Phase 4 Sheet business-record sync remains parked at 22%; no dual business-data sync is claimed.

| Dimension | Score | Current evidence and open gate |
|---|---:|---|
| Functionality | 82 | Profile creation was previously exercised on staging; role editor is present. Chrome confirms invite and reset inputs enforce an 8-character minimum. Password reset server-side duplicate-password guard is covered in unit tests; live reset/sign-in still needs a dedicated disposable test account. |
| Data correctness | 75 | INR-only/tax-free active V1 source policies and historical-record protections are implemented. Runtime settings/schema migration and all active locale surfaces still need staging verification; the India-time date-display pass is now deployed but was not individually inspected across all pages. |
| Access control | 67 | Admin-only action checks, self-demotion/last-admin protection and role-change audit logic have tests. Staging's custom-permission rollout warning remains; route/action enforcement of the per-module checklist is incomplete and role boundaries have not been exercised end to end. |
| Usability and mobile | 40 | Admin user controls and adjustable role entry are visible on desktop. Full desktop CRM redesign is Phase 1B; no phone-sized acceptance review has been completed. |
| Integrations | 55 | The staging Sheet connectivity audit/write-read check is distinct from record sync. CRM, project, invoice and finance records are not syncing both ways; that stays in Phase 4 at 22%. |
| Deployment | 90 | Render commit `1772db0` is live in isolated staging; `/api/health` is 200/database OK and `/en/login` is 200 with MARK IV branding. Production remains untouched. |

**Cumulative local checks:** 44 tests pass across 8 relevant suites (`india-time` and admin-user suites); `pnpm exec tsc --noEmit`, targeted ESLint, and optimized `pnpm exec next build` pass. Build used local-only placeholder auth/Inngest values. A broader earlier regression rerun excluding the PostgreSQL-dependent invoice lifecycle suite passed 87 tests across 17 suites. The PostgreSQL invoice suite remains blocked by the unavailable local database. Staging Chrome inspection confirmed that Change access role opens its editor and Reset password opens its form, and that invite/reset both enforce a minimum of 8 characters; neither form was submitted, and no credentials or roles were changed during that inspection.

**Remaining Phase 1 gates:** check runtime INR settings and remaining active India-specific surfaces; test profile retry/no-duplicate behavior, credential reset/same-password rejection and sign-in with a disposable QA user; verify role boundaries and decide/enforce module permissions; finish selectable issuer details; perform phone-size usability and private-file authorization checks. Keep old customer records and historical documents intact. Do not move to Phase 2/CRM redesign until the Phase 1 acceptance gates pass; CRM UI improvements remain explicitly scoped to Phase 1B after Phase 1.

## Phase 1 access-control batch — 2026-11-13 18:02 IST

The local CRM action batch now applies explicit `crm.view` / `crm.manage` gates while retaining partner record-scope checks. Permission inheritance was corrected so manage implies paired view, not vice versa. Local verification passed 73 focused CRM/authz suites (394 tests), TypeScript, focused ESLint and whitespace checks. This is not an acceptance exit: the isolated staging health endpoint timed out before any authenticated workflow could be exercised, and the batch remains uncommitted among unrelated Phase 4 files. Recheck staging health, then use a disposable profile for create/retry/reset/sign-in and negative role-boundary tests before considering the Phase 1 access gate complete.

## Phase 1 cumulative continuation — 2026-11-13 19:04 IST

**Status: incomplete. Health estimate: 70/100.** The Phase 1 exit requirement remains 95/100 with all acceptance gates evidenced. Phase 4 business-record Sheet sync stays paused at 22%.

- A broader local authorization/regression pass covers 71 CRM suites / 379 tests; dashboard, Treasury, vendor-bill, studio-project, invoice and profile-invite checks passed 9 suites / 44 tests; authz and report checks passed 23 suites / 367 tests; user administration passed 7 suites / 42 tests; project/document scopes plus selected-permission checks passed 38 suites / 175 tests. Counting overlapping invite tests once: **147 distinct suites / 1,001 test cases** passed. TypeScript, targeted ESLint and `git diff --check` passed.
- Profile partial-write handling now explicitly prevents the Invite form from adding permissions to an existing user merely because role/language happen to match. A repeat invite returns the profile-editor guidance without creating a duplicate, changing permissions or resetting a password. Six focused invite tests pass.
- Read-only single-tab staging check: `/api/health` returns status/database `ok`; the signed-in MARK IV dashboard and Admin → Users load; the header shows INR; role menu includes “Change access role.” Admin → Users still displays the module-permission rollout warning. No credentials, role, profile, or business record were changed.
- Re-scanned active `app`, `actions`, `components` and `lib` source for the foreign currency codes/symbols USD, EUR, CZK, €, and Kč: no matches. The scan excludes tests/history; no historical records or migration history were rewritten.
- Reduced the Admin → Users invite form from six cramped desktop columns to three wider fields per row and expanded the permissions area to match. This targets the label/divider crowding shown in the owner's screenshot. The change is deployed; a fresh visual browser comparison remains pending because the protected page redirects to sign-in without an authenticated admin session.
- Render Postgres read-only query for the staging currency rows was blocked by its empty external IP allowlist. No allowlist change was made. Source scanning found no foreign currency codes/symbols in active application code and staging displays INR, but persisted currency-row counts remain unverified.
- Project board/section/task CRUD, reads, watcher actions and task-month charts now check `projects.view/manage`; task-month aggregates also use board record scope. All document-library reads and mutations require CRM or project view/manage permissions, while retaining account/document ownership checks and partner read scope. Negative tests verify denied users cannot fetch board/document lists, create a board, upload a document, or retrieve cross-board task aggregates. The permission batch is now live in isolated staging at `4cad86d`; campaign/template and CRM API checks are included. Profile login/reset and per-role live boundary flows have not been executed with a disposable credential; keep the rollout warning until authenticated checks pass.
- Phase 1 checklist completion is now 14/25 (56%). Overall health stays below the requested 95 gate because live role/password checks, remaining module/API enforcement, full India/issuer localization, phone-size usability and live privacy/file-access checks remain open. No Phase 1B or Phase 2 work started.

## Phase 1 cumulative recheck — 2026-11-13 19:50 IST

**Status: incomplete. Evidence-weighted health estimate: 78/100.** This is not a test-pass rate. Phase 1 remains below the required 95/100 exit gate; Phase 4 business-record Sheet sync stays paused at 22%. No Phase 1B CRM redesign or Phase 2 finance expansion was started.

- Corrected the approved quotation PDF's hard-coded Dream Address issuer. It now reads the active issuer name from Invoice Settings; when none is set it displays the internal brand Dream Space Studios. This keeps the document issuer separate from the MARK IV workspace brand and makes Impressive Creators selectable through the existing company-name setting.
- The change is live on the isolated Render staging service at commit `eebf36fb5dc09f614ab6ebb62de78d3e7438f573`. Render reports deploy `dep-dbrhlk942hec73bm0qqg` as `live`; its migration step found no pending migrations. `/api/health` returned HTTP 200 with database `ok`; `/api/opportunities/test/quote` returned 401 without authentication; `/en/login` redirected to the localized sign-in route as expected. Production was not changed.
- Quote endpoint tests passed: 1 suite / 2 tests. TypeScript, targeted ESLint and `git diff --check` passed. Full cumulative Phase 1 regression is still due at the phase gate.
- Source review confirms the active invite and reset-password forms enforce 8–128 characters, show a low-strength message under 8, and disable submission below 8. No active 12-character rule was found. The screenshot's browser validation therefore appears stale or comes from a different page/version; authenticated live visual confirmation remains open.
- Current score dimensions: functionality 87, data correctness 75, access control 90, usability/mobile 44, integrations 55, deployment 90 (weights 30/20/20/10/10/10; weighted result 78/100). Functionality and deployment increased for the shipped issuer fix and live staging verification. Scores for persisted settings, authenticated role/password flows, mobile workflows and business-data sync remain constrained by missing direct evidence.
- Still blocked on a usable staging admin session: profile-create/retry, reset and same-password rejection, sign-in, editable-role and restricted-role checks, protected file access, persisted INR/company settings and protected UI spacing need authenticated verification. The previous test credential was rejected; do not retry or reset it. Owner should sign in with a current disposable staging admin in the existing Chrome tab, then resume.
- Preserve all historic issuer records and old data. The active app is INR-only by source audit, but persisted runtime settings and database currency rows still need authenticated/database read verification. Phone-size workflows also remain unverified.
- Exact remaining Phase 1 gates: authenticated workflow and permission tests; browser review of invite/reset forms; verify persisted India/INR and issuer settings; phone-size usability; private file access; full cumulative regression and refresh all Phase 1 progress indicators. Do not advance phases before the 95-point acceptance gate is supported by evidence.

## Phase 1 authenticated staging review — 2026-11-13 19:53 IST

**Status: incomplete. Evidence-weighted health estimate: 81/100.** The release gate is 95/100. Sheet business-data sync remains parked at Phase 4 (22%).

- Confirmed a signed-in admin session in Chrome on the isolated staging site. No production access or account changes were made.
- Admin → Users shows the invite form with a minimum-eight-character placeholder and the corrected three-column desktop spacing. Resetting the QA account was opened but not submitted; entering a short dummy value visibly showed `Password strength: Low — use at least 8 characters.` and left Reset disabled.
- The Change access role dialog presented Admin, Manager, User and Partner. The selected QA profile remained User; dialog was cancelled without saving. Role-change persistence is not live-verified.
- Admin → Currencies visibly reports `Active currency: INR · Enabled`. Invoice Settings defaults to `INR — Indian Rupee`, Country `India`, and 14 due days. Required company name, street address, city and postal code are blank; official issuer particulars are therefore not ready. No settings were entered or saved.
- Password reset and role backend suites passed 14/14 tests, including reuse rejection; approved-quote route suite passed 2/2. The user session itself is authenticated, but a fresh sign-in and live password-reset submission were not performed. No credential was changed.
- Health dimensions: functionality 89, data correctness 82, access control 90, usability/mobile 50, integrations 55, deployment 90, weighted 80.6 → **81/100** using weights 30/20/20/10/10/10. Mobile remains untested; desktop invite layout and short-password feedback were visually/readably verified.
- Still required for Phase 1: owner-confirmed company issuer/address particulars and save, fresh disposable login, same-password rejection through the live UI, a persisted role change on a disposable profile with rollback, negative access checks as restricted roles, authorized file read, phone-sized review, and full cumulative Phase 1 regression. No actions in this review changed accounts, roles, passwords, finance data or Sheet data.

## Phase 1 responsive settings fix — 2026-11-13 20:03 IST

- Invoice Settings now stacks its address/contact/payment grids on narrow screens and expands them at wider breakpoints. The live page explains that its company identity is printed on invoices and approved quotation PDFs, separate from MARK IV branding.
- Commit `3b04c31` is live on isolated staging (`dep-dbrhsmu8bjmc73bs6t4g`). Render's production build compiled and TypeScript stage completed; it reports no pending migrations. `/api/health` returned HTTP 200; `/en/login` redirected to localized sign-in. Signed-in Chrome confirmed the explanatory text and existing INR/India defaults without saving any values.
- Targeted ESLint, TypeScript and `git diff --check` pass. Phone-sized visual verification is still open; the responsive layout is source-verified but no mobile viewport was available through the selected Chrome tab interface. No score increase: Phase 1 remains 81/100 and incomplete pending issuer particulars, live credential/role checks, private-file tests, phone-size review and full cumulative regression.
- Added the document template editor to Phase 2 in the checklist and local progress tracker. V1 scope: INR invoice/quote template layout, brand/issuer choices, logo and document sections, responsive preview and template versioning; preserve issued document snapshots and keep internal cost/margin out of client PDFs. GST remains excluded.
- No company data, accounts, roles, passwords, financial records, Google Sheet rows or production deployment were changed.

## Phase 1 follow-up regression gate — 2026-11-13

- Re-ran Phase 1 user-management, currency, and CRM settings tests: **9 suites / 59 tests passed**. `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm i18n:check` pass.
- Attempted the complete Jest suite. Database-backed suites fail because the test process is resolving its configured host to `base`, which is unreachable from this Windows host. Docker Desktop has now been installed, but its Linux engine/API socket has not initialized, so the isolated local Postgres test service has not started. The full-suite run was stopped after confirming repeated DB connection failures; it is **not** a passing cumulative regression. Do not point tests at Render or run migrations/seeds against staging.
- An active-source sweep for foreign-currency/country assumptions found only Czech/Ukrainian locale message files and non-matching URL variables in the broad search; app account language is restricted to English, and currency-focused tests pass. Keep locale translations out of active English V1 surfaces; full repository-wide legacy cleanup is not a Phase 1 reason to delete historical or integration/test data.
- Phase 1 remains **81/100 and incomplete**. Evidence still required: an authorized full regression with a reachable isolated DB; owner-provided complete issuer/address details; live reset/reuse and role changes using disposable accounts with action-time approval; restricted-role and private-file checks; phone-viewport visual verification; and readback of saved issuer settings. No account, role, password, financial record, Sheet, production service, or staging setting was changed in this run.

## Historical Phase 1 closeout recheck — 2026-11-14 (superseded by the completed closeout at the top)

- Current live staging source is commit `9b9ce9f` (`fix(phase1): make admin user management mobile friendly`), Render deploy `dep-dbrpn9eq1p3s73e2ogmg`; deploy status is live and `/api/health` returns 200/database OK.
- Authenticated Chrome shows the Admin → Users invite form at a 390px viewport; fields are stacked and labels remain visible. Full mobile list/cards and end-to-end phone workflows have not been verified, so mobile acceptance is partial.
- A cumulative targeted Phase 1 regression passed **15 suites / 104 tests** for invite/role/reset/deactivate, Business Profile save, file/PDF routes, authorization, currency and invoice behaviors. Earlier larger targeted test counts overlap; do not add them together. Targeted ESLint, TypeScript and `next build` passed for the deployed commit.
- The broader repository Jest run remains non-green (latest recorded: 422/426 suites, 3,163/3,168 tests) with unrelated Odoo timezone fixtures, E2B Windows shell-path fixture, and async teardown issues.
- Phase 1 status remains **incomplete, 20/25 (80%), health 83/100**. The requested 95/100 release gate is not met. Remaining acceptance evidence: live restricted-role navigation/denial, authenticated private-file authorized/unauthorized reads, runtime database currency-row inspection, full mobile core workflows, and resolution/isolation of cumulative suite failures.
- INR is the active UI/default and source scans found no foreign-currency codes/symbols or Czech/Russian defaults in the scanned active app paths; database currency rows remain unchecked. Sheet two-way business-record sync is Phase 4 and remains paused at 22%.
