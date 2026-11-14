# MARK IV V1 data and workflow relationship blueprint

Updated: 2026-11-14 (Asia/Kolkata)

## Product intent

MARK IV is the internal operating workspace for the Indian residential interiors business. Nexus 360 is its CRM and customer-workflow module. The system should let the team move from an enquiry to a delivered project and reconciled money trail without losing context, duplicating people, or maintaining competing versions of the same fact. This is an internal studio tool, not a general-purpose SaaS CRM.

Use INR and India-oriented fields in active V1 workflows. GST/tax calculations are explicitly deferred. Keep the invoicing issuer configurable (including Impressive Creators when needed); business identity is managed centrally in Administration.

## Research patterns adapted for MARK IV

- **Salesforce:** separates prospective Leads from durable Accounts/Contacts and Opportunities. Standard lead conversion often happens at qualification and maps data into client/account/opportunity records. Activities appear in a record timeline; tasks/events can relate to multiple records; files can be attached to records; an Opportunity can have multiple Quotes and a selected Quote can synchronize commercial line items. MARK IV adapts this but keeps a new prospect a Lead through negotiation, converting only at Won/closed per the studio's workflow.
- **HubSpot:** treats relationships as explicit two-way associations, visible from both linked records. Deal records expose associated contacts/companies, activity and quotes. Quotes have lifecycle states and can be cloned, recalled/edited in allowed cases, voided or archived; quote associations and attachments stay visible on the deal.
- **Zoho CRM:** its deal detail page gathers account/contact, activities, notes, attachments, products and quotes; quick-info surfaces next action and contact details. Blueprint transitions make stage changes deliberate and can validate required information before, during and after each transition. Stage duration and transition reports help expose bottlenecks.
- **Pipedrive:** centers deal detail on linked people, organizations, activities, notes, files, emails and history. Its progress bar shows time spent in stages, and a Focus section highlights actions that need attention. Smart Docs can populate proposals/quotes from deal, contact and product records. MARK IV also needs an explicit post-sale delivery record and finance linkage.
- **Freshsales:** its Account/Customer 360 timeline rolls up activity and conversations from related deals and contacts and allows filtering. This fits a returning household with several concurrent projects: one client history, with each event labeled by the job it belongs to.
- **Houzz Pro (interior design):** connects CRM leads to estimates/proposals and projects; organizes material/product selections by room/category with client comments and approvals; carries selections into proposals, invoices and procurement; exposes project updates/design assets/financial documents through a client dashboard. This is the closest industry workflow analogue for design plus execution.
- **Buildertrend (residential construction):** joins lead-stage estimates/proposals to project delivery, selections, change orders, daily logs, schedules and client portal; its project financial view separates original contract price from approved selections/change orders and revised cost; invoices can draw from estimate lines, approved selections and change orders to reduce re-entry.
- **MARK IV should adopt:** two-way relationship visibility; a compact high-value summary; chronological, filterable activity/decision history; guided stage transitions; immutable quote revisions; project handoff; stale/overdue attention; and responsive quick actions. Avoid sales seats, marketing automation, generic ticketing, payment processing, or enterprise complexity the studio does not need in V1.

Official references:

