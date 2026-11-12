# Nexus 360 rebuild status

Updated: 2026-11-12 (Asia/Kolkata)

## Target

Rebuild the management workspace for Dream Address Studio on the isolated NextCRM Next.js, TypeScript, PostgreSQL, and Prisma application. The full scope is defined in `PRODUCT_SPEC.md`. Keep Google Sheets as a staff-facing operational surface; do not claim sync until a real run has been read back and reconciled.

## Work completed in this session

- Replaced the generic home dashboard with a studio operations overview, responsive workspace links, primary actions, and a Kolkata-local date.
- Added a role-scoped INR invoice summary for issued invoices, collections, outstanding receivables, and overdue invoice count. Draft, cancelled, credit note, and non-INR records are excluded and called out in the UI.
- Added a role-scoped pipeline summary using only active opportunities explicitly denominated in INR. The UI calls it forecast and does not blend in unconverted currencies.
- Removed the prior hard-coded `total revenue = 0` card and added this as a concrete lesson in `ANTIGRAVITY_LEARNINGS.md`.
- The overview now links “Add lead” directly to the existing lead creation sheet rather than merely opening the lead list.
- Hardened invoice payment capture: invoice-level database lock, paise-safe allocation, server-side balance/status/role validation, and idempotency key for safe retries. Deletion uses the same invoice lock.
- Added an atomic, retry-safe CRM lead conversion that creates or reuses a client account, creates the contact and INR opportunity, stores conversion links, uses the configured entry stage, and adds a **Convert to client** action to the lead detail screen.
- Conversion is serialized on the lead row. Stage automation and audit logging run after the database transaction; failures are logged and do not falsely report the committed conversion as failed. A durable retry queue for these downstream side effects remains future work.
- Added manager due-date controls for studio delivery milestones; status, completion and due-date mutations are server-authorized and audited.
- Reused opportunity line items as the initial BOQ/quotation surface. Requests for approval now require at least one line item, pending/approved quotes are locked against add/edit/delete/reorder, and managers can reopen an approved quote with a recorded revision reason before another review.
- Added a project link to new invoices with server validation that the project belongs to the selected client account. Project detail now lists linked invoices and shows issued INR billing, receipts and balance separately; drafts, cancelled records and non-INR currencies are excluded from those three totals.
- Added immutable quote revision snapshots on every approval submission. Each revision captures the client/deal context, currency, total and sorted line prices; approval, rejection and reopening attach their outcomes to the matching revision. Opportunity detail now shows the revision timeline and approved quote PDFs render from the stored approved snapshot.
- Added a distinct `REOPENED` approval state so approved quotes returned for edits are not mislabeled as rejected; the rep can submit the revised snapshot as the next revision.
- Added project expense capture with an authenticated project/account write check, manager/admin approval or rejection, required rejection reason, manager/admin paid marking, and audit events. Project costs separate pending review, approved commitments and paid spend; only paid expenses count as paid costs.
- Added a manager/admin-only vendor directory and payable workflow: active Vendor CRM accounts, duplicate-safe normalized invoice numbers, optional project linkage, submitted/approved/rejected/revised/paid states, required rejection reason, and payment reference. Project pages show supplier bills to managers/admins only; external partners cannot view supplier invoices or internal expense records.
- Added a cash treasury ledger with manager/admin account setup, account-currency-specific balances, verified opening balance entries, retry-safe same-currency transfers with source locks and insufficient-balance protection, and a recent activity view. Invoice receipts credit the selected account; vendor bill and project expense payments debit it in the same database transaction as the source status/payment record. Manual bank income/expense entries are retry-safe and prevent overdrafts. Statement snapshots store ledger balance, statement balance, variance and note without altering the ledger; transaction-level clearing and source evidence remain pending.
- Replaced payment-account number prompts on vendor bills and project costs with inline account/reference forms; invoice receipts already use an account selector.
- Added an admin-only Google Sheets connection page and read-only workbook structural audit. It now covers 11 source tabs including Vendors and invoice/quotation lines, validates composite keys for line rows, reads only the observed four-row header block, and scans minimal key/content columns so vendor bank details and financial line-item amounts are not fetched. Each attempt is stored in `NexusSheetSyncRun` without saving cell contents. The live workbook was inspected through the connected read-only Drive integration; the app's service-account credentials are still not configured, so its audit action has not run. The live tab/entity mismatches and missing line IDs are documented for crosswalk planning.
- Added the crosswalk schema and migration plus an admin-only saved mapping editor and read-only reconciliation preview. It requires explicit human selection of an app record per legacy key; duplicate sheet keys remain unresolved, stale mappings are surfaced, and unsupported one-to-many payment allocations are not forced into an entity. Mapping records are audited; raw IDs are omitted from run summaries. Runtime still depends on applying the migration and configuring the service account, neither of which is available in this isolated checkout.
- Wired `Studio projects` into the CRM navigation so the delivery workspace is directly discoverable.
- Preserved the existing repository branch and open-source license. No GitHub remote or production Render resource was modified.

