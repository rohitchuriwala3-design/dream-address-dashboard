# Nexus 360 product specification

## Purpose

Run the client relationship and delivery operations for Dream Address Studio, a Kolkata interior design and turnkey execution studio. NextCRM is the authenticated application and PostgreSQL record system. Google Sheets remains a staff-friendly operational surface for review, data entry, and analysis. Neither application may claim sync until a completed, verified sync run exists.

## Workspace navigation

Overview; Leads; Accounts (clients/households); Contacts; Opportunities; Projects; Quotations and BOQ; Invoices and Receipts; Treasury; Expenses; Vendors; Tasks and Calendar; Reports; Integrations; Administration.

## Lifecycle

Lead (New → Contacted → Qualified / Disqualified) → qualification and human approval → Account + Contact + Opportunity → project activation → versioned estimate/quotation → approval → milestone invoice → allocated receipt → project execution, cost entries and change orders → handover. Each transition is server-validated, atomic, idempotent, and recorded with actor/time. Converting an already converted lead returns the existing records rather than creating duplicates.

## Finance invariants

- INR amounts use database decimal arithmetic and round to paise at line/transaction boundaries.
- Invoice balances derive from immutable payment allocations and credit notes; they are never client-supplied totals.
- A payment cannot be zero, negative, exceed the outstanding balance, or post twice under one idempotency key.
- Vendor bills use a vendor account plus a unique normalized supplier invoice number, manager approval, rejection reason, and payment reference. Approved bill and project-expense payouts debit the selected treasury account atomically; invoice receipts credit it.
- Treasury balances derive from signed ledger entries, including a statement-confirmed opening entry. Transfers create balanced debit and credit entries atomically and require same-currency active accounts and sufficient funds. Manual cash entries are idempotent and overdraft-protected. Reconciliation snapshots compare a dated bank statement balance to the ledger balance without mutating either; they do not yet reconcile individual statement lines.
- Project cost and margin derive from approved project costs and actual revenue. Forecasts show their assumptions separately from actuals.
- GST/tax treatment, business/personal separation, and opening balances require accountant-approved configuration before production use.

## Analytics

Report source, as-of time, definitions, and exclusions with every KPI. Separate contracted value, weighted opportunity forecast, issued invoice value, collections, receivables aging, committed costs, actual costs, and gross margin. Do not substitute CRM seed figures or sheet formulas for application facts.

## Security and tenancy

The deployment serves one studio organization. Use NextCRM's authenticated sessions, server permissions, audit trail, and OTP delivery configuration. Hiding a route or using a subdomain does not enforce access. Client portal access is out of scope until project-level isolation and client identities have explicit security rules.

## Rollout

1. Make a disposable local preview, inspect the existing schema, invoice flows, permissions, and login delivery.
2. Add a reversible additive studio schema migration and a branded navigation/dashboard.
3. Import a sanitized copy of the workbook into staging and produce a duplicate/conflict report.
4. Verify dashboard totals against known ledger examples, then test lead conversion, quote approval, invoice payment, and balanced transfers.
5. Run the spreadsheet integration read-only and compare IDs and money totals; enable deliberate writes only after field mapping, backup/restore, and concurrency checks pass.
6. Deploy staging and verify login, email OTP, database persistence, and reconciliation before considering production cutover.
