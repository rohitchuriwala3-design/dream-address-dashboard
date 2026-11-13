# Google Sheets connection setup

The current integration is an administrator-only, read-only structural audit plus an app-side, human-reviewed legacy-ID crosswalk. The master workbook's dedicated service account has now been upgraded to Editor at the user's request, but the application still requests the read-only Sheets API scope and has no app-to-Sheet write path. Do not claim dual sync until the write/pull paths and a real round trip pass.

## Configure read access

1. In Google Cloud Console, create or select a project and enable the Google Sheets API.
2. Create a dedicated service account for Nexus 360 and create a JSON key. Keep the key private; do not paste it in chat, commit it, or store it in a normal workbook.
3. Share the master workbook with the dedicated service-account email. It currently has **Editor** permission on the staging master because the requested two-way sync will eventually need writes. Keep the application's OAuth scope read-only until sync code and staging safety gates are complete.
4. On Render, set `NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL` and `NEXUS360_SHEETS_PRIVATE_KEY` as secret environment variables. The private-key value must be the full PEM value from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`; a `private_key_id` is not an authentication key. Never paste credentials into chat, source control, or a normal Sheet. `NEXUS360_SHEETS_SPREADSHEET_ID` can be omitted because staging has the master workbook ID as its default.
5. Apply the `NexusSheetCrosswalk` database migration in a local/staging environment.
6. Open Admin → Google Sheets, run **Read-only audit**, then **Run read-only preview** under Legacy ID crosswalk. Select the corresponding app record and save each reviewed mapping. Mapping changes affect Nexus 360 only; raw workbook keys are not persisted in run summaries.

### Current connection status (2026-11-13)

- The master workbook is visible to the connected Google Drive account: `Dream Address Studio — Management`, spreadsheet ID `1oJP7fqIGl48cUPq76XOogPQ-B5IfHHESt0JCTVpIW5o`.
- The service account `nexus360-sheets-reader@nexus-514508.iam.gserviceaccount.com` has Editor access to the master workbook. Drive metadata readback confirmed the permission change.
- Isolated staging is `nexus360-rebuild-staging` on branch `nexus360-rebuild-staging`, service ID `srv-dbqogudbedkc73e9bqo0`; production remains unchanged. The service-account key is not yet configured in Render and a Google API read with it has not yet been verified.
- The user confirmed the Render value is the full PEM `private_key` (the Secret File they briefly uploaded has since been removed). The code validates the PEM marker and will not mistake a `private_key_id` for a private key. Verify a deployed read-only audit before expanding the app's API scope to writes. Never replace the service's complete variable collection to add these values.

The audit checks 11 required source tabs, finds stable-ID headers in the observed four-row header block, and reports duplicate or incomplete keys. Quotation Lines use Quote ID + Revision + Line no.; Invoice Lines use Invoice ID + Section + Line no. Header discovery is bounded to A1:Z4. Data scanning is restricted to the relevant key and minimal row-content columns; it does not load Vendor bank details or financial line-item amount columns. Each attempt is recorded in NexusSheetSyncRun without cell values or IDs in the run record.

## Before enabling writes

The admin-only crosswalk editor and read-only dry-run are implemented. Configure Sheets credentials and apply the migration before runtime use. Review every mapping; name/amount inference is deliberately not used. Conflict classification is now being added. Before enabling writes, complete field mapping, formula/validation preservation, idempotency keys, write readback, and rollback handling. Do not enable writes until a staging round trip and totals reconciliation pass.

The live workbook's `Accounts` tab is a cash/bank register and must map to TreasuryAccount, while `Clients` and `Vendors` map to different CRM account types. `Projects` map to StudioProject and `Transactions` map to TreasuryTransaction. Quotations are revision-based; line tabs require composite keys. `Payment Allocations` represents splits of one receipt across invoices and has no direct one-to-one app entity today. The legacy `Expenses` tab can include project costs and overheads; it must not be silently merged with VendorBill records. These are explicit review points for the crosswalk—never infer matches from names or amounts.

The live master has a pre-rebuild rollback copy recorded in BUILD_STATUS.md. The known ACC-06 mapping is still unresolved and must not be guessed.
