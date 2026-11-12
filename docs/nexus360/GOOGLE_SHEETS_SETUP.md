# Google Sheets connection setup

The current integration is an administrator-only, read-only structural audit plus an app-side, human-reviewed legacy-ID crosswalk. It does not import app records, update cells, or claim the app and workbook are reconciled.

## Configure read access

1. In Google Cloud Console, create or select a project and enable the Google Sheets API.
2. Create a dedicated service account for Nexus 360 and create a JSON key. Keep the key private; do not paste it in chat, commit it, or store it in a normal workbook.
3. Share the master workbook with the service-account email as **Viewer**. The connected Google account already has access, but that access does not automatically grant access to the app's service account.
4. In the deployment environment for the Nexus 360 code, set `NEXUS360_SHEETS_SERVICE_ACCOUNT_EMAIL` and `NEXUS360_SHEETS_PRIVATE_KEY` as secrets. The app accepts the private key with literal newlines or `\n` escapes. Keep `NEXUS360_SHEETS_SPREADSHEET_ID` set to the master workbook ID (or omit it to use the configured default).
5. Apply the `NexusSheetCrosswalk` database migration in a local/staging environment.
6. Open Admin → Google Sheets, run **Read-only audit**, then **Run read-only preview** under Legacy ID crosswalk. Select the corresponding app record and save each reviewed mapping. Mapping changes affect Nexus 360 only; raw workbook keys are not persisted in run summaries.

### Current connection status (2026-11-12)

- The master workbook is visible to the connected Google Drive account: `Dream Address Studio — Management`, spreadsheet ID `1oJP7fqIGl48cUPq76XOogPQ-B5IfHHESt0JCTVpIW5o`.
- The service account `nexus360-sheets-reader@nexus-514508.iam.gserviceaccount.com` has been granted Viewer access to the master workbook. The user has downloaded its JSON key; its project/email identity was checked locally without exposing the private key. The key is not configured in this prototype checkout, and a Google API read using it has not yet been verified.
- The live Render service currently deploys `rohitchuriwala3-design/dream-address-dashboard` from `main`; this isolated Nexus 360 prototype is a different checkout and is not deployed to that service. Do not add these variables to the live service until the prototype changes are integrated into its production repository/release. Configure them in the matching staging environment first.
- Render environment updates can trigger a deploy; store secrets only in the appropriate service/environment and verify the deployment after saving. Never replace the service's complete variable collection to add these two values.

The audit checks 11 required source tabs, finds stable-ID headers in the observed four-row header block, and reports duplicate or incomplete keys. Quotation Lines use Quote ID + Revision + Line no.; Invoice Lines use Invoice ID + Section + Line no. Header discovery is bounded to A1:Z4. Data scanning is restricted to the relevant key and minimal row-content columns; it does not load Vendor bank details or financial line-item amount columns. Each attempt is recorded in NexusSheetSyncRun without cell values or IDs in the run record.

## Before enabling writes

The admin-only crosswalk editor and read-only dry-run are implemented. Configure Sheets credentials and apply the migration before runtime use. Review every mapping; name/amount inference is deliberately not used. Then add conflict classification, formula/validation preservation, idempotency keys, checksums, write readback, and rollback handling. Do not enable writes until a staging round trip and totals reconciliation pass.

The live workbook's `Accounts` tab is a cash/bank register and must map to TreasuryAccount, while `Clients` and `Vendors` map to different CRM account types. `Projects` map to StudioProject and `Transactions` map to TreasuryTransaction. Quotations are revision-based; line tabs require composite keys. `Payment Allocations` represents splits of one receipt across invoices and has no direct one-to-one app entity today. The legacy `Expenses` tab can include project costs and overheads; it must not be silently merged with VendorBill records. These are explicit review points for the crosswalk—never infer matches from names or amounts.

The live master has a pre-rebuild rollback copy recorded in BUILD_STATUS.md. The known ACC-06 mapping is still unresolved and must not be guessed.
