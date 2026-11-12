# India operating model research for Dream Space Studios

Prepared: 12 November 2026  
Purpose: shape MARK IV V1 for an India-based residential design-and-execution studio and a 1–2 year growth objective.

## Executive summary

Dream Space Studios has described a **residential, end-to-end interior service**, with design and execution sold together and delivery handled mostly by an in-house team. MARK IV should therefore behave like a project-operations and cash-control system whose CRM feeds approved design, budget, procurement, site execution, client billing and handover. A generic sales CRM plus a cash register is not enough.

The critical operating risks to control first are:

1. Starting work or procurement without an agreed scope, design revision, BOQ and budget baseline.
2. Losing project margin through unpriced client changes, material substitutions, rework or vendor-cost drift.
3. Running short on cash because client collection timing and supplier commitments are not forecast together.
4. Recording diary expenses late without distinguishing the date spent from the date entered, or blending personal household payments into business/project costs.
5. Losing decisions, files or quality evidence across staff chats, paper diaries, email and spreadsheets.
6. Exposing private residential plans, addresses, phone numbers or site photos too broadly.

For growth, the next best investment is **repeatable delivery discipline and project-level financial visibility**, not extra generic software modules. Every project should have an owner, a standard stage, clear approval gates, current budget, cost-to-complete, cash outlook and a short list of overdue decisions.

## Verified company direction

- Brand and internal tool: Dream Space Studios; MARK IV is the master workspace and Nexus 360 is CRM.
- Sole proprietorship; this is a single-business internal system, not a SaaS product.
- The user says there is no GST now and directs that GST work be deferred until after six months. GST calculations and prompts are therefore excluded from V1; revisit with the accountant at that later phase.
- The user confirms written CA advice exists that GST registration is not currently required. This is owner-reported; the letter has not been reviewed. Keep GST out of V1 and revisit with the CA after six months or sooner if turnover, supplies, or business facts change.
- Main service: residential interiors; design plus execution together; mostly in-house delivery team.
- Product context: India, INR, Asia/Kolkata.
- Work size is highly variable: small furniture-only and repair jobs (roughly ₹40,000–₹70,000), small projects around ₹1–5 lakh, regular residential projects around ₹12–20 lakh, and an owner-reported long-running project around ₹1.5–2 crore. The large-project estimate and exact contract scope should be confirmed before using it as a system baseline. The portfolio view must support mixed-size active work and long-running phases.
- Project counts vary. A described current mix includes several small jobs, one ₹18 lakh job nearing completion, and expected new work around ₹12–15 lakh plus other ₹3–5 lakh jobs. Capacity, expected starts and cash forecasts must be configurable, not built around a fixed number of projects.
- Current client payment practice is relationship-led and flexible. The owner reports taking about 20–30% advance toward initial materials, followed by variable progress payments (sometimes around 7–10% draws as needed). A written plan is a priority, with a gradual adoption goal: start with a couple of projects, then about half, and work toward all projects within two years. The system should record an agreed plan and show internal due/overdue reminders, while never blocking work or automatically escalating to clients when the client arrangement is flexible.
- The owner states the current legal name to use on documents is Impressive Creators and wants the ability to choose it for quotations/invoices while the internal workspace continues under the Dream Space brand. The user is unsure whether the intended brand form is Dream Space Studio or Dream Address Studio. A read-only review of existing invoice and quotation workbooks found both “Impressive Creators” and “Dream Address Studio” used as issuer names. This establishes what prior documents say, not legal registration or the authoritative proprietor name. Build a configurable document issuer profile with selectable business/trade name and signatory/details; the owner/CA should confirm the legal issuer fields before official documents are generated. Historical documents should not be rewritten.
- Staff need to use the app and Sheet; the app↔Sheet sync is not yet connected.
- User wants mobile usability comparable to desktop for practical daily work, including CRM, expense capture, reminders, project updates and design uploads.
- Future possibilities such as Odoo and broad AI analysis are not V1 requirements.

The company's active project count, average project value, pricing model, usual advance/milestone schedule, procurement/storage model, current Udyam status, and official invoice/bank display name are not yet known. These details materially change capacity, cash forecasting, and billing setup; see the final questions.

## Existing master workbook: read-only workflow findings

