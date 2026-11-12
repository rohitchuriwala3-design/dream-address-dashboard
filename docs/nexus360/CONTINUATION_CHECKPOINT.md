# Nexus 360 continuation checkpoint

Updated: 2026-11-12 (Asia/Kolkata)

## Current state

- Current planning and change set are in this staging branch: `work/nexus360-live-integration`, `nexus360-rebuild-staging`. The new deliverable checklist is `docs/nexus360/V1_WORKFLOW_CHECKLIST.md`; it records the ordered phases and India-specific research notes.
- Completed a source-backed operating-model research report at `docs/nexus360/INDIA_OPERATING_MODEL_RESEARCH.md`. User-confirmed model: residential turnkey, design plus execution together, mostly in-house team, sole proprietorship, no GST now and GST deferred until after six months. The report keeps GST out of V1, addresses cash/margin/design/procurement/quality/privacy and flags remaining assumptions.
- Read-only review of the connected management workbook confirms existing workflows for daily cash/expenses, personal spending, projects, vendors, quotations, invoices, receipts and statements. Test/sample rows and an unresolved daily-expense cash-account reference remain to be classified/resolved; milestone percentages and defect-period defaults are not confirmed policy. The workbook was not edited and no app sync is verified.
- Bounded header reads on the canonical master confirm the current daily diary summary calls the personal outflow “Personal Drawings”; the user wants the Sheet-facing label “Personal Expense” and a separate personal-spending ledger view in MARK IV. No cells were changed.
- User clarified variable job scale and payment behavior: furniture/repair jobs from roughly ₹40k, small projects around ₹1–5L, regular work around ₹12–20L, and a reported long-running ₹1.5–2Cr project; exact large-project figure/phasing needs confirmation. Per-project payment plans should be internal tracking tools with flexible negotiated dates and no work-blocking enforcement. Personal spending should show in the company cash diary and a distinct personal ledger.
- Read-only review of invoice/quotation workbooks found both “Impressive Creators” and “Dream Address Studio” issuer labels. Owner says Impressive Creators is the current document/legal name and wants it selectable for quotes/invoices; exact registration/legal fields and final studio brand spelling still require owner/CA verification. Historical files were not changed.
- Owner confirms a written CA note exists saying GST registration is not currently required; we have not inspected the note. V1 still omits GST; revisit with the CA in six months or sooner if business facts change.
- User requested variable item-level selling prices and profitability reporting. The workflow now adds cost codes and one-time cost allocations, an invoice-margin preview/snapshot, cumulative project profitability, and a separate accountant-policy-based Company P&L under Finance → Profitability. Current schema has invoice prices but no cost allocations, so these are specified as upcoming work rather than claimed as built.
- Phase 1 source-level profile fix is implemented locally and covered by 3 passing focused tests; TypeScript passes. It has not been pushed/deployed, so staging profile creation remains unverified.
- Phase 1 India defaults have begun locally: default currency fallback and core CRM/invoice fallbacks now use INR; seed enables INR and disables other codes without deleting historical currency records, ECB refresh default is off, Treasury account creation is INR-only, product import sample content is India-interiors-focused, and the profile language selector exposes English only. Full localization sweep is still pending. TypeScript, the 3 profile tests and diff whitespace checks pass locally.
- V1 invoicing has no tax system: removed tax-rate selection/tab/API/rate seed, account VAT validation, and tax prompts/totals from invoice settings, composer, summary and PDF; settings default issuer country to India and no longer require a foreign-style company registration number. Invoice create/update/issue server actions force zero tax, including stale submitted rate IDs. Historical tax schema/records remain untouched. TypeScript, lint and focused profile/invoice/tax API tests passed locally; staging behavior is not yet verified.

