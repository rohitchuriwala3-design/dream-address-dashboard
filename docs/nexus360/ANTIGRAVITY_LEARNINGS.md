# Antigravity handoff: lessons from the first management-tool build

Use this as the build brief and review checklist for Nexus 360. The previous app is a prototype, not a trustworthy CRM or accounting source.

## Observed mistakes and why they matter

1. **Authentication was decorative.** The server-side `requireAuth` called `next()` unconditionally, OTP had hardcoded bypass codes and returned a demo code to the browser, and several reads were public. A screen-level login cannot secure APIs.
2. **The sync button fabricated success.** `/api/sync-sheets` returned fixed counts and a success message without reading or writing Sheets. Never report integration success from intended behavior.
3. **Two systems disagreed on identity and money.** The app and master workbook contained different client, project, account, and invoice IDs, unrelated sample rows, and mismatched financial structures. Matching labels are not safe identity mappings.
4. **Business state was in process memory.** Restarting or redeploying could reset edits and ledger balances. Persistent relational records and database transactions are required.
5. **Financial operations were not consistently guarded.** Payment code accepted fallback amounts and lacked a universal overpayment check; conversion could be repeated; mutation payloads could overwrite managed record fields.
6. **The UI implied enterprise completeness without an integrated operating model.** Subdomains were inferred from hostnames, but no tenant or client-level authorization enforced the implied boundaries. Many modules were wide HTML surfaces without consistent record navigation, status, search, or data provenance.
7. **Reports mixed demo values and derived values.** KPI labels did not consistently state their calculation source, date range, or exclusions. A plausible dashboard can still be financially misleading.
8. **Operational capabilities claimed live AI/sync without their provider.** Receipt OCR and notifications must surface `not configured` or failed status when credentials/integration are absent.
9. **The dashboard showed a hard-coded zero as total revenue.** KPI labels must map to a real scoped query, document their currency/status filters, and distinguish forecast from issued billing. Placeholder metrics must be removed rather than styled as real totals.

10. **The workbook itself had silent formula and mapping failures.** Unquoted cross-tab references, row-offset errors, formulas pointing at heading rows, fabricated monetary fallbacks, a colliding FILTER spill, five TEST fixtures classified as Live, and an orphan `ACC-06` account reference made dashboard outputs unreliable. The master was repaired after creating a rollback copy; targeted readback now reports zero formula errors. The account mapping is still unresolved and visibly flagged.
11. **A sync register is not a sync integration.** The master has a `Nexus360 Sync Log` tab, but it has no successful run. The app must not claim sync until authorized Google Sheets access, stable-ID mapping, conflict handling, write/readback reconciliation and a durable run record all exist and pass.
12. **A project row alone does not make a delivery workflow.** The app now has a client-linked project and milestone foundation, but change orders, handover evidence, real database migration checks and browser-level validation remain required before calling it a completed studio CRM.
13. **An approval flag does not preserve the quote that was reviewed.** Mutable opportunity line items can change after a quote is reopened. Each submission now stores a sequenced immutable snapshot and keeps the approval/rejection/reopen outcome with that revision. Downloadable quote PDFs must render from the approved snapshot rather than the current editable rows.
14. **A cost request is not yet an actual cost.** Project expenses now move through Submitted → Approved → Paid (or Rejected); dashboard totals distinguish pending review, committed and paid spend. Only paid expense records count as paid costs, and a rejection needs a reason. Vendor bills, receipt evidence and treasury reconciliation are still required before treating project profitability as complete.
15. **A polished PDF can still be commercially incomplete.** Quote export uses the approved revision but tax treatment, payment schedule, validity and contractual terms are not configured. The PDF states that those terms need review before it is shared as a binding offer.
16. **A supplier invoice needs its own payable identity and state.** Vendor bills now use a Vendor CRM account and a normalized unique invoice number, so resubmitting the same supplier invoice cannot create a duplicate. Review, revision after rejection and payment reference are audited. Paid bills now debit a selected cash account in the same transaction as the bill's paid state.
17. **Cash status needs an auditable movement.** Record receipts and payouts as signed ledger entries linked to their source records; update source payment state and ledger posting atomically. Compute balances from entries, seed opening balances only after statement confirmation, prevent overdrafts on cash-out/transfer, keep transfers balanced and retry-safe, and never combine unlike currencies without a reviewed FX model. Keep a dated statement-vs-ledger variance snapshot, and do not claim transaction-level reconciliation until statement lines are matched.
18. **Sheet tab labels do not define app entities.** The workbook's `Accounts` is a cash register, `Clients` and `Vendors` are distinct account types, `Payment Allocations` can split receipts, and `Expenses` can mix project costs and overhead. Quote/invoice line tabs lack their own permanent line IDs. Validate composite keys and have a human-reviewed crosswalk before comparing or syncing records.
19. **A login screen is not an account lifecycle.** Do not create public users when the owner expects admin-controlled access. Bootstrap the first administrator from a secret, hash its password with the same scheme used by the auth provider, disable self-signup server-side, create profiles through a protected admin action, and audit password resets without writing passwords to logs. Do not pretend an existing single-role model supports combined permission checklists; enforce the permission matrix across server actions, APIs, and UI before exposing it.

## Required engineering response

- Build on the isolated NextCRM Next.js/TypeScript/PostgreSQL/Prisma codebase, preserving license notices and existing authentication, role checks, audit logs, and invoice workflows. Add the interior-studio domain through reviewed additive migrations.
- Use normalized clients, contacts, opportunities, projects, immutable quote revisions/lines, invoices/lines/payments, vendor bills, project expenses, treasury accounts/transactions, tasks, and sync runs. Opportunity line items are the current editable BOQ surface; the revision snapshot records the exact values reviewed and approved. Link records with stable IDs and database constraints.
- Calculate pricing, taxes, payment allocation, invoice balances, transfer entries, receivables aging, and margin on the server. Use decimal money math and transaction boundaries; record the acting user and before/after event.
- Make every lifecycle action validated, authorized, atomic, auditable, and idempotent. A repeated lead conversion returns the existing result. A payment cannot exceed its current due. A transfer balances exactly.
- State analytics definitions, time basis, source system, and refresh time. Separate actuals from forecasts and unresolved sheet conflicts.
- Treat the sheet as a deliberate shared operational interface. Use the workbook dictionary and sync contract; start with a dry-run reconciliation, preserve formulas and validations, quarantine conflicts, and verify every write by reading it back.
- Keep authentication tied to the approved account lifecycle: no public signup, no demo credentials in production, and no password values in logs. Admin password reset is supported; self-service email reset remains unavailable until a mail provider is configured.

## Acceptance review

- Logged-out calls cannot read or mutate CRM or finance data; built-in roles are enforced server-side. Combined custom permissions are not complete until the permission model is wired through all guards.
- Lead conversion cannot create duplicate account/contact/project rows when retried.
- Concurrent invoice payment cannot over-allocate the balance; ledger and invoice totals update atomically.
- A transfer creates two balanced entries, rejects same-account/insufficient-fund moves, and can be retried safely.
- Reports recompute from persisted records and reconcile to known hand-calculated examples.
- Sheet dry-run identifies duplicate IDs, missing links, amount differences, demo records, and formula columns without writing.
- Repeating a completed sync introduces no duplicate rows; conflicting edits pause for human review; write readback and audit are recorded.
- A process restart preserves records; a tested backup can restore them.
- Mobile/table desktop views use consistent navigation, accessible labels, empty/loading/error states, and visible record ownership/status.
- Deployment health is reported from observed database, email, and sheet connections. Never promise a migration or deployment from a local build alone.