The canonical management workbook was confirmed by metadata and reviewed read-only at bounded header ranges. The `Daily Expenses` tab already describes a daily cash/expense register, project/client tag, scope/category, recipient, payment source account, debit/inflow, daily balance, approver, bill reference and status. Its dashboard summary currently labels the personal line “Personal Drawings”; the owner wants the daily entry and sheet-facing presentation labelled “Personal Expense,” with a separate personal-spending ledger view in MARK IV. Preserve a distinct accounting classification underneath so the accountant can decide the proprietor-drawings posting while the diary label remains understandable to staff. Other tabs cover projects, vendors, bills, quotations, invoices, receipts, expenses and statements. V1 should improve the app↔Sheet mapping around this vocabulary rather than replace the workbook with a generic CRM schema.

The workbook also contains test/sample rows and an unresolved cash-account reference in the daily-expense view. That unresolved mapping is visibly flagged in the workbook; its intended account must be identified by the owner before financial totals are trusted. The workbook's sample milestone percentages and defect-period values are examples/defaults, not confirmed company policy. Only metadata and bounded header/dashboard ranges were read from the canonical master in this research pass; no Sheet cells were changed. The sync log has no validated app-sync success, so two-way sync remains unproven.

**Implication for delivery order:** resolve profile/access and India defaults first; inventory which workbook rows are live versus test; settle account mapping and data ownership; only then validate finance and stage a write/readback round trip. Preserve the workbook as the staff-friendly surface, protect formula/system fields, and make manual Sheet entry understandable.

The separate invoice and quotation workbooks show several document styles and issuer labels; they also contain GST/tax-oriented rows despite the user's instruction that V1 must not calculate or claim GST. V1-generated documents should therefore use a clean no-GST commercial layout and an explicit selected issuer profile; do not modify the historical workbooks as part of research. The current file contents do not prove GST registration or legal name status.

