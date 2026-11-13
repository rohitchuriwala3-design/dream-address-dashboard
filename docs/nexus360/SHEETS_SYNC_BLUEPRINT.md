# MARK IV ↔ Google Sheets two-way sync blueprint

## Goal

Keep MARK IV and `Dream Address Studio — Management` usable as two views of the same operational records. The app remains the validated accounting system; the workbook remains a practical staff interface. Neither side may silently overwrite a concurrent edit.

## Confirmed workbook structure

The live master has 25 tabs. The source tables and observed row-4 headers are:

| Source tab | Key | Notes for sync |
|---|---|---|
| Clients | Client ID | Contact and address fields are operational CRM data. |
| Projects | Project ID | Client ID links to Clients; client name is formula-derived. |
| Accounts | Account ID | Treasury register; balances and movement columns are calculated. |
| Quotations | Quote ID + Revision | Revision/approval history must remain immutable. |
| Quotation Lines | Quote ID + Revision + Line no. | Composite identity; item descriptions/rates/amounts are line data. |
| Invoices | Invoice ID | Issued/paid/balance fields are controlled accounting data. |
| Invoice Lines | Invoice ID + Section + Line no. | Composite identity; issued rates are immutable. |
| Transactions | Transaction ID | Cash-book entries; only validated, idempotent entries may enter the ledger. |
| Expenses | Expense ID | Mixed project costs and studio overhead; keep type and project links explicit. |
| Vendors | Vendor ID | Do not include Bank Account Details in sync previews, logs, or conflict summaries. |
| Payment Allocations | Allocation ID | May split a receipt; totals must reconcile to the receipt and invoice. |
| Daily Expenses | Voucher ID | Header row is 5, with summary formulas above it; preserve incurred date separately from entry date. |

Presentation/formula tabs (Dashboard, Client Quotation, Quotation Editor, Client Ledgers, Project Statement, Client Invoice, and related summaries) are read-only from the app. `Data Quality` and `Nexus360 Sync Log` are controlled outputs, not general app-row write targets.

## Identity and comparison

- Use permanent legacy IDs and the reviewed `NexusSheetCrosswalk`; never use a row number, name, phone, or amount as identity.
- Store a field-limited baseline snapshot for every linked row after a successful readback. Exclude formula cells and protected/unused columns.
- Compare three states per field: last accepted baseline, current MARK IV, and current Sheet.
- App-only edits push to the Sheet. Sheet-only edits pull into MARK IV. Non-overlapping edits merge. If both sides changed the same field differently, record a conflict and leave both values untouched until an admin resolves it.
- Financially sensitive Sheet changes (issued invoice values/status, cash entries, allocations, vendor payment state, and approvals) go to a review queue and never bypass the app's validation or approval workflow.
- Unmapped, duplicate, incomplete, test, or unsupported rows remain visible as issues; do not auto-create or discard records. `Record Type` must be respected so Sample/Test rows never enter live totals.

## Write safety

- Write only whitelisted input columns on the operational source tabs. Formula, validation, presentation, historic, and bank-detail columns are never overwritten by a generic sync.
- Use stable IDs, an idempotency key per run/row/direction, bounded batch writes, and `RAW` value input so imported text cannot be evaluated as a formula.
- After each write batch, read the affected bounded ranges back and compare to the submitted values. A failed or partial readback is an error, not a successful sync.
- Keep a verified workbook backup and tested restore procedure before the first write to the master. The current rollback copy is a content snapshot, not yet a proven restore runbook.
- Keep a run ledger with run ID, actor/source, direction, timestamps, row counts, conflicts, retries and result. Never store raw private key material or vendor bank details in logs.

## Run behavior

1. Admin can trigger **Sync now** for immediate reconciliation.
2. A scheduled poll checks for Sheet-side edits and app-side changes, with one run active at a time.
3. Safe, non-overlapping changes are reconciled automatically; conflicts and finance workflow changes wait for an admin review.
4. The dashboard shows last successful pull/push, pending review, conflicts, failures, and per-tab counts.
5. Every website or workbook schema/configuration change is followed by a connection check and a two-direction round-trip test.

## Credentials and current gate

- The dedicated account `nexus360-sheets-reader@nexus-514508.iam.gserviceaccount.com` now has Editor access to the master workbook.
- Its private key must be entered directly in Render's `nexus360-rebuild-staging` Environment page as `NEXUS360_SHEETS_PRIVATE_KEY`; the account email uses `NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL`. Never place the key in chat, Git, a normal Sheet, or build logs.
- The current application client still requests `spreadsheets.readonly`; Editor file permission alone does not enable app writes. Do not expand the OAuth scope or run writes until the field map, conflict handling, migrations, backup/restore, and staging round-trip acceptance checks are in place.
- Production remains untouched.
