# MARK IV workspace and Nexus 360 CRM product specification

## Product hierarchy and sign-in

- **MARK IV** is the parent workspace and platform. Its dashboard and navigation are the front door for all studio tools.
- **Nexus 360** is the CRM module inside MARK IV. Finance, project delivery, reports, and integrations are sibling modules within MARK IV.
- A single user account and credential store serves every module. Signing into MARK IV opens Nexus 360 without another login. A user can also go directly to Nexus 360, sign in with the same credentials, and enter the CRM.
- In the current staging app, both entry points share one application origin and Better Auth session. `/` opens MARK IV; `/nexus360` is the direct CRM entry. The authenticated session is shared automatically on the same origin.
- If separate subdomains are introduced later, use sibling subdomains under one owned parent domain and configure secure parent-domain session cookies, shared auth URLs/trusted origins, and SSO return paths. Do not expect browser cookies to be shared between unrelated `onrender.com` service domains.
- Public signup stays disabled. Administrators create profiles and can reset passwords until a verified email delivery provider is configured. The database-backed permission checklist is staged; existing role and record-scope checks remain authoritative until module-wide enforcement is finished and validated.

## Purpose

Run the client relationship and delivery operations for the owner's India-based residential interior design and turnkey execution business. MARK IV is the authenticated master workspace and PostgreSQL record system; Nexus 360 is its CRM module. Keep the workspace brand configurable while the owner confirms Dream Space Studio(s) vs Dream Address Studio. Quotations and invoices need a separate selectable issuer profile; the owner has asked for Impressive Creators to be selectable as the current document name. Do not claim a legal registration or render official issuer particulars before the owner/CA confirms them. Google Sheets remains a staff-friendly operational surface for review, data entry, and analysis. Neither application may claim sync until a completed, verified sync run exists.

## Workspace navigation

Overview; Leads; Accounts (clients/households); Contacts; Opportunities; Projects; Quotations and BOQ; Invoices and Receipts; Treasury; Expenses; Vendors; Tasks and Calendar; Reports; Integrations; Administration.

## Lifecycle

Lead (New → Contacted → Qualified / Disqualified) → qualification and human approval → Account + Contact + Opportunity → project activation → versioned estimate/quotation with optional agreed payment plan → approval → progress invoice/receipt → design and project execution, cost entries and change orders → handover. Payment plans are tracked and reminded internally, but remain configurable and do not block work. Each transition is server-validated, atomic, idempotent, and recorded with actor/time. Converting an already converted lead returns the existing records rather than creating duplicates.

## Finance invariants

- INR amounts use database decimal arithmetic and round to paise at line/transaction boundaries.
- Invoice balances derive from immutable payment allocations and credit notes; they are never client-supplied totals.
- A payment cannot be zero, negative, exceed the outstanding balance, or post twice under one idempotency key.
- Vendor bills use a vendor account plus a unique normalized supplier invoice number, manager approval, rejection reason, and payment reference. Approved bill and project-expense payouts debit the selected treasury account atomically; invoice receipts credit it.
- Treasury balances derive from signed ledger entries, including a statement-confirmed opening entry. Transfers create balanced debit and credit entries atomically and require same-currency active accounts and sufficient funds. Manual cash entries are idempotent and overdraft-protected. Reconciliation snapshots compare a dated bank statement balance to the ledger balance without mutating either; they do not yet reconcile individual statement lines.
- Project expenses, invoice lines and receipts currently have project-level foundations, but the schema does not map project costs to invoice lines. Until cost codes and explicit cost allocations are implemented and reconciled, do not present a per-line/project margin as actual. Forecasts must show assumptions separately from actuals.
- GST features and tax collection are intentionally excluded from V1 at the user's direction, with a six-month revisit. The owner reports written CA confirmation that registration is not currently required; retain it and review sooner if business facts change. The software must not imply GST registration or issue a GST tax invoice. Business/personal classification and opening balances also need accountant review before production statements.

## V1 studio operating workflow

Enquiry and qualification → consultation/site survey and client brief → scope, budget and quotation/BOQ → deal confirmation → project kickoff and design concepts → versioned design review and recorded client approval → material selections/procurement → execution milestones and approved changes → vendor bills, dated daily expenses and receipts → project/company financial review → handover and aftercare. A design revision must not silently replace the approved version; changes that affect price or scope should be captured as a change order before downstream delivery and accounting.

For diary expenses, preserve both the date incurred and the date entered. Late entries are allowed but auditable. Photo/OCR should create a draft for human review, never post a guessed amount automatically. Personal household spending must appear in the company cash diary, be categorized as Personal Expense and be viewable in a separate personal-spending ledger, while remaining excluded from business/project operating costs and margin. The accounting treatment for proprietor withdrawals must be confirmed with the accountant before financial statements are finalized.

## Analytics

Report source, as-of time, definitions, and exclusions with every KPI. Separate contracted value, weighted opportunity forecast, issued invoice value, collections, receivables aging, committed costs, actual costs, and gross margin. Do not substitute CRM seed figures or sheet formulas for application facts.

Finance includes a **Profitability** workspace with Invoice Margin, Project Profitability, and Company P&L views. The invoice editor allows an authorized user to set the selling price for each particular independently of the cost or markup, and shows an internal draft preview. Issued prices are immutable; price changes against the approved quote/contract are recorded with the actor, reason and variance. Internal costs and margins never appear in the client PDF.

Every direct cost is categorized by project cost code/work package (such as plywood/materials, labour, electrical work, transport or overhead). Invoice lines reference the corresponding work package. A cost-allocation ledger assigns no more than the recorded cost once across invoice lines and billing periods; partial billing cannot accidentally deduct the full eventual project cost multiple times. Missing or unallocated costs produce an `Unknown / incomplete` margin, never an assumed zero.

Show **gross profit** (net billed amount minus allocated direct cost), **gross margin %** (gross profit ÷ net billed amount), and **markup %** (gross profit ÷ direct cost) separately because these percentages use different denominators. Distinguish estimated, committed, paid/actual and allocated cost. Project Profitability shows the approved contract baseline and changes, billed and collected value, costs to date, committed costs, forecast cost-to-complete and expected final project profit. Company P&L is a separate ledger-based report with the revenue-recognition approach confirmed by the accountant. An invoice or progress payment is not automatically equal to earned revenue or accounting profit.

## Security and tenancy

The deployment serves one studio organization. Use authenticated sessions, server permissions, and an audit trail. Public signup is disabled; an admin creates each profile, assigns an access role, and sets a temporary password. Admins can reset passwords without email delivery. The current application supports one built-in role per profile (admin, manager, user, or partner); the requested combination-based permission checklist requires a permission model and enforcement across server actions, APIs, and UI before it can be represented safely. Hiding a route or using a subdomain does not enforce access. Client portal access is out of scope until project-level isolation and client identities have explicit security rules.

## Rollout

1. Make a disposable local preview, inspect the existing schema, invoice flows, permissions, and login delivery.
2. Add a reversible additive studio schema migration and a branded navigation/dashboard.
3. Import a sanitized copy of the workbook into staging and produce a duplicate/conflict report.
4. Verify dashboard totals against known ledger examples, then test lead conversion, quote approval, invoice payment, and balanced transfers.
5. Run the spreadsheet integration read-only and compare IDs and money totals; enable deliberate writes only after field mapping, backup/restore, and concurrency checks pass.
6. Deploy a disposable staging service and verify admin-provisioned password login, profile creation/reset, database persistence, and reconciliation before considering production cutover.
