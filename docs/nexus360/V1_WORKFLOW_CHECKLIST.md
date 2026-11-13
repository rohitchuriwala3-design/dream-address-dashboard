# MARK IV V1 workflow and delivery checklist

Updated: 2026-11-13 (Asia/Kolkata)

## Product decisions

- MARK IV is the internal master workspace for Dream Space Studios; Nexus 360 is its CRM module.
- This is a single-company internal operations system, not a productized SaaS.
- India is the operating context: INR and Asia/Kolkata are the only active V1 currency/time defaults. Only INR should be selectable, used for new records, or shown in active V1 dashboards. Historical financial amounts are preserved as recorded; they must not be silently relabeled or converted.
- Public sign-up remains off. Admin provisions accounts. Admin is the full-access role; Partner is a restricted external account-scoped role. Other staff receive only permissions that are enforced on the server.
- Odoo and general-purpose AI analysis are future phases. Do not make them V1 dependencies.
- Google Sheets remains usable by staff, but sync is not considered connected until a staged round trip is reconciled.

## Phased delivery plan

## Phase exit and regression gate

After each work batch (including while a phase is in progress), update the local project tracker and re-run changed checks plus relevant earlier checks. At each phase exit, re-run that phase's acceptance checks and all previously completed phase checks before moving forward. Always inspect the website↔Sheet connection status. Once dual sync is implemented, test both directions with a safe staging record and reconcile IDs, field values, timestamps, and retry behavior. Use unit/integration tests for critical server behavior and staging smoke/browser checks for actual user journeys. Record the commit, environment, test evidence, failed or blocked checks, and known limitations. Do not mark a phase complete while any required gate is blocked or failing.

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