- Added the phased delivery plan at `docs/nexus360/V1_WORKFLOW_CHECKLIST.md`. It orders access/localization first, accounting/diary second, the interior project/design lifecycle third, verified Google Sheets sync fourth, Studio Pulse/alerts/Leakage Radar fifth, and staging acceptance/release decision sixth. Mobile usability is an acceptance requirement throughout.
- Source review found a likely profile-create blocker: the action forwarded the signed-in administrator's headers to Better Auth `createUser`, while configured Better Auth roles have no create/set-role endpoint grants. A local fix now uses the app's own admin-guarded server action as the authorization boundary and creates an active profile with its selected language. The form now retains entered values after failure. A post-create permission-write issue is reported as a partial success rather than a false failed creation. Staging verification remains outstanding.
- Added three focused profile-creation tests; all pass. `pnpm exec tsc --noEmit` passes. No code was pushed, no Render services were changed, and the Sheets workbook was not modified.

- Active worktree for these edits: `work/nexus360-live-integration`, branch `nexus360-rebuild-staging`, isolated staging branch.
- Rebuilt dashboard, scoped finance/pipeline metrics, hardened invoice payments, retry-safe lead conversion, and studio project/milestone foundation are in the working tree.
- Studio milestone due dates are editable with audit logging; opportunity BOQ line items require approval, are locked when pending/approved, and can be reopened by a manager with a revision reason.
- Invoices can be linked to studio projects through an admin-safe account/project check; project detail shows issued INR billed, paid, and outstanding values.
- Quote review now stores immutable, sequenced snapshots per submission; manager decisions and reopen reasons update the matching revision; opportunity details show the revision history and approved quote PDFs render from that immutable snapshot.
- Reopening an approved quote now uses a dedicated `REOPENED` state, keeps it distinct from a rejection in the UI, and exposes the submit-again action.
- Studio project costs can be submitted by authorized project users, approved/rejected by managers/admins, and marked paid. The project view separates pending costs, approved commitments and actual paid spend; rejection requires a reason.
- Managers/admins now have a vendor directory and vendor-bill workflow with project linkage, duplicate-safe invoice numbers, review, revise-and-resubmit after rejection, and payment-reference capture. Vendor bills and internal expense records are filtered from partner project reads.
- Treasury now has cash accounts, per-currency ledger balances, statement-confirmed opening balance postings, locked/retry-safe transfers, idempotent manual income/expense entries, and dated bank statement snapshots that show ledger variance without changing ledger values. Invoice receipts credit a cash account; vendor bill and project expense payments debit a selected account atomically with the source status update. Transaction-level statement matching and receipt attachments remain outstanding.
- Vendor bill and project expense payment actions now use inline cash-account and payment-reference fields instead of numeric prompts.
- Admin → Google Sheets has a read-only structural audit foundation and run-history table. It scans 11 source tabs, including Vendor and invoice/quotation line tables; the line tables use composite keys. It reads the observed four-row header block and only key plus minimal nonfinancial row-content columns. It does not reconcile app records or write. The connected workbook was inspected read-only; app service-account credentials remain unconfigured.
- Added `NexusSheetCrosswalk`, migration and an administrator-only crosswalk editor/dry-run preview. Human-selected mappings live in Nexus 360 and are audited; preview reads keys only for reconciliation, does not write workbook cells or store raw keys in run summaries, flags duplicates/stale/unsupported rows, and treats split payment allocations as unsupported. The admin UI lists saved legacy mappings. Runtime validation is pending service-account configuration and local/staging database migration.
- Sheets access setup: the user supplied a dedicated service-account email and it was granted Viewer access to the master workbook. The downloaded credential's project/email were checked locally (private key not displayed); a tool policy blocked the one-off local API verification script, so a Sheets API read with that key is not yet verified. Current live Render service still deploys a different production repository; configure the key only in a matching staging environment after code integration.
- Google Sheet master `Dream Address Studio — Management` was repaired directly in the prior session after creating rollback copy `https://docs.google.com/spreadsheets/d/1uP_w4ehsx2rb_e8iXWzVVe9I3GakjAlGSQ08sc0Nsck/edit?usp=drivesdk`. This run used read-only metadata/header samples to confirm tab names and keys; no Sheet cells were changed. Five test fixtures remain marked Test; `ACC-06` remains unresolved; `Nexus360 Sync Log` has no success entry.
- App-to-Sheet integration does not exist yet. Do not state that sync is connected.
- Latest verification: Prisma format/validate/generate; TypeScript; `pnpm lint`; `git diff --check`; focused Sheets audit tests (2 passed); optimized `next build` (passed with local-only Better Auth, Inngest, MinIO and OpenAI initialization placeholders). `pnpm build` cannot pass its migration stage because local PostgreSQL is unavailable. Earlier in the work, 19 focused tests across 4 suites passed. Full Jest was attempted but DB-backed suites cannot connect to PostgreSQL, while document access suites also lack MinIO test configuration. Migrations have not been applied and database/browser checks remain outstanding.
- No live provider calls were made.
- No changes or deployments were made to production Render or the separate production Git repository.

