Avagama AI - blueprint sample inputs (fictitious data)

[Playground template] Invoice Processing  (invoice-processing/)
  - Full match - auto-posts: Invoice = PO = goods receipt and below 1,00,000 - posted automatically without approval.
  - High-value invoice - needs approval: Clean 3-way match but 2,50,000 >= 1,00,000 - pauses on AP Manager Approval; approve to post.
  - Invoice without a PO - exception: No PO reference - AP Exception Review; never posted automatically.
  - Price above the PO - needs approval: Unit price 275 vs PO 250 (10%, tolerance 2%) - AP Manager Approval with the variance shown.
  - Goods not received yet - exception: No goods receipt (GRN) - AP Exception Review; rejecting holds the invoice (not posted).
[Playground template] PO & Contract Match  (po-contract-match/)
  - Compliant PO - auto: Price and terms match the contract - finalised automatically.
  - Price deviation - escalates to buyer: Deviation score >= 20 - the buyer approval step is required.
  - Payment-terms change, low deviation - edge case: Score below 20 - auto path, but the match result should call out Net 45 vs Net 30.
[Playground template] Vendor Query Bot  (vendor-query-bot/)
  - Invoice status query: Classified as invoice status; reply quotes the invoice and its processing state.
  - Payment timing query: Classified as payment timing; reply gives the expected release window.
  - Bank-detail change request - edge case: Should NOT confirm a change by email; reply asks for the verified change-request process.
[Playground template] Material Identification from Vendor Delivery Notes  (material-identification-from-vendor-delivery-notes/)
  - Steel components - all known: Rod, bearing and bolt all found in the material master - GRN drafted automatically.
  - Hydraulic parts - one unknown: Filter found (MAT-410077); the gear pump R-HP220 is not in the master - Master Data Review, no code invented.
  - Ambiguous descriptions - edge case: No part numbers to match - every line goes to Master Data Review for manual mapping.
[Playground template] Extracting PO and Creation of Sales Order  (extracting-po-and-creation-of-sales-order/)
  - Standard order - auto: Both SKUs in the catalog and below 5,00,000 - sales order created automatically.
  - Large order - credit review: Order value >= 5,00,000 - pauses on Credit Review; approve to create the order.
  - Unknown SKU - exception: SKU-ZETA is not in the catalog - Order Exception Review; no order is created until it is resolved.
[Playground template] TDS  (tds/)
  - Professional fees (194J): Section 194J(b), professional services, at 10% (TDS 20,000); Tax Approval before posting.
  - Office rent paid by a company (194-I): Section 194-I(b), rent of land/building, at 10% (TDS 50,000); Tax Approval before posting.
  - Contractor without PAN - edge case: No PAN - section 206AA higher rate of 20% (TDS 70,000) and Tax Exception Review.
[Playground template] Master Data Management Cleansing  (master-data-management-cleansing/)
  - Likely duplicates - steward review: Duplicate risk >= 30 - data steward approval required before update.
  - Minor cleanup - auto: Duplicate risk below 30 - cleansed and updated automatically.
  - Customer addresses - edge case: Risk 35 - steward review; enrichment should standardise city/state names.
[Orchestration blueprint] Standard AP invoice reconciliation  (orch-ap-invoice-reconciliation/)
  - Invoice matches PO: Totals and GST check out against PO-7781 - routed to auto-approve.
  - High value with a GST mismatch: Stated GST differs from the calculated amount - routed to human review / exception.
[Orchestration blueprint] Employee onboarding with manager sign-off  (orch-employee-onboarding/)
  - Complete joiner form: All documents present - pauses for manager sign-off, then provisions.
  - Missing KYC document: Aadhaar missing - flagged; provisioning should not proceed without sign-off.
[Orchestration blueprint] Compliance PDF audit  (orch-compliance-pdf-audit/)
  - Vendor agreement with deviations: Uncapped liability, one-sided IP and no cure period flagged as high severity.
  - Compliant mutual NDA: Clauses match policy - low risk summary with no high-severity findings.
