# Google Sheets connection setup

The deployed integration is an administrator-only structural audit plus an app-side, human-reviewed legacy-ID crosswalk. An administrator-triggered write/read verification event was recorded in the append-only Sync Log (row 5); this proves only that the app can write and read the log. CRM, project, invoice and finance business records are not synchronized either way. Do not claim dual sync until controlled pull/push paths and a real mapped-record reconciliation pass.

## Configure read access

1. In Google Cloud Console, create or select a project and enable the Google Sheets API.
2. Create a dedicated service account for Nexus 360 and create a JSON key. Keep the key private; do not paste it in chat, commit it, or store it in a normal workbook.
3. Share the master workbook with the dedicated service-account email. It currently has **Editor** permission on the staging master. The app's Sheets scope is write-capable to support the verified Sync Log check, so keep the app's write action restricted to that labelled administrator-only connectivity test until business-record sync and staging safety gates are complete.
4. On Render, set `NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL` and `NEXUS360_SHEETS_PRIVATE_KEY` as secret environment variables. The private-key value must be the full PEM value from `-----BEGIN PRIVATE KEY-----` to `-----END PRIVATE KEY-----`; a `private_key_id` is not an authentication key. Never paste credentials into chat, source control, or a normal Sheet. `NEXUS360_SHEETS_SPREADSHEET_ID` can be omitted because staging has the master workbook ID as its default.
5. Apply the `NexusSheetCrosswalk` database migration in a local/staging environment.
6. Open Admin → Google Sheets, run **Read-only audit**, then **Run read-only preview** under Legacy ID crosswalk. Select the corresponding app record and save each reviewed mapping. Mapping changes affect Nexus 360 only; raw workbook keys are not persisted in run summaries.

### Current connection status (2026-11-14)

- The master workbook is visible to the connected Google Drive account: `Dream Address Studio — Management`, spreadsheet ID `1oJP7fqIGl48cUPq76XOogPQ-B5IfHHESt0JCTVpIW5o`.
- The service account `nexus360-sheets-reader@nexus-514508.iam.gserviceaccount.com` has Editor access to the master workbook. Drive metadata readback confirmed the permission change.
- Isolated staging is `nexus360-rebuild-staging` on branch `nexus360-rebuild-staging`; production remains unchanged. The deployed Google Sheets admin page reports credentials configured, and a read-only audit has completed successfully against the workbook.
- The user confirmed the Render value is the full PEM `private_key`; the duplicate Secret File is unused. The code validates the PEM marker and will not mistake a `private_key_id` for a private key. Never replace the service's complete variable collection to add these values.
- Latest deployed audit: 11 required tabs and 286 populated rows scanned; 219 structural findings, primarily missing keys and repeated quotation-line keys. No human-reviewed legacy ID mappings are saved. The workbook contains populated records, so it must not be treated as empty or overwritten.
- The app appended a labelled connectivity event and verified its read-back at Nexus360 Sync Log row 5 on staging. It proves app-to-Sheet log write and read access only. It does not prove that Sheet-originated business changes are applied to the app or vice versa.
- Render MCP cannot directly query the staging PostgreSQL database because its IP allowlist is empty. The allowlist was not changed. Do not expose the database publicly just to run this check.

The audit checks 11 required source tabs, finds stable-ID headers in the observed four-row header block, and reports duplicate or incomplete keys. Quotation Lines use Quote ID + Revision + Line no.; Invoice Lines use Invoice ID + Section + Line no. Header discovery is bounded to A1:Z4. Data scanning is restricted to the relevant key and minimal row-content columns; it does not load Vendor bank details or financial line-item amount columns. Each attempt is recorded in NexusSheetSyncRun without cell values or IDs in the run record.

## Before enabling writes

The admin-only crosswalk editor and read-only dry-run are implemented. Credentials and database migration are present in staging, and read-only access works. Review every mapping; name/amount inference is deliberately not used. Before enabling business-record writes, complete field mapping, formula/validation preservation, idempotency keys, conflict review, write readback, and rollback handling, then pass staging reconciliation checks.

The live workbook's `Accounts` tab is a cash/bank register and must map to TreasuryAccount, while `Clients` and `Vendors` map to different CRM account types. `Projects` map to StudioProject and `Transactions` map to TreasuryTransaction. Quotations are revision-based; line tabs require composite keys. `Payment Allocations` represents splits of one receipt across invoices and has no direct one-to-one app entity today. The legacy `Expenses` tab can include project costs and overheads; it must not be silently merged with VendorBill records. These are explicit review points for the crosswalk—never infer matches from names or amounts.

The live master has a pre-rebuild rollback copy recorded in BUILD_STATUS.md. The known ACC-06 mapping is still unresolved and must not be guessed.