## Resume next

Follow `V1_WORKFLOW_CHECKLIST.md` in order. Finish and verify Phase 1 in the isolated staging service: profile creation, login/reset/permissions, India defaults, and non-tax invoice behavior. Complete active V1 locale cleanup before moving to Phase 2 finance/accounting foundations. Do not push to `main` or change legacy production. Continue with studio project/design workflow, staged Sheet round trip, analytics/action alerts, mobile/browser acceptance and only then a release decision. Hosting-provider comparison was requested for a separate chat; do not include it in this project batch.

## Reports

- `BUILD_STATUS.md`: implementation/readiness evidence and remaining matrix.
- `V1_WORKFLOW_CHECKLIST.md`: phased workflow, research basis and acceptance checklist.
- `INDIA_OPERATING_MODEL_RESEARCH.md`: India/residential operating model, growth controls, source-backed findings and open workflow questions.
- `PRODUCT_SPEC.md`: target operating model.
- `SHEET_DATA_DICTIONARY.md`: workbook ranges, data rules and repair findings.
- `ANTIGRAVITY_LEARNINGS.md`: mistakes and acceptance checklist for the rebuild.
- `GOOGLE_SHEETS_SETUP.md`: read-only service-account setup and write-enablement gates.

## Continuation checkpoint

- Status: PARTIAL
- Scope: MARK IV / Nexus 360 V1 research, prioritization and isolated rebuild work for Dream Space Studios.
- Exact target: local worktree `work/nexus360-live-integration`, branch `nexus360-rebuild-staging`.
- Completed: India residential turnkey workflow research; prioritized six-phase plan; read-only master workbook review; local profile creation fix and focused test coverage.
- Evidence: `INDIA_OPERATING_MODEL_RESEARCH.md`, `V1_WORKFLOW_CHECKLIST.md`; profile fix and disabled V1 tax API have focused tests; TypeScript, lint, i18n check and diff whitespace checks pass locally; no staging deploy/readback yet.
- Mutations: local repository documents/code only; no live Sheet edit, Git push or Render deployment in this research turn.
- Unfinished: resolve workbook account mapping and test rows; learn real project/payment terms; deploy/verify profile fix in isolated staging; finish remaining localization; complete V1 modules, sync, mobile checks and reconciliation.
- Unfinished: confirm official brand/issuer particulars and the large project's phased scope; resolve workbook account mapping and test rows; verify Phase 1 changes on isolated staging; complete India localization and V1 modules, sync, mobile checks and reconciliation.
- Next safe action: establish the exact isolated staging Git/Render target before any push/deploy; the current origin is the production repository. Then verify profile creation, role permissions, sign-in/reset, INR-only controls and non-tax invoice issue with a test profile/document.
- Exact references: `docs/nexus360/V1_WORKFLOW_CHECKLIST.md`; `docs/nexus360/INDIA_OPERATING_MODEL_RESEARCH.md`; rollback workbook copy and canonical workbook references are documented in `SHEET_DATA_DICTIONARY.md`.
- Suggested skills: Render deployment/debug skills for staging; Google Sheets skill before any live workbook reads/writes.
- Do not repeat: India/residential workflow research and the workbook's initial structural read-only review.