For GST documents, CBIC says an unregistered person cannot issue a GST tax invoice and may use an ordinary commercial invoice; an unregistered person must not describe the document as a tax invoice or collect GST. [CBIC GST FAQ](https://cbic-gst.gov.in/hindi/sectoral-faq.html)

The user reports written CA advice that current GST registration is not required. That advice was not independently reviewed. Keep GST features out of V1 as directed, retain the written advice with the business records, and revisit with the CA after six months or sooner if turnover, supplies or other facts change. CBIC section 22 generally uses a ₹20 lakh aggregate-turnover threshold for taxable supplies in non-special-category states, subject to exceptions and other rules; this is context for the CA review, not a conclusion about the studio's liability. [CBIC, CGST Act section 22](https://taxinformation.cbic.gov.in/content-page/explore-act/1000291/1000001)

## Industry delivery model to adapt

India-based design-and-build/fit-out companies commonly coordinate sales/prequalification, site review, proposal/work order, project planning, resourcing and procurement, design iterations, execution, inspection, handover, billing/collection and post-completion defects. A large commercial fit-out company’s NSE-filed disclosure describes this sequence; it is evidence of one operating model, not a universal rule for residential firms. Government CPWD quality procedures separately illustrate how material/workmanship checks, inspections, milestones and defect correction can be made auditable. Adapt these controls proportionately to the studio; do not copy commercial tendering or public-works bureaucracy into a small residential workflow. [NSE-filed interior fit-out operating model](https://nsearchives.nseindia.com/emerge/corporates/content/Registration_19102024021232_DRHPELEGANZINTERIORSLIMITED.pdf), [CPWD work-quality procedures](https://www.cpwd.gov.in/Publication/SOP_for_CPWD_Works_Manual_2022_13122022.pdf)

### Recommended lifecycle

1. **Enquiry and qualification:** record source, client, property location, expected scope, budget range, decision-makers, timing, next follow-up and win/loss reason. Avoid collecting personal data without an operational purpose.
2. **Site assessment and brief:** record dimensions/condition, photos, client requirements, constraints, inclusions/exclusions and who verified them.
3. **Proposal and commercial baseline:** define service scope, exclusions, design deliverables, BOQ/material assumptions, price, schedule, payment milestones, validity and client acceptance evidence. No GST fields in V1.
4. **Project handoff:** create a project owner, team, baseline schedule, client communication plan, budget, procurement plan, risk/decision list and site readiness checks from the accepted proposal.
5. **Design:** maintain room/area-wise packages, revision numbers, comments and status. Record the client approval against a specific revision and preserve the previous one. Internal staff can record evidence of the client's decision without requiring a client portal in V1.
6. **Procurement and execution:** link each material/work order to an approved design/BOQ line, supplier, quote, promised date, project and responsible person. Record receiving/installation evidence, site progress, snags and inspection outcomes.
7. **Change control:** price/schedule/scope changes create a proposal/change order and wait for approval before the related work or purchase is treated as approved. Update the forecast only after approval.
8. **Finance:** link client invoices and receipts to milestones; supplier bills and payments to a vendor and project; daily expenses to the actual date and cash/bank account. Separate commitments from paid amounts.
9. **Closeout:** internal inspection, client walkthrough, punch/defect list, completion acknowledgement, final billing/collection, handover documents, warranties/manuals and aftercare owner.

## Finance and diary design

The diary should model a real cash book and a review trail:

- Opening cash is the prior verified closing balance; each inflow identifies its source (client receipt, bank withdrawal, owner contribution, loan or other) and account.
- Each expense has amount, category, payee, project if relevant, payment account, note/evidence, **date incurred**, **date entered**, creator and any reviewer.
- The app computes expected closing cash from the opening balance and posted movements. A staff member records physically counted cash; any variance requires a reason and remains visible.
- Late entry changes the historical incurred date but never overwrites the entered timestamp or audit history.
- A phone photograph can be attached to a draft. If OCR is added, it only suggests fields; a person confirms them before posting.
- Household/personal spending is labelled **Personal Expense** and excluded from business/project operating expenses, supplier costs and margin. If company cash paid it, the cash account still decreases; the accountant should decide whether the corresponding accounting account is proprietor drawings, receivable/reimbursement or another treatment. The software must not silently call it a deductible business cost.
- Do not count the same supplier cost twice as a diary expense and a vendor bill. Link the source and use one canonical cost posting.

For project finance, show contract baseline, approved changes, invoiced, collected, supplier/expense commitments, paid costs, projected cost-to-complete, expected final margin, cash required by date and outstanding client receivables. Label forecast vs actual and include source/as-of details. “Project balance” should be defined explicitly; a low-budget-headroom alert is different from low cash in a project-specific bank/cash account.

### Invoice pricing and project profitability

Treat the user's changing invoice price as a deliberate, item-level selling-price decision. Each invoice particular should allow an authorized user to set the amount/quantity/rate for that invoice, independently from what the item cost the business or any usual markup. When it differs from the approved quotation or contract baseline, record the variance, actor and reason without silently rewriting the approved baseline. The customer PDF contains selling prices only.

Use three complementary views under **Finance → Profitability**:

1. **Invoice Margin:** draft preview and issued snapshot by line and invoice, using the cost specifically allocated to that billed work. Show gross profit in rupees, gross margin % and markup % as separate measures. Example: ₹3,00,000 direct plywood cost sold/billed at ₹3,35,000 yields ₹35,000 gross profit, 10.45% gross margin (profit ÷ sale) and 11.67% markup (profit ÷ cost). ₹2,00,000 labour cost sold/billed at ₹2,50,000 yields ₹50,000 gross profit, 20% gross margin and 25% markup. These are direct-cost calculations before overheads and other expenses.
2. **Project Profitability:** cumulative approved contract value plus authorized changes, billed and collected totals, actual/paid and committed cost by work package, unallocated costs, forecast cost-to-complete and expected final profit/margin. This answers whether the whole job is making money even when each progress invoice has a different margin.
3. **Company P&L:** accounting-period revenue and expenses from balanced journal entries, according to an accounting policy confirmed by the CA. Keep it distinct from invoice billing, cash collections and management margin forecasts.

The data model needs cost codes/work packages (e.g. plywood/materials, labour, electrical, transport and overhead) on project expense and vendor-bill detail, plus an auditable allocation of cost to one or more invoice lines. An allocation cannot exceed or duplicate the source cost. A subsequent progress invoice must use only the share of cost attributable to that billed work; never subtract the entire project cost from every invoice. If cost detail is missing, report margin as unknown/incomplete, not as if cost were zero. Keep estimated cost, approved commitment, paid/actual cost and invoice allocation visibly separate.

This distinction also matters for formal accounts: an invoice or advance can be issued/received before the related work is performed. MCA's Ind AS 115 uses satisfaction and measured progress of performance obligations to determine revenue over time where that standard applies; ICAI material on construction contracts similarly distinguishes progress billings/advances from work performed. These are reference principles, not an assertion that Ind AS 115 applies to this sole proprietorship. Have the CA determine the applicable treatment; until then, call the in-app project view a management profitability report, not the statutory/company P&L. [MCA, Ind AS 115](https://www.mca.gov.in/Ministry/pdf/IndAS115_2020_10112020.pdf), [ICAI, AS 7 construction contracts](https://indasaccess.icai.org/Volume-III/AS/asb.html?a=109)

## What matters for scaling over 1–2 years

These are recommendations based on the stated growth goal, not claims about the company's current performance.

### Put into V1

- **One accountable owner per lead and project**, plus task assignment/deadlines and escalation for overdue work.
- **Repeatable project templates** for residential scopes: stages, milestone checklists, design and handover gates. Keep them configurable rather than imposing one universal schedule.
- **Portfolio capacity view:** active projects by stage and project owner; upcoming starts/handovers; overdue client decisions; staff workload.
- **Margin and cash visibility:** baseline vs approved revisions, committed vs actual spend, projected cost-to-complete, invoice due dates and cash forecast.
- **Line-level pricing discipline:** editable selling rates with a reasoned variance against the approved quote, cost work packages, invoice-line margin previews, and cumulative project profitability. This directly addresses the user's observed variation between material/labour costs and client invoice prices.
- **Vendor/service directory and project-specific procurement:** supplier quotes, agreed price, promised date, receiving/site confirmation and bill/payment evidence.
- **Approval and change history:** designs, BOQ, price/scope, expenses and payment decisions have actor, timestamp and linked evidence.
- **Action center:** next task, pending client approval, bill/expense approval, late collection, site snag, material delay or budget-headroom warning, with a link to its source and snooze/acknowledge control.
- **Phone-first operational flows:** capture/upload quickly on site, save drafts offline if the network is poor where feasible, and provide large controls and camera upload. Keep full desktop reporting and bulk editing.
- **Privacy-by-design:** private authenticated project files, least-privilege access, audit trail, data minimization and retention/deletion policy for contacts, home images and floorplans.

### Defer unless an actual workflow demands it

- GST registration, GST computation and GST invoice templates (user-directed, after six months).
- Foreign currencies, ECB exchange-rate automation and Czech/Russian regional defaults.
- Full warehouse inventory, manufacturing/MRP, barcode stock or multi-branch operations unless the studio actually holds and tracks stock centrally.
- Odoo/ERP integration, broad AI analytics, multi-tenant SaaS, public signup, complex marketing campaigns and a client portal.
- Email/SMS/WhatsApp/push notifications until an approved delivery provider, sender, consent and message templates exist. Start with reliable in-app alerts.

This keeps V1 focused: project materials are tracked against the job and received at site; do not build a stock-control system just because an ERP template has one.

## Proposed differentiator: Studio Leakage Radar

After the accounting and project records are dependable, show a daily exception list for:

- Approved design/BOQ mismatch or unapproved work request.
- Project baseline or approved budget approaching depletion after open commitments.
- Material promised date that threatens a milestone.
- Client design/selection decision overdue and blocking procurement.
- Actual/committed cost growing faster than approved revenue or projected margin.
- Milestone overdue, repeated rework/snags or handover defects unresolved.
- Invoice overdue or cash forecast below planned supplier/staff commitments.

Each alert should expose its calculation and source records, offer an owner and next step, and wait for a human decision. It should not automatically change a quote, approve spending or message a client.

## Growth and Indian business context

Deloitte's September 2026 India home-and-household release projects the broad home/household market to expand 1.6× by 2030 and interior services from US$4B to US$8B over 2025–2030. It also points to increasing expectations around quality and overall experience. These estimates are broad market context and do not predict Dream Space Studios' addressable market or revenue. [Deloitte India report release](https://www.deloitte.com/in/en/about/press-room/indias-home-and-household-market-to-reach-us-260-billion-by-2030-deloitte-report.html)

India's current Udyam portal lists the post-1-April-2025 thresholds: micro up to ₹2.5 crore investment and ₹10 crore turnover; small up to ₹25 crore investment and ₹100 crore turnover; medium up to ₹125 crore investment and ₹500 crore turnover. The thresholds are composite; they are statutory classifications, not a promise that a company at a given revenue is operationally mature. Treat “upper mid-size” as the owner's business goal, and define it through revenue, margin, concurrent project capacity, quality and manager-led operations. Ask a qualified adviser whether Udyam registration or later structure changes are useful; do not bake classification decisions into MARK IV. [Official Udyam portal](https://udyamregistration.gov.in/)

For eligible Udyam-registered micro/small suppliers, MSME Samadhaan provides a route for delayed-payment matters. The operational takeaway is to preserve work orders, accepted-work evidence, invoice issue/due dates and collection follow-up. Confirm eligibility and use with a qualified adviser. [MSME Samadhaan](https://ramp.msme.gov.in/ramp/RAMP-initiative/msme-samadhaan/msme-samadhaan)

The Digital Personal Data Protection Act and 2025 Rules have phased commencement. Because the studio handles private-home photos, addresses and client/staff contact details, privacy controls should be designed in from V1 rather than postponed until enforcement dates. Avoid legal conclusions in software; have applicability and notice/retention choices reviewed. [DPDP Act, India Code](https://www.indiacode.nic.in/bitstream/123456789/22037/1/a2023-22.pdf), [DPDP Rules, MeitY](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025)

## What is already in MARK IV and what is not

Existing foundations documented in `BUILD_STATUS.md` include password login without public signup, lead conversion, quote/BOQ revision snapshots, projects and milestones, linked invoices/receipts, project expenses and vendor bills, cash/bank movement, dashboard foundations, and a read-only Google Sheets audit/crosswalk. These are building blocks, not a completed end-to-end operating system.

The current master Sheet already has operational sections for daily expenses/cash, personal spending, projects, vendors, quotations, invoices, receipts and project statements. The schema and mapping should preserve those useful surfaces while resolving the flagged cash-account mapping, isolating test/sample rows and defining field ownership. The workbook's presence does not mean the app is synced to it.

Still outstanding include a verified profile creation fix on staging, India-default cleanup, server-enforced combined permission model, double-entry accounting and formal statements, daily diary/photo workflow, private design gallery and client approval history, change orders, two-way Sheet sync, configurable cross-module alerts, full mobile usability and end-to-end financial reconciliation. Do not claim these are finished until verified.

## Questions that change the design

### Confirmed sufficiently to design V1

- Project count and size vary, from small furniture/repair-only work through several concurrent residential projects and a long-running large contract. The portfolio and reporting model must not assume one standard project size, duration, or active-project count.
- The current client relationship model is flexible. Record planned advance and progress milestones per project, show internal expected/due/missed status, and avoid blocking project work or sending automatic client demands. Start with a few projects and measure adoption as the owner works toward broader use over two years.
- Personal household spending sometimes comes from company cash. Record the movement in the main diary as Personal Expense and provide a separate personal-spending ledger view. It reduces cash but is excluded from business/project expense and margin.
- User identifies Impressive Creators as the current legal name for documents and wants it selectable for invoices and quotations. Prior invoice/quotation sheets also use Dream Address Studio. Keep document issuer identity separate from MARK IV's workspace brand and preserve the ability to choose an issuer on each output.

### Still to verify before live configuration or official financial outputs

- Confirm official business/trade name spelling, proprietor's legal name as it should appear, business address, contact and signatory/bank details from owner-approved records or the CA. The old sheets show document wording but do not prove registration or legal status.
- Confirm whether daily cash-in includes only client receipts or also owner contributions, transfers, loans and other inflows. V1 should offer distinct source types and avoid automatically calling every inflow revenue.
- Confirm warehouse/material ownership and the people who enter/review daily diary records; these affect stock needs and segregation of duties.
- Confirm whether the user's large-project estimate is ₹1.5–2 crore and how its approved scope/budget is divided into phases and time periods before importing it as a project baseline.

Still useful before finalizing operations settings:

- Is the work mostly full-home renovation, new apartment fit-out, kitchens/wardrobes/furnishing, or a mix?
- Do materials arrive directly at site, or does the business store/issue them from a warehouse?
- Are cash expenses recorded by site supervisors, the owner, or an accounts person; who checks the diary against physical cash/bank statements?
- Does the studio already have Udyam registration and a CA/bookkeeper who will review chart-of-account and proprietor-personal transaction treatment?