## Spreadsheet audit and master repair

- Master workbook: `Dream Address Studio — Management` (now 25 tabs). Following the user's direction to build toward the final version, targeted formula and data-quality repairs were applied to the master.
- Before the changes, a complete rollback copy was created: [Pre-rebuild rollback 2026-11-12](https://docs.google.com/spreadsheets/d/1uP_w4ehsx2rb_e8iXWzVVe9I3GakjAlGSQ08sc0Nsck/edit?usp=drivesdk).
- Fixed the dashboard-to-ledger row mapping and removed unreliable hard-coded financial fallbacks; repaired the Client Ledgers summary and project statement field mappings; moved the expense detail filter below all prefilled project-ledger rows; cleared calculations from header/selector cells and the malformed phone-as-formula cell.
- Reclassified five explicitly named TEST fixtures as `Test` (retained, not deleted) so live-filtered metrics exclude them.
- Added `Data Quality` and `Nexus360 Sync Log` tabs. The sync log intentionally has no success record: no app-to-Sheet sync has run or been validated.
- Read back targeted formula ranges after repair: zero formula errors in sampled dashboard, Client Ledgers, Project Statement, Daily Expenses, fixture, quality and sync-log ranges. Daily Expenses clearly says `ACCOUNT MAPPING REQUIRED` because legacy formula ID `ACC-06` is absent from Accounts; its intended account is not known.
- The earlier [Nexus 360 Rebuild Draft](https://docs.google.com/spreadsheets/d/16unWRts52qq8paj-zUKDkukFTOBMHdcFF0sOwrL6PmE/edit) remains a separate historical artifact; the master is the actively repaired workbook.

## Current readiness estimate

**Prototype readiness: 67/100 (roughly 67%).** This is a weighted engineering assessment, not a test pass rate. It reflects the dashboard, CRM conversion, studio-project milestones and expense approval, vendor payables, immutable quote revisions and approved PDF export, project-linked invoices, receipt/payment posting into a signed treasury ledger, verified opening balances, retry-safe transfers/manual movements, statement variance snapshots, repaired master-sheet formulas, and the crosswalk-backed read-only Sheets preview foundation. Transaction-level bank reconciliation, receipt evidence, accountant-approved tax/terms, configured Sheet scan and app-to-Sheet reconciliation, email OTP provider, production-repo integration, and database-backed/browser verification remain incomplete. Do not treat the percentage as a certified health score.

## Evidence and constraints

- Target checkout: `work/nexus360-nextcrm`, branch `codex/nexus360-studio-fit`, base commit `7911e41d`.
- Initial working tree contained only the three Nexus 360 docs as untracked files; no pre-existing user code edits were present in this checkout.
- `git diff --check` passed; only existing line-ending normalization warnings appeared for the dashboard home page and Prisma schema.
- Verification in the isolated NextCRM checkout: Prisma format/validation/client generation passed; TypeScript passed; full `pnpm lint` passed; 19 focused Jest tests across 4 suites passed earlier for Treasury, vendor bills, project expenses and the Sheets audit, and the crosswalk key-preservation audit tests pass (2 tests); `git diff --check` passed. The optimized `next build` passed after the crosswalk changes using local-only initialization placeholders. The full Jest suite was attempted but DB-backed suites cannot reach PostgreSQL at the configured host, and document authz suites also require MinIO environment values. The repository's `pnpm build` migration step likewise cannot run because local PostgreSQL is unavailable. No live provider calls were made.
- Node 26.7 emits a Prisma support warning (supported versions listed by Prisma are 20.19/22.12/24). Docker and psql/PostgreSQL are unavailable here, so migrations were not applied, no database seed/integration test ran, and no browser visual review was possible.
- Read-only production health check confirmed Render service `Dream Address Management Tool` (`srv-dbnq3m9srm7s73a4k1sg`) is not suspended and its latest deploy is `live` on 2026-11-08 at commit `e5458cb7a28d6237a6ec415a7723a4a8ebba2f5a`. A public GET returned HTTP 200 and HTML with a login prompt.
- Render returned no recent HTTP 5xx log rows. The error log query surfaced an earlier failed initial build from 2026-11-07 (`Dockerfile: no such file or directory`); that failure predates the current live deploy. CPU, memory, instance, latency, and request metrics returned empty series, so current load and latency could not be assessed.
- The production service is linked to `rohitchuriwala3-design/dream-address-dashboard` branch `main`. The NextCRM checkout's `origin` is the upstream `pdovhomilja/nextcrm-app`; its branch is a prototype checkout and is not yet connected to the production repo. The separate live-repo checkout already has user changes, so it was left untouched.

## Remaining build matrix

| Area | State | Next work |
|---|---|---|
| Overview UI and truthful dashboard KPIs | Partial | Visual review at desktop/mobile; add alerts and date-range/report definitions after server data contracts are agreed |
| CRM lead-to-client lifecycle | Conversion foundation added | Exercise retry/concurrency/permissions after dependencies are available; complete qualification, duplicate detection, and post-conversion change history |
| Interior project delivery | Foundation added | Client-linked studio projects, site/scope, status, default milestones, due-date controls and list/detail/create screens exist; add change orders, handover and real DB/browser validation |
| Quotations and BOQ | Revision and approved PDF foundations added | Opportunity line items provide a BOQ surface; immutable revision snapshots and review outcomes are recorded; approved snapshot can be downloaded as a PDF. Still add configured tax/terms, validity, client acceptance and database/browser verification |
| Billing and receipts | Project link and payment guard added | Link invoices to same-account studio projects; detail view reports issued INR billing/received/balance; validate issue/payment against DB and reconcile taxes/configuration |
| Expenses, vendors, treasury | Treasury ledger and statement snapshot foundation added | Expenses and vendor bills debit selected cash accounts; invoices credit selected accounts; opening balances are verified; transfers are balanced, same-currency, locked and retry-safe; manual entries are idempotent; statement snapshots show variance. Still add transaction-level bank reconciliation, source evidence, and avoid duplicate cost entry across expense/bill surfaces |
| Analytics | Existing generic reports; studio definitions incomplete | Separate contracted, forecast, issued billing, collection, receivables, committed cost, actual cost, margin; show source/as-of/exclusions |
| Google Sheets | Read-only audit and reviewed crosswalk foundation added; sync not connected | Apply migration/configure service account, run preview, review mappings/conflicts, then implement conflict classification and validated staging read/write round-trip |
| Email OTP delivery | Provider setup pending | Preserve existing auth, configure a verified sender/provider before claiming delivery readiness |
| Deployment health | Partially checked | Service is live and root returns HTTP 200; Render metrics were empty; inspect app paths, sync/auth flows, and database availability separately |
| Full quality verification | Partial | Start a local PostgreSQL test environment and set local MinIO test values, apply additive migrations, rerun the full suite, then run browser tests and visual review; validate production repo relationship before any release |

## Safety and data rules

- The connected workbook is live operational data. A rollback copy exists; future bulk import/sync must still use stable-ID field mapping, reconciliation and write/readback checks.
- Do not add production tax settings, opening balances, payment records, or fake demo rows.
- Do not expose secrets or assume an email provider is configured.
- Do not deploy or mutate Render production resources as part of local implementation.

## Release path still in progress

Continue the final implementation in the isolated app: build versioned quote/BOQ lifecycle and a controlled spreadsheet integration, then connect app data to the repaired master with stable IDs and reconciliation. Do not claim production readiness until migrations, local integration/browser verification, and a real Sheet sync round trip pass. Keep production deployment unchanged until the replacement is complete and release-ready.