- Salesforce: [Convert qualified leads](https://help.salesforce.com/s/articleView?id=sf.leads_convert.htm&language=en_US&type=5), [lead conversion field mapping](https://help.salesforce.com/s/articleView?id=lead_conversion_mapping.htm&language=en_US&type=5), [activities and activity timeline](https://help.salesforce.com/s/articleView?id=sales.activities.htm&language=en_US&type=5), [quotes](https://help.salesforce.com/s/articleView?id=sf.quotes_overview.htm&language=en_US&type=5), [quote syncing](https://help.salesforce.com/s/articleView?id=sales.quotes_synch_overview.htm&language=en_US&type=5), [record files](https://help.salesforce.com/s/articleView?id=notes_add.htm&language=en_US&type=0).
- HubSpot: [two-way record associations](https://knowledge.hubspot.com/records/associate-records), [manage quotes and their deal relationships](https://knowledge.hubspot.com/quotes/manage-quotes), [create/send quotes from deals](https://knowledge.hubspot.com/quotes/create-and-send-quotes), [record/activity attachments](https://knowledge.hubspot.com/records/add-and-remove-attachments-from-records).
- Zoho: [deal detail and related records](https://help.zoho.com/portal/en/kb/crm/sales-force-automation/deal-management/articles/create-deals), [Blueprint process transitions](https://help.zoho.com/portal/en/kb/crm/process-management/blueprint/articles/design-a-blueprint), [related lists](https://help.zoho.com/portal/en/kb/crm/customize-crm-account/record-level-customization/articles/using-related-lists-expanded-view).
- Pipedrive: [deal detail, Focus and history](https://support.pipedrive.com/en/article/deal-detail-view), [deal and linked records](https://support.pipedrive.com/en/article/deals-what-they-are-and-how-to-add-them), [Smart Docs](https://support.pipedrive.com/en/article/smart-docs).
- Freshsales: [account activity roll-up](https://crmsupport.freshworks.com/support/solutions/articles/50000005638-how-to-access-and-filter-events-on-the-account-activity-timeline-), [mobile activity timelines](https://crmsupport.freshworks.com/support/solutions/articles/50000002483-how-to-use-the-activities-timeline-in-the-mobile-app-).
- Houzz Pro: [interior design workflow/features](https://pro.houzz.com/for-pros/software-interior-designer), [selection boards and approval/budget flow](https://pro.houzz.com/for-pros/feature-selections), [proposal creation/approval and invoice handoff](https://pro.houzz.com/for-pros/feature-proposal).
- Buildertrend: [residential platform feature areas](https://buildertrend.com/product-overview/), [job lifecycle and financial job view](https://buildertrend.com/help-article/job-management/), [project invoice sources and partial payments](https://buildertrend.com/help-article/invoice-overview/), [client portal financial context](https://buildertrend.com/help-article/client-portal-faqs/).

## MARK IV innovation: Studio Relationship Graph

The differentiator should be a client-to-project memory graph, not an AI chatbot bolted onto a generic CRM:

1. **Household portfolio:** one Account page shows its Contacts, each active/completed Project, and each open/won Opportunity. Project cards show owner, delivery state, agreed value, next milestone, outstanding balance, latest design approval and any blocker. One Account may have many Opportunities and multiple live Projects at once; their budgets and ledgers stay separate.
2. **Pre-closure job thread:** a new-prospect Lead can be linked to its scoped Opportunity before an Account exists. Its negotiation thread contains site visits, briefs, estimates, quote revisions, follow-ups and decisions. At Won/closed, it links to a new or existing Account/Contact; lost prospects do not create client Accounts. Existing clients can open new Opportunities directly under the Account.
3. **Room/design decision trail:** after delivery begins, design files are organized by Project, room/area and revision. “Approved” records one client-approved version with approver, date and comment; prior versions remain superseded history. Scope/quote changes link back to the decision that caused them.
4. **Selection-to-commercial chain:** material and finish choices belong to the project and room/area, carry client comments/approval and budget impact, and can be referenced by estimate/quote, purchase order and invoice lines. An approved selection does not silently change an issued quote; a price/scope change creates a reviewed quote revision or approved change order.
5. **Change-order ledger:** preserve original accepted scope/value, then record every requested change as a dated, costed, client-approved/rejected item linked to the design/client decision that caused it. Revised project value is original accepted scope plus approved changes/selections; do not overwrite the baseline.
6. **One next-action queue:** actionable work across Leads, Opportunities and Projects: overdue follow-up, no next step, site visit awaiting notes, quote awaiting a decision, design awaiting approval, selection not ordered, milestone at risk, or low project balance. Each item links to its source record and explains why it appeared. Start with deterministic rules and entered dates; AI summaries can wait until data is dependable.
7. **Commercial truth trail:** every quote revision keeps the exact sell prices and terms sent. Internal costs and allocations remain permissioned and separate. Later finance work compares accepted quote, approved changes, invoiced amount, receipts, committed costs and actual costs per scope line without rewriting prior quotes/invoices. Missing cost data means margin is unknown, never zero.
8. **One shared history, correctly scoped:** client-level history rolls up events from associated jobs, but every call, approval, payment or expense still identifies its specific Opportunity/Project. A household view helps recall relationships; a project view avoids mixing details across concurrent jobs.
9. **Interconnection with clear ownership:** records deep-link both ways across CRM, Projects, Documents and Finance; shared IDs and authorized read models power cross-module summaries. Each domain still owns its own facts (quotes own proposal versions, Projects own delivery state, Finance owns posted money). Changes propagate through explicit, audited transitions rather than copying free-text data across modules.
10. **Sheet bridge with identity, not row positions:** every record uses a stable application ID and mirrored Sheet identifier. Linked rows refer to IDs and display names. Sheet edits validate into the same canonical records; conflicts are surfaced instead of allowing parallel database histories. A project never becomes an ambiguous collection of unrelated tabs.

The innovation is the connected chain of relationship → negotiated job → accepted scope → delivery/design decisions → billed and collected money → actual project cost, all attached to a continuing client portfolio. It adds traceability and insight while fitting the studio's size and Indian residential workflow.

## Recommended conceptual model

```text
Referral / Campaign
        │
        ▼
Enquiry (Lead) ── qualification, site visit, brief, next action, notes/files
        │
        └──────────► Opportunity (one negotiated scope/job; linked to source Lead)
                     stage, owner, budget, forecast, next action, activities
                               │
                  ┌────────────┴─────────────┐
                  ▼                          ▼
       Quote + immutable revisions     Site / design brief
       draft → review → shared →       (site visit, room/scope,
       accepted/declined/superseded     measurements, constraints)
                  │ client closes / Won
                  ▼
       Convert Lead to Client Account ◄────► Contacts (family / decision makers)
                  │
                  └────► connect the won Opportunity to Account and Contact
                         │ accepted scope / project kickoff
                         ▼
       Studio Project (delivery record; linked to account + opportunity)
       phases, milestones, design versions/approvals, team, budget
                  │
          ┌───────┴───────────┐
          ▼                   ▼
     Invoices/receipts    Costs/vendor bills/expense diary
          └──────────────┬────┘
                         ▼
                Project and company ledgers

Activities (call, note, meeting, site visit, follow-up task) and Documents/Photos
associate with relevant records and appear on each associated record timeline/view.
```

The lead is the prospect's pre-closure record and remains active while the team qualifies the enquiry, prepares/revises quotes, and negotiates. A new prospect does not become an Account just because it is qualified. Each negotiated scope/job gets an Opportunity linked to its source Lead; quote revisions belong to that Opportunity. When the deal is Won/closed, convert the lead to a Client Account and Contact (or link to an existing Account/Contact), then connect the won Opportunity to those durable client records. Start the delivery Project from the accepted scope after closure. Existing clients can create new Opportunities directly under their Account without a new Lead. An Account can have multiple open Opportunities and multiple concurrent Projects, including repeat work over time. Preserve the original Lead, its source, activity, and conversion links for audit/history.

## Canonical record responsibilities

| Record | Owns | Key relationships |
|---|---|---|
| Lead / enquiry | Prospect facts, referral, initial scope, source, pre-closure stage, owner, qualification, conversion provenance | Linked to pre-closure opportunity; on Won/closed links to new or existing account/contact |
| Account / client | Continuing household/client identity, primary communication/address, client status | Has many contacts, open/won opportunities, concurrent/completed projects, documents and activities |
| Contact | Individual person, relationship/decision role, phone/email, communication preferences | Belongs to an account; participates in opportunities and activities |
| Opportunity / job | One commercial scope: job type, budget range, stage, expected close, next action, owner | Before closure links to source Lead (or existing client Account); after Won links to Account/decision contacts; owns quotes/revisions; accepted opportunity creates one project |
| Quote revision | Snapshot of line descriptions, quantities, sale prices, terms, issuer/template and total for that revision | Belongs to an opportunity; status/review record. New revision supersedes prior draft; never overwrite an issued/accepted snapshot |
| Studio project | Delivery, site address, scope, schedule, assigned manager, milestones, designs/approvals | Links account and originating opportunity; has many invoices, expenses, bills and project documents |
| Invoice/receipt/payment | Issued customer bill and subsequent payment records | Links account and project, with invoice lines associated to agreed scope/work package where possible |
| Vendor bill / expense | Actual/committed cost, incurred date, entered date, vendor, category, payment source, evidence, project allocation | Links project when attributable; personal expense remains explicitly classified and excluded from business margin |
| Activity | Dated call, meeting, site visit, note, follow-up task and owner/due date | Can associate to lead/contact/account/opportunity/project; visible in each connected record's timeline |
| Document/photo | One stored file and its privacy/metadata; use association rows instead of duplicating the file | May relate to several authorized business records; retain revision/caption/tag and project design approval state where applicable |
| Sheet sync metadata | Stable app ID, Sheet/tab/row mapping, source version, timestamps, sync status and conflict record | Belongs to each synced business record; never use row number as the record identity |

## Required relationship and lifecycle rules

1. **Intake:** create an enquiry with at least name plus one contact channel, source/referral, enquiry date, owner, stage and free-text brief. Avoid demanding corporate company/job-title fields for a homeowner. Permit incomplete leads to be saved and marked for qualification. Do not create a customer Account for a new prospect at this point.
2. **Qualification:** capture property/site location, home type, work type (turnkey/interiors, renovation, furniture-only/other), scope/rooms, tentative budget range, desired timing, decision makers, visit status/date, and next action. Mark unknown distinctly; do not treat blank as zero or “not interested.”
3. **Duplicate-aware qualification:** search by normalized phone/email and client/account name before making a new household/person. Let the user attach the enquiry to an existing account/contact and retain the original enquiry details.
4. **Opportunity:** create/link the Opportunity during pre-closure so it can own estimates, quotes and revisions. One opportunity per separately negotiated job/scope. A new prospect Opportunity is linked to its source Lead; an existing client Opportunity may link directly to its Account. Several concurrent jobs for the same client are expected. Pipeline forecast uses opportunity values/estimated range and clearly labels estimates; it never implies a signed commitment.
5. **Quote:** prepare client-facing quotes from an opportunity. Allow multiple alternatives/revisions. Each sent/approved revision is immutable; edits produce a new numbered revision with actor/time/reason and clear state. Only one revision is the current accepted commercial baseline. Internal cost/margin is separately permissioned and never appears in client quote/PDF.
6. **Closure, conversion and handoff:** mark the Opportunity Won only when the client closes/accepts. At that point convert the new-prospect Lead to an Account and Contact, or attach it to a matching existing Account/Contact; connect the won Opportunity to those records. Then create/link the delivery project once from the accepted quote revision, carrying account, contacts, scope, site address, accepted revision, planned value and any agreed milestone plan. Require duplicate/idempotency checks so retrying conversion cannot create duplicate accounts, contacts or projects. Keep negotiated milestone plans optional and record exceptions/reminders without automatically pressuring a client. A lost lead does not create a client account.
7. **Delivery and design:** project has phases/milestones, room/area labels, design image/file revisions, Draft / Sent for Client Review / Approved / Superseded state, client comments, approver and timestamp. Approved design is clearly authoritative; previous versions remain accessible.
8. **Finance linkage:** every invoice is tied to the project/account and has a frozen issued snapshot. Revenue, received cash, committed cost and actual cost are separate values. Allocated costs must not be double-counted; margin is unknown until required costs are captured/allocated. Record late-entered expenses with both incurred-on and entered-at dates. Personal items are visible as Personal Expense but excluded from business/project costs and margin.
9. **Cross-navigation:** show associated record cards on both sides (account↔contacts, opportunity↔account/contacts/quotes, project↔opportunity/account/invoices/costs/design files). Opening a linked item must not lose the user's place; on desktop, open detail from lead-list links in a new tab as requested.
10. **Auditability:** changes to stage, ownership, quote issue/approval, project handoff, money, due dates and associations record actor/time and before/after where appropriate. Deletion is soft/explicit and does not break financial or issued-document history.

## Current MARK IV code map (source inspection)

- Existing Prisma entities include `crm_Leads`, `crm_Accounts`, `crm_Contacts`, `crm_Opportunities`, `OpportunityQuoteRevision`, `StudioProject`, `StudioProjectMilestone`, `StudioProjectExpense`, `Invoices`, `Invoice_LineItems`, and `Invoice_Payments`.
- Lead conversion currently creates the account, contact, and opportunity together, then records `convertedAccountId`, `convertedContactId`, and `convertedOpportunityId`. This action is currently available before a Won/closed guard and therefore does not match the requested sales timing. Opportunities can link to account/contact and have line items and quote revisions; `StudioProject.opportunityId` is unique; invoices link to account and optionally project; project has milestones, invoices, expenses, vendor bills.
- Documents already have many-to-many associations including `DocumentsToLeads`, `DocumentsToAccounts`, `DocumentsToContacts`, and `DocumentsToOpportunities`. Lead reads already include linked documents. There is also a scoped document query pattern for account/contact/opportunity.
- CRM activities already render on the lead and opportunity detail screens. Quote revision history already renders on opportunity detail. This supports a relationship hub without inventing a “lead owns everything” data model.
- Current gaps: current convertLead creates Account/Contact/Opportunity together and is not gated on Won/closed; pre-closure Opportunity-to-Lead linkage is absent; quote revisions live on Opportunity, so there needs to be a way to create/attach that Opportunity before closure and preserve traceability. No direct canonical many-to-many activity association framework was verified; lead fields are sparse (person/company/title/email/phone/description/source/stage/type/referrer/campaign/owner) and lack structured residential qualification/site details; lead detail currently does not expose the available lead-document relation or related converted records. The current opportunity quote revisions need to be assessed before extending them. Do not add duplicate quote/project/finance tables until that assessment is complete.

## Delivery boundaries

### Phase 1B — CRM relationship hub and usability

- Redesign home/pipeline, lead list, and lead detail for the residential studio workflow; keep lead rows useful at phone size and open record details in a new tab.
- Use compact, authorized CRM config queries; expose structured existing client/contact/opportunity/document/activity relationships from either direction where existing routes and scopes allow.
- Keep new prospects as Leads through quote negotiation. Add the pre-closure Opportunity link and Won-only Lead→Account/Contact conversion contract; use existing Accounts directly for repeat clients. Ensure a merely qualified or lost prospect does not create a customer account.
- Make lead enrichment practical: homeowner contact details, referral, qualification, scope/budget/timing, site-visit follow-up, activity history, and secure image/document associations. Confirm closure conversion preserves associations and doesn't create duplicates.
- Establish the shared record page hierarchy and acceptance checklist. Where missing fields require a migration, add only fields needed to support Phase 1B and provide a safe migration/backfill policy.
- Exit gate: desktop and phone review, keyboard/touch behavior, CRM permission tests, conversion/link integrity tests, focused/full phase regression batch, staging deploy/live smoke, updated tracker. Phase 1 is not re-opened continuously; run its agreed regression gate once at Phase 1B exit.

### Later phase — quotation and project transaction workflow

- Complete quote authoring/revisions/review/approval, immutable client-facing PDF snapshot, and idempotent approved-quote→project handoff. Record which quote revision is accepted and carry agreed scope/value/milestones into delivery.
- Complete project design gallery/review and delivery workflows, with all relationships accessible both from the client/opportunity and from the project.

### Finance phase

- Tie project invoices, receipts, vendor bills, daily cash diary, personal expenses, costs and allocation to canonical account/project IDs. Preserve issued prices and connect priced work to internal actual/allocated costs for project margin/P&L.
- Define accounting semantics with the CA before presenting formal ledger/balance-sheet claims. Keep GST/tax out of V1 as instructed.

### Phase 4 — Google Sheets dual sync (paused at 22%)

- Treat the app database as the canonical ID/relationship store and the Sheet as a usable human-operated view/edit surface with explicit field ownership, sync state and conflict handling. Since the owner wants bidirectional entry, Sheet edits are supported commands/imports that validate and apply to the same canonical records; they are not a second independent database.
- Provide separate tabs for accounts, contacts, enquiries/leads, opportunities/jobs, quote headers/revisions/line items, projects/milestones, invoices/payments, bills/expenses, and sync/conflicts. Use stable application IDs, not sheet row positions. Use formulas only for presentation/derived totals; canonical financial totals are calculated/validated in application logic.
- Reconcile create/update/delete/archive behavior, field-level conflict policy, last-modified/source columns, retries, duplicate prevention, and record-link integrity in staging before enabling routine bidirectional sync. Add only Sheet tables needed for the supported app entities and direct Sheet workflows.

## Phase order and guardrails

1. Finish Phase 1B relationship model decisions, CRM hub UI, and scope-safe implementation.
2. Run the one-time Phase 1 regression gate at Phase 1B exit; do not keep repeating the full Phase 1 check during Phase 1B work.
3. Complete the opportunity → quote revisions → approval → project handoff in the later workflow phase.
4. Complete accounting-safe financial linkage and profitability reporting in the finance phase.
5. Resume Phase 4 only when it is the active priority; perform a two-way staged round trip and full sheet reconciliation before claiming sync completion.

This blueprint is a V1 architecture guide, not a claim that the listed future transactions are already implemented.
