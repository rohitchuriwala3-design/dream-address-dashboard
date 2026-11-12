# Nexus 360 continuation checkpoint

Updated: 2026-11-12 (Asia/Kolkata)

## Current state

- Active worktree: `work/nexus360-nextcrm`, branch `codex/nexus360-studio-fit`, isolated prototype checkout.
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

Continue with transaction-level statement matching, receipt/bill evidence attachments, and analytics definitions. Then provision local/staging PostgreSQL, apply the additive migrations, configure a Sheets service account, run/review the crosswalk preview, and build conflict classification plus a staging read/write round trip. Finish database and browser/visual verification before considering the production repo/deployment.

## Reports

- `BUILD_STATUS.md`: implementation/readiness evidence and remaining matrix.
- `PRODUCT_SPEC.md`: target operating model.
- `SHEET_DATA_DICTIONARY.md`: workbook ranges, data rules and repair findings.
- `ANTIGRAVITY_LEARNINGS.md`: mistakes and acceptance checklist for the rebuild.
- `GOOGLE_SHEETS_SETUP.md`: read-only service-account setup and write-enablement gates.
