# Dream Address Studio master workbook: observed structure

Master workbook: `Dream Address Studio — Management` (Google Sheet). Timezone is Asia/Calcutta; locale is en_GB. The repaired master currently contains 25 tabs, including `Data Quality` and `Nexus360 Sync Log`. A pre-rebuild rollback copy was created before edits: https://docs.google.com/spreadsheets/d/1uP_w4ehsx2rb_e8iXWzVVe9I3GakjAlGSQ08sc0Nsck/edit?usp=drivesdk .

## Existing tabs and operational purpose

| Tab | Role / observed key | Notes |
|---|---|---|
| Dashboard | Read-only executive view | Treasury, receivables, advances, active sites, and project profitability matrix; formulas must be checked against source tables. |
| Settings | Configuration | Studio, workflow and dropdown settings. |
| Clients | Client register; client ID | CRM source rows begin below the header block. |
| Projects | Project register; project ID in column A | Observed live rows include `PRJ-26-001` and `PRJ-26-002`; project values feed ledgers and statements. |
| Service Rate Card | Rate/service catalog | Quote authoring reference. |
| Quotations | Quote header; quote ID | Project ID, status, record type and total. |
| Quotation Lines | Quote line; composite key is Quote ID + Revision + Line no. | No immutable line ID column was present in the observed header row. The app uses UUID line-item IDs; create a reviewed crosswalk before syncing. |
| Client Quotation | Client-facing quotation view | Formula-driven presentation surface. |
| Quotation Issue Log | Issue/revision history | Keep approvals/revisions auditable. |
| Accounts | Account ID in column A | Account balance derives from opening value and confirmed transactions; live IDs observed: `ACC-HDFC`, `ACC-CASH`, `ACC-PETTY`. |
| Transactions | Transaction ID in column A | Type, project/account references, amount, confirmation, record type, and validation checks. |
| Workflow | Operational status/configuration | Process support. |
| Quotation Editor | Quote authoring interface | Formula/validation-driven interface. |
| Invoices | Invoice ID in column A | Project, dates, status, record type, totals and checks. |
| Invoice Lines | Invoice line; composite key is Invoice ID + Section + Line no. | No immutable line ID column was present in the observed header row. The app uses UUID invoice-line IDs; create a reviewed crosswalk before syncing. |
| Vendors | Vendor ID | Supplier/contractor directory. The observed sheet includes bank account details; do not copy those values into sync logs or UI previews. |
| Expenses | Expense ID in column A | Project, category, vendor, amount, payment status, linked transaction, record type. |
| Payment Allocations | Allocation ID in column A | Transaction, project/client, invoice, amount, record type and validation. |
| Client Ledgers | Project ID in column A | Summary selector plus project-level calculated financials and expense detail. |
| Project Statement | Selected project ID in B3 | Printable/project-specific client statement. Selection should start blank in the rebuild draft. |
| Client Invoice | Selected invoice/project presentation | Formula-driven print surface. |
| Material Catalog | Material/item catalog | Operational reference. |
| Daily Expenses | Daily expense entry and account view | Frozen header row 5. Formula referenced a nonexistent account code `ACC-06`. |
| Data Quality | Issue register | Captures repairs, open mappings, and sync validation state. |
| Nexus360 Sync Log | Sync audit | Header structure is ready; no successful sync is recorded because app integration has not yet been validated. |

Most source tables use a header block ending at row 4; `Daily Expenses` uses row 5. Do not assume every tab shares the same row offset. Source rows can include samples, demos, and test fixtures alongside live records.

## Control and source-of-truth rules

1. Stable entity IDs—not row numbers or labels—are the join key. Preserve each legacy ID and map it to a stable application UUID before importing.
2. `Record type` (`Live`, `Sample`, `Test`) must be respected in every total. Test fixtures remain in the draft but are marked `Test`; do not delete audit evidence.
3. Explicitly distinguish editable input columns from formulas. Avoid overlapping FILTER spills and formulas; avoid putting formulas into section headers.
4. No fallback should turn a missing project lookup into plausible money. Missing mappings should be blank/zero plus a visible data-quality issue.
5. Keep app and sheet money in INR unless a currency and FX snapshot are explicitly stored. Reconcile source counts, invoice totals, receipts, allocation totals, account balances, and paid expenses.
6. Do not claim sync until a real read/write round trip is logged and read back. Use a sync-run ID, actor, timestamps, row counts, checksums, conflict list, and idempotency keys. Preserve formulas and validations.
7. Keep a versioned copy and restore instructions before any future write to the master. The current draft copy is not a verified backup/restore procedure and is not connected to the application.

## Repairs recorded in the master

- Fixed unquoted `Client Ledgers` references and dashboard/ledger/project-statement mappings.
- Removed fabricated financial fallback amounts; missing project matches no longer become plausible money.
- Moved the `FILTER` expense detail output below the project ledger's prefilled rows.
- Five explicitly named TEST fixtures were relabeled `Test` and retained.
- `Daily Expenses` references `ACC-06`, absent from the account register. The cell now says `ACCOUNT MAPPING REQUIRED`; no live account was guessed.
- Cleared the Project Statement demo selection and malformed phone-as-formula cell.
- Targeted post-repair readback found zero formula errors in the dashboard, Client Ledgers, Project Statement, Daily Expenses mapping, fixture, quality and sync-log ranges.
- App-to-Sheet sync remains unimplemented/unvalidated. The log tab is structural only; do not interpret its existence as proof of sync.
- Sample/demo records and legacy data still need a governed keep/archive decision and full ID reconciliation.