- [x] Trace the source profile-creation path. The action forwarded current-session headers to Better Auth's admin create-user endpoint, but configured app roles intentionally have no Better Auth endpoint grants. A local change now relies on the app action's own `requireRole(["admin"])` authorization and omits those headers.
- [x] Prevent a false failed-profile message after the profile itself exists: user status/language are supplied at creation; a later permission-write failure returns a partial-success warning. Preserve the form on errors. Three focused regression tests and TypeScript validation pass locally.
- [x] Make failed profile submission preserve entered values and use a controlled English-only language selector. New profile creation is covered by focused tests; the live staging login/reset/role flow is still pending.
- [x] Deploy the Phase 1 code batch to the separate `nexus360-rebuild-staging` Render service/branch. `/api/health` returned HTTP 200 with database `ok`; `/en/login` returned HTTP 200 with MARK IV branding. Production `main` and the legacy Render service were not changed.
- [ ] Use a test administrator to verify profile creation, selected role/language/permissions, sign-in, reset and server-side role boundaries. The public health/login smoke checks do not verify these authenticated workflows. Render continued to report `build_in_progress` after the new app answered requests; confirm the final deployment state.
- [ ] Make profile creation retry-safe for partial permission failures and verify no duplicate user/account is created.
- [ ] Verify admin creates profiles with every intended role, permissions, initial password, and admin reset; verify the user can sign in and role boundaries are enforced server-side.
- [ ] Make user-visible profile-creation failures actionable without logging passwords, tokens, or other secrets.
- [x] Confirm the separate staging service uses the `nexus360-rebuild-staging` branch and startup logs identify `nexus360_test_db`; staging reported no pending migrations. Production `main` and the legacy Render service were not changed. The staging DB blocks external SQL inspection through Render MCP because its IP allowlist is empty, so its persisted settings were not inspected.
- [ ] Use Dream Space Studios consistently in app branding, documents, invoice settings, and Sheet-facing labels.
- [ ] Separate workspace brand from document issuer identity. Keep MARK IV under the selected Dream Space brand; allow quote/invoice settings to select the issuer name (with Impressive Creators available per owner instruction) and independently store address, contact, signatory and bank/remittance details. Confirm the authoritative brand spelling and issuer fields before rendering official outputs; preserve historical document identity.
- [x] Remove tax-rate selection and active tax configuration API from invoice V1. Invoice create/update/issue force tax to zero server-side; invoice settings, line editor, totals and new PDF layout omit tax UI; historical tax schema and rows remain.
- [x] Finish the no-tax source audit: invoice duplicates recalculate as zero-tax drafts; regenerating a tax-bearing historic invoice is blocked so its existing PDF cannot be overwritten; new CRM Orders/plugin orders ignore legacy VAT fields and use INR-only pricing; the Orders editor omits tax and historic order views show tax only when stored historic tax exists. Preserve legacy rows without applying them to new transactions. Local regression coverage passes; staging recheck is pending.
- [x] Owner reports written CA confirmation that GST registration is not required now; the letter has not been independently reviewed. Keep the written advice on file and revisit with the CA at six months or sooner if facts change. Do not add tax collection or tax-invoice claims. [CBIC section 22](https://taxinformation.cbic.gov.in/content-page/explore-act/1000291/1000001), [CBIC invoice FAQ](https://cbic-gst.gov.in/hindi/sectoral-faq.html)
- [x] Set the application fallback currency/formatting to INR, seed INR as the sole enabled/default currency without deleting other currency records, and disable ECB refresh. Core CRM/invoice fallbacks and Treasury account creation use INR. Runtime persisted settings still need staging verification.
- [ ] Finish the active V1 localization sweep across locale routes, account/campaign country examples, document templates, settings and deployed staging data. Remove Czech/INR/Russian assumptions from active V1 surfaces while preserving historical records and clearly isolated integration/test fixtures.
- [x] Begin the code-level localization pass: INR is now the no-setting currency fallback; new seed setup enables INR as the only currency, disables other currency records without deleting them, and turns off ECB refresh; core invoice/opportunity/contract fallbacks and the Treasury account form use INR; product-import examples use Indian interior work and INR; profile language choices show English only.
- [ ] Finish the India-default sweep across settings/admin pages, persisted staging values, date formatting, invoice/quote document templates, active locale routes, CRM forms, plugin/configuration surfaces and any legacy/demo content. Preserve old records and verify no persisted values are silently converted.
- [x] Retire active foreign-currency administration from V1 while preserving historical records and clearly isolated test fixtures. Admin → Currencies is read-only; server actions enforce INR-only and disable exchange-rate changes. New CRM Orders reject non-INR price lists or product prices instead of silently converting them. Do not rewrite amounts or infer exchange rates.
- [ ] Keep GST fully out of V1: source now removes tax fields from product create/edit/import, product and price-list MCP writes, vendor creation, new invoice inputs, and new order/plugin paths; the master workbook and current reusable invoice/quotation templates contain no GST/IGST/tax workflow labels. Revisit after six months with the firm's accountant before enabling any GST-specific workflow. Recheck this on staging after the current source batch deploys. Preserve client-specific historical invoice/quotation files that contain old tax wording or amounts; do not rewrite issued documents.
- [ ] Keep client/project photos, floor plans, invoices and identity details private; require authenticated, project-authorized access, use audit trails, and set clear retention/deletion controls. Treat photos of private homes and precise addresses as confidential operational data.
- [ ] Apply mobile usability as an acceptance requirement in every phase: CRM create/edit/search, tasks/reminders, project updates, expense capture, invoice/receipt review, design upload/approval and notifications must work on phones as well as desktop. Use responsive navigation/tables, readable forms, touch-sized actions, camera/file upload, clear loading/error states, and no desktop-only completion steps.
- [ ] Complete a full MARK IV visual and interaction redesign after core data/finance rules are stable: create clearer navigation and consistent page structure; richer, readable project/account views; analytical dashboards with explainable figures and filters; responsive layouts that preserve desktop-level capability on phones; and a coherent visual system for tables, forms, alerts, empty/loading/error states. Fix the Admin → Users heading/divider overlap within this pass. Do not limit this work to spacing polish.

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

### Phase 2 — Build dependable finance and expense accounting

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

- Source inspection found a likely cause of the reported profile-creation failure: forwarding the signed-in admin session to Better Auth's create-user endpoint conflicts with the intentionally empty endpoint permissions on configured roles. A local fix now uses the separately admin-guarded app server action; the isolated staging fix has not been deployed or verified.
- The profile language selector currently offers English and Czech; the database language enum also includes German and Ukrainian. The inspected profile form does not itself contain a Russian choice, so the requested localization sweep must inspect the deployed UI and all other regional defaults rather than assume the source of the Russian content.
- The codebase contains numerous Czech/INR fixtures and connector assumptions. Historical and test-only examples are not production configuration; classify each occurrence before removal.
- Google Sheets app sync is not connected. Current foundation is read-only audit and mapping preview only.
- Treasury currently models cash movement, not full double-entry accounting. Do not describe it as a complete accounting ledger until the Phase 2 journal and statements are implemented and reconciled.
- Invoice line records currently store client-facing quantity, unit price, discount and totals but have no cost code or cost allocation. Project expenses and vendor bills are project-level records without line-item cost allocations. A true per-item margin view therefore needs the explicit cost-code/allocation work above; do not derive margin from invoice totals minus every project cost or present that as audited profit.
- GST is intentionally deferred until at least six months after V1; do not add GST configuration, totals or invoice claims in the current phase.
