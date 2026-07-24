// ---------------------------------------------------------------------------
// Agent Solutions registry
// ---------------------------------------------------------------------------
// This is the single source of truth for the "Agent Solutions" hub. To add a
// new agent solution, append an entry to AGENT_SOLUTIONS below — the gallery
// card and the detail/tutorial page are both generated from this data.
// No other files need to change to add a new agent.
// ---------------------------------------------------------------------------

export interface POLine {
  code: string;
  description: string;
  qty: number;
  unitPrice: number;
  /** Optional note flagged against this line, e.g. an unknown material code. */
  flag?: string;
}

export interface SamplePO {
  company: string;
  poNumber: string;
  poDate: string;
  deliveryDate: string;
  customerCode: string;
  gst: string;
  paymentTerms: string;
  currency: string;
  shippingAddress: string;
  lines: POLine[];
}

export type ScenarioTone = 'success' | 'info' | 'warning' | 'danger';

export interface SampleFile {
  id: string;
  /** Human label shown on the scenario card. */
  label: string;
  /** One-line outcome the user should expect after running this file. */
  expectation: string;
  tone: ScenarioTone;
  /** Optional downloadable file placed under /public/<dir>/. Omit for info-only scenarios. */
  fileName?: string;
  /** Optional structured PO for an inline preview + "copy details". Omit for info-only scenarios. */
  po?: SamplePO;
  /** Longer explanation of why this scenario behaves the way it does. */
  notes: string[];
}

export interface TutorialStep {
  title: string;
  description: string;
  tip?: string;
  /** 'upload' turns this walkthrough step into an interactive upload gate that
   *  offers the sample inputs and auto-advances once the user picks a file. */
  action?: 'upload';
  /** Which on-page element the spotlight coach-mark should highlight for this step. */
  anchor?: 'agent' | 'usecases';
}

export interface SampleInput {
  id: string;
  /** Label shown on the download chip. */
  label: string;
  /** Public URL path to the downloadable file, e.g. /sample-pos/sample_po.pdf */
  url: string;
  /** Short hint about what this sample demonstrates. */
  description: string;
  /** The one case the tutorial showcases first (badge + listed on top). */
  recommended?: boolean;
}

export interface AgentSolution {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  emoji: string;
  accentFrom: string;
  accentTo: string;
  /** Text/icon color to render ON TOP of the accent gradient. Default white;
   *  pastel accents set this to a dark tone so text stays readable. */
  accentText?: string;
  status: 'live' | 'coming-soon';
  /** External agent URL (env-overridable per agent). */
  agentUrl: string;
  /** Whether the agent can be shown inline in an <iframe> (no X-Frame-Options/SSO). */
  embeddable: boolean;
  whatItDoes: string[];
  steps: TutorialStep[];
  samples: SampleFile[];
  /** id of the sample the guided walkthrough features as the "solid valid case". */
  featuredSampleId?: string;
  /** Downloadable input files the walkthrough offers on its 'upload' step. */
  sampleInputs?: SampleInput[];
  /** Heading for the sample-inputs panel, e.g. "Sample delivery notes to try". */
  sampleInputsTitle?: string;
}

// Env-overridable so the URL can be swapped for a production / embed-friendly
// host later without touching code (mirrors VITE_PUBLIC_APP_URL pattern).
const SALES_ORDER_AGENT_URL =
  ((import.meta as any).env?.VITE_SALES_ORDER_AGENT_URL as string) ||
  'https://sales-order-agent-3v8hz9lhe-avaali.vercel.app/';

const salesOrderAgent: AgentSolution = {
  id: 'sales-order-agent',
  name: 'Sales Order Agent',
  tagline: 'Turn purchase orders into validated sales orders — automatically.',
  description:
    'Upload a customer purchase order and the agent extracts every field, validates the customer and materials against master data, checks stock availability, and drafts a clean sales order — flagging anything that needs a human.',
  category: 'Order Management',
  emoji: '📦',
  // Bright pastel teal → sky (light, enterprise). Dark teal accentText keeps labels readable.
  accentFrom: '#5eead4',
  accentTo: '#7dd3fc',
  accentText: '#115e59',
  status: 'live',
  agentUrl: SALES_ORDER_AGENT_URL,
  // The Vercel preview URL is behind SSO and sends X-Frame-Options: DENY, so it
  // cannot be embedded yet. Flip to true once a public, frame-friendly URL exists.
  embeddable: false,
  featuredSampleId: 'success',
  whatItDoes: [
    'Reads a purchase order PDF and extracts header + line-item data',
    'Validates the customer code, GST number and materials against master data',
    'Checks stock availability and flags partial or out-of-stock lines',
    'Drafts a sales order and surfaces validation errors for review',
  ],
  steps: [
    {
      title: 'Launch the agent',
      description:
        'Open the Sales Order Agent using the embedded window on this page. If it does not appear, click "Open in new tab" — it opens in a fresh tab so you can follow these steps side by side.',
      tip: 'Keep this tutorial open in one window and the agent in another for the smoothest run-through.',
    },
    {
      title: 'Download a sample purchase order',
      description:
        'Pick one of the four sample scenarios below and download its PO (or copy the details). Start with the "Clean order" sample to see the happy path end to end.',
      tip: 'Each sample is engineered to trigger a specific outcome — success, partial stock, or validation errors.',
    },
    {
      title: 'Upload the PO to the agent',
      description:
        'Grab one of the sample purchase orders below (start with the recommended clean order), drop it into this step to continue — then upload the same PDF in the agent window so it extracts the header and line items.',
      tip: 'Watch the extraction step — every field on the PDF should map to a structured value.',
      action: 'upload',
    },
    {
      title: 'Review extraction & validation',
      description:
        'Check what the agent pulled out: customer, delivery date, materials and quantities. It then validates each against master data and highlights mismatches.',
    },
    {
      title: 'Read the outcome',
      description:
        'Compare the result to the "Expected outcome" noted on the sample card — a drafted sales order, a partial-stock warning, or a list of validation errors.',
      tip: 'Run all four samples to see how the agent handles clean, partial, and error cases.',
    },
  ],
  samples: [
    {
      id: 'success',
      label: 'Clean order (happy path)',
      expectation: 'Validates fully and drafts a complete sales order.',
      tone: 'success',
      fileName: 'sample_po_success.pdf',
      notes: [
        'Known customer (CUST1004) and all valid material codes.',
        'Sufficient stock on every line — no exceptions raised.',
        'Best first run to see the end-to-end happy path.',
      ],
      po: {
        company: 'Bharat Traders LLP',
        poNumber: 'PO-2026-00112',
        poDate: '2026-07-08',
        deliveryDate: '2026-08-14',
        customerCode: 'CUST1004',
        gst: '24AAGCB5678K1ZP',
        paymentTerms: 'Net 30',
        currency: 'INR',
        shippingAddress: 'Godown 3, Naroda Industrial Estate, Ahmedabad, Gujarat 382330',
        lines: [
          { code: 'MAT-1002', description: 'Steel Rod 16mm TMT', qty: 800, unitPrice: 320.0 },
          { code: 'MAT-1006', description: 'Plywood Sheet 8x4 18mm', qty: 100, unitPrice: 1899.0 },
          { code: 'MAT-1009', description: 'Paint Emulsion White 20L', qty: 50, unitPrice: 3100.0 },
        ],
      },
    },
    {
      id: 'standard',
      label: 'Standard multi-line order',
      expectation: 'Processes a larger four-line order the same way.',
      tone: 'info',
      fileName: 'sample_po.pdf',
      notes: [
        'Known customer (CUST1001) with four valid material lines.',
        'Good for seeing extraction across a longer line-item table.',
      ],
      po: {
        company: 'ABC Retail Pvt Ltd',
        poNumber: 'PO-2026-00047',
        poDate: '2026-07-05',
        deliveryDate: '2026-07-25',
        customerCode: 'CUST1001',
        gst: '29ABCDE1234F1Z5',
        paymentTerms: 'Net 30',
        currency: 'INR',
        shippingAddress: 'Warehouse 7, Logistics Park, Whitefield, Bengaluru, Karnataka 560066',
        lines: [
          { code: 'MAT-1001', description: 'Steel Rod 12mm TMT', qty: 500, unitPrice: 250.0 },
          { code: 'MAT-1003', description: 'Cement OPC 53 Grade 50kg', qty: 200, unitPrice: 410.0 },
          { code: 'MAT-1008', description: 'LED Panel Light 24W', qty: 150, unitPrice: 420.0 },
          { code: 'MAT-1010', description: 'Door Hinge SS 5 inch', qty: 1000, unitPrice: 95.0 },
        ],
      },
    },
    {
      id: 'partial-stock',
      label: 'Partial stock',
      expectation: 'Flags lines that cannot be fully fulfilled from stock.',
      tone: 'warning',
      fileName: 'sample_po_partial_stock.pdf',
      notes: [
        'Known customer (CUST1007) with valid materials…',
        '…but at least one line exceeds available stock.',
        'Shows how the agent proposes a partial fulfilment / backorder.',
      ],
      po: {
        company: 'Metro Superstores Pvt Ltd',
        poNumber: 'PO-2026-00133',
        poDate: '2026-07-09',
        deliveryDate: '2026-08-05',
        customerCode: 'CUST1007',
        gst: '07AABCM2468N1Z8',
        paymentTerms: 'Net 30',
        currency: 'INR',
        shippingAddress: 'Distribution Centre, Sector 80, Noida, Uttar Pradesh 201305',
        lines: [
          { code: 'MAT-1007', description: 'Ceramic Floor Tile 600x600', qty: 120, unitPrice: 540.0 },
          { code: 'MAT-1005', description: 'Copper Wire 2.5sqmm 90m Coil', qty: 60, unitPrice: 1250.0 },
          { code: 'MAT-1010', description: 'Door Hinge SS 5 inch', qty: 400, unitPrice: 95.0 },
        ],
      },
    },
    {
      id: 'validation-errors',
      label: 'Validation errors',
      expectation: 'Rejects with a clear list of validation problems.',
      tone: 'danger',
      fileName: 'sample_po_validation_errors.pdf',
      notes: [
        'Unknown customer code (CUST9999) and a mismatched company name ("ABC Retale").',
        'Unknown material code (MAT-9999) that is not in master data.',
        'Suspicious GST number — the agent should surface each error, not draft an order.',
      ],
      po: {
        company: 'ABC Retale Private Ltd',
        poNumber: 'PO-2026-00150',
        poDate: '2026-07-10',
        deliveryDate: '2026-08-20',
        customerCode: 'CUST9999',
        gst: '33ZZZZZ0000Z1Z9',
        paymentTerms: 'Net 30',
        currency: 'INR',
        shippingAddress: 'Plot 9, Ambattur Industrial Estate, Chennai, Tamil Nadu 600058',
        lines: [
          { code: 'MAT-1001', description: 'Steel Rod 12mm TMT', qty: 300, unitPrice: 250.0 },
          { code: 'MAT-9999', description: 'Galvanised Sheet 2mm', qty: 150, unitPrice: 600.0, flag: 'Unknown material code' },
        ],
      },
    },
  ],
  sampleInputsTitle: 'Sample purchase orders to try',
  sampleInputs: [
    {
      id: 'success',
      label: 'Clean order — Bharat Traders (PO-2026-00112)',
      url: '/sample-pos/sample_po_success.pdf',
      description: 'The happy path — valid customer and materials, drafts a complete sales order.',
      recommended: true,
    },
    {
      id: 'standard',
      label: 'Standard order — ABC Retail (PO-2026-00047)',
      url: '/sample-pos/sample_po.pdf',
      description: 'Four-line order, all valid — good for seeing extraction on a longer table.',
    },
    {
      id: 'partial-stock',
      label: 'Partial stock — Metro Superstores (PO-2026-00133)',
      url: '/sample-pos/sample_po_partial_stock.pdf',
      description: 'Valid order where at least one line exceeds stock — expect a backorder proposal.',
    },
    {
      id: 'validation-errors',
      label: 'Validation errors — ABC Retale (PO-2026-00150)',
      url: '/sample-pos/sample_po_validation_errors.pdf',
      description: 'Unknown customer (CUST9999) and material (MAT-9999) — expect a rejection with errors.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Material Identification Agent (Delivery Note -> SAP Article)
// ---------------------------------------------------------------------------
const MATERIAL_AGENT_URL =
  ((import.meta as any).env?.VITE_MATERIAL_AGENT_URL as string) ||
  'https://material-agent.onrender.com/';

const materialAgent: AgentSolution = {
  id: 'material-identification-agent',
  name: 'Material Identification Agent',
  tagline: 'Read a vendor delivery note and match every line to the right SAP article.',
  description:
    'Reads a vendor delivery note, matches each line against PO data and the SAP Article Master (~19,000 items) through a three-tier waterfall, and returns the correct SAP article with an explainable confidence score.',
  category: 'Material Master · SAP',
  emoji: '🔎',
  // Soft pink → lavender pastel (bright/light). Dark accentText keeps labels readable.
  accentFrom: '#f9a8d4',
  accentTo: '#c4b5fd',
  accentText: '#7c2d92',
  status: 'live',
  agentUrl: MATERIAL_AGENT_URL,
  // Render deployment sends no X-Frame-Options / frame-ancestors — embeds inline.
  embeddable: true,
  featuredSampleId: 'exact-po-match',
  whatItDoes: [
    'Reads a vendor delivery note and extracts each line item',
    'Matches every line against PO data and the SAP Article Master (~19,000 items)',
    'Uses a three-tier waterfall — Vendor Mapping → PO Match → semantic retrieval',
    'Returns the best SAP article with an explainable confidence score and source',
  ],
  steps: [
    {
      title: 'Open the agent',
      description:
        'The Material Identification Agent loads in the window on this page. It runs even fully offline (BM25 mode), so it is always ready.',
      tip: 'This agent embeds directly here — no new tab needed.',
    },
    {
      title: 'Load a delivery note',
      description:
        'Download one of the sample delivery notes below, then drop it into this step to continue. Upload the same file into the agent window to have it parse every line item.',
      tip: 'A delivery note has free-text vendor descriptions — exactly what the agent is built to resolve.',
      action: 'upload',
    },
    {
      title: 'Watch the three-tier match run',
      description:
        'Each line flows Vendor Mapping → PO Match → Article Master. The first tier that resolves a line wins, so the expensive semantic search only runs on what is left.',
    },
    {
      title: 'Review each line’s result',
      description:
        'For every line you get the chosen SAP article, a confidence score (0–100), the source (PO or Master) and alternative candidates — all explainable.',
      tip: 'Look for the "source" tag: PO Match is authoritative; Master means semantic retrieval decided it.',
    },
    {
      title: 'Understand the confidence routing',
      description:
        '≥95% auto-matches, 80–94% is flagged "needs review", and <80% goes to manual review — with UOM and colour/variant guards that block wrong-variant matches.',
      tip: 'The variant guard is what stops "red diced capsicum" being mapped to a green article.',
      anchor: 'usecases',
    },
  ],
  samples: [
    {
      id: 'exact-po-match',
      label: 'Exact PO match (authoritative)',
      expectation: 'Line matches a PO item exactly → SAP article taken straight from the PO at 100%.',
      tone: 'success',
      notes: [
        'Example: "YUM Granola Original 1KG" matched PO item 240 exactly.',
        'PO number + short text match → article taken from the PO, no search needed.',
        'This is the solid, happy-path case the walkthrough features.',
      ],
    },
    {
      id: 'colour-variant-guard',
      label: 'Colour / variant guard',
      expectation: 'A wrong-variant best match is blocked and re-routed to the Article Master.',
      tone: 'warning',
      notes: [
        'Example: "SB Capsicum Red Diced" best-matched a GREEN PO line.',
        'The variant guard blocks it and sends it to the Article Master — not the wrong colour.',
        'Shows the business-rule gates protecting against confident-but-wrong matches.',
      ],
    },
    {
      id: 'semantic-auto-match',
      label: 'Semantic auto-match',
      expectation: 'Not on the PO → hybrid retrieval ranks ~60 candidates and auto-maps the top one.',
      tone: 'info',
      notes: [
        'BM25 + optional embeddings, fused by Reciprocal Rank Fusion, score ~60 of 19,413 rows.',
        'A ≥95% top match auto-maps; the score breakdown (keyword, semantic, category, pack, brand) is explainable.',
      ],
    },
    {
      id: 'manual-review',
      label: 'Low confidence → manual review',
      expectation: 'No strong candidate (<80%) → the line is routed to a human, never guessed.',
      tone: 'danger',
      notes: [
        'When nothing clears the threshold, the agent declines to auto-map.',
        'The line is flagged for manual review with its best candidates listed for a quick human decision.',
      ],
    },
  ],
  sampleInputsTitle: 'Sample delivery notes to try',
  sampleInputs: [
    {
      id: 'gilmours',
      label: 'Gilmours (15 lines)',
      url: '/sample-delivery-notes/gilmours-delivery-note.json',
      description: 'The showcase note — includes the exact PO match (YUM Granola) and the red/green capsicum variant-guard case.',
      recommended: true,
    },
    {
      id: 'fresh-connection',
      label: 'Fresh Connection (27 lines)',
      url: '/sample-delivery-notes/fresh-connection-delivery-note.json',
      description: 'Fresh produce with no product codes — a good test of semantic retrieval on free-text descriptions.',
    },
    {
      id: 'bakery',
      label: 'Bakery order (9 lines)',
      url: '/sample-delivery-notes/bakery-delivery-note.json',
      description: 'Short bakery note with vendor-style codes and messy quantities.',
    },
  ],
};

// ---------------------------------------------------------------------------
// Contract Clause Review Agent (Contract -> Clause extraction -> Risk -> Routing)
// ---------------------------------------------------------------------------
const CONTRACT_AGENT_URL =
  ((import.meta as any).env?.VITE_CONTRACT_AGENT_URL as string) ||
  'https://contractreviewfrontend.vercel.app/';

const contractReviewAgent: AgentSolution = {
  id: 'contract-clause-review-agent',
  name: 'Contract Clause Review Agent',
  tagline: 'Extract every clause, compare against approved templates, and flag risk.',
  description:
    'Upload a contract and a multi-agent pipeline extracts every clause verbatim, classifies the contract type, compares all 15 clause categories against the approved template, scores each clause Low/Medium/High, and routes the contract for auto-approval or legal review.',
  category: 'Legal · Contract Review',
  emoji: '📜',
  // Bright blue → violet pastel (light, on-brand with the deck). Dark indigo text stays readable.
  accentFrom: '#93c5fd',
  accentTo: '#c4b5fd',
  accentText: '#3730a3',
  status: 'live',
  agentUrl: CONTRACT_AGENT_URL,
  // Public production Vercel app (not an SSO preview) — embeds inline.
  embeddable: true,
  featuredSampleId: 'high-risk',
  whatItDoes: [
    'Extracts every clause verbatim from an uploaded contract, with its heading',
    'Classifies the contract type and retrieves the matching approved clause template',
    'Compares all 15 clause categories — Standard / Modified / Missing / Additional',
    'Scores each clause Low / Medium / High and routes for auto-approval or legal review',
  ],
  steps: [
    {
      title: 'Open the agent',
      description:
        'The Contract Clause Review Agent loads in the window on this page. It walks a contract through ingestion, clause comparison, risk scoring and routing.',
      tip: 'This agent embeds directly here — no new tab needed.',
    },
    {
      title: 'Pick a sample contract',
      description:
        'Download one of the sample contracts below (start with the recommended high-risk vendor agreement), drop it into this step to continue, then upload the same file into the agent window to start the review.',
      tip: 'Each sample is written to land in a specific risk band — high, medium or low.',
      action: 'upload',
    },
    {
      title: 'Watch the pipeline run',
      description:
        'The agents run in sequence: ingest and clean the text, extract every clause, classify the contract type, retrieve the approved template, then compare all 15 clause categories.',
    },
    {
      title: 'Review the clause-by-clause results',
      description:
        'Each of the 15 clause categories is marked Standard, Modified, Missing or Additional, with a Low/Medium/High risk rating, a plain-English rationale and suggested wording.',
      tip: 'Look for the flagged clauses — those are the deviations from the approved template.',
    },
    {
      title: 'Read the routing decision',
      description:
        'The overall risk decides routing: Low or Medium is auto-approved (Medium is flagged for awareness), while High is assigned to the legal team. A Word report with the full redline is available to download.',
      tip: 'The high-risk vendor agreement should come back "High → Legal Team" with several clauses flagged.',
      anchor: 'usecases',
    },
  ],
  samples: [
    {
      id: 'high-risk',
      label: 'High risk — vendor agreement',
      expectation: 'Uncapped liability, one-sided IP and no cure period → High risk, assigned to Legal.',
      tone: 'danger',
      notes: [
        'Liability is uncapped and indemnification is one-sided in the Client\'s favour.',
        'All Vendor IP (including pre-existing) is assigned away, and termination has no cure period.',
        'Critical deviations like these route the contract to a human legal reviewer.',
      ],
    },
    {
      id: 'medium-risk',
      label: 'Medium risk — modified SaaS terms',
      expectation: 'Extended payment terms and a missing audit-rights clause → Medium, auto-approved & flagged.',
      tone: 'warning',
      notes: [
        'Payment terms are stretched to Net 60 and the renewal notice is shorter than standard.',
        'The audit-rights clause is missing entirely rather than modified.',
        'Modified or missing clauses are auto-approved but flagged for awareness with a recommendation.',
      ],
    },
    {
      id: 'low-risk',
      label: 'Low risk — clean NDA',
      expectation: 'A standard mutual NDA matching the template → Low risk, auto-approved.',
      tone: 'success',
      notes: [
        'Mutual confidentiality, capped liability, cure period and symmetric assignment.',
        'No clause deviates materially from the approved template.',
        'The happy path — the agent auto-approves and files it as low risk.',
      ],
    },
  ],
  sampleInputsTitle: 'Sample contracts to try',
  sampleInputs: [
    {
      id: 'high-risk',
      label: 'High-risk vendor agreement',
      url: '/sample-contracts/high-risk-vendor-agreement.txt',
      description: 'Uncapped liability, one-sided IP assignment and no cure period — expect a High-risk verdict routed to legal.',
      recommended: true,
    },
    {
      id: 'medium-risk',
      label: 'SaaS agreement (modified terms)',
      url: '/sample-contracts/saas-agreement.txt',
      description: 'Mostly standard but with Net 60 payment terms and a missing audit-rights clause — expect Medium risk.',
    },
    {
      id: 'low-risk',
      label: 'Clean mutual NDA',
      url: '/sample-contracts/nda-agreement.txt',
      description: 'A standard NDA matching the approved template — expect Low risk, auto-approved.',
    },
  ],
};

// ---------------------------------------------------------------------------
// AP Automation Agent (Invoice -> AI extraction -> 3-way match -> decision)
// ---------------------------------------------------------------------------
const AP_AGENT_URL =
  ((import.meta as any).env?.VITE_AP_AGENT_URL as string) ||
  'https://ap-desktop-agent.vercel.app/';

const apAutomationAgent: AgentSolution = {
  id: 'ap-automation-agent',
  name: 'AP Automation Agent',
  tagline: 'Read invoices, run a 3-way match, and auto-clear or route for review.',
  description:
    'Reads a vendor invoice, extracts every field with AI, fetches the matching Purchase Order and Goods Receipt Note from the ERP, reconciles them across a deterministic 3-way match, and either auto-approves the invoice or routes it to a human reviewer with the exact reason.',
  category: 'Accounts Payable · 3-Way Match',
  emoji: '🧾',
  // Bright amber → peach (gold) pastel — a warm, finance-y accent distinct from the
  // other agents. Dark amber text keeps labels readable on the gradient.
  accentFrom: '#fcd34d',
  accentTo: '#fdba74',
  accentText: '#92400e',
  status: 'live',
  agentUrl: AP_AGENT_URL,
  // Public production Vercel dashboard (no SSO) — embeds inline.
  embeddable: true,
  featuredSampleId: 'perfect-match',
  whatItDoes: [
    'Reads a vendor invoice PDF and extracts header, line items, tax, freight and terms',
    'Fetches the matching Purchase Order and Goods Receipt Note from the ERP by PO number',
    'Runs a deterministic 3-way match across 12 checks — price, quantity, UOM, tax, terms…',
    'Auto-approves clean invoices; routes anything outside tolerance to a reviewer with the reason',
  ],
  steps: [
    {
      title: 'Open the agent',
      description:
        'The AP Automation dashboard loads in the window on this page — an Overview with live counts (Pending Review, Processed, Approved, Exceptions) and the tabs that hold each invoice’s full detail.',
      tip: 'It embeds directly here — the dashboard is public, no login needed.',
    },
    {
      title: 'Choose how to start',
      description:
        'There are two ways in. “Process Mailbox” drains every invoice waiting in the ToBeProcessed folder in one go. “Upload Invoice Manually” lets you drop a single invoice PDF — no mailbox required.',
      tip: 'For this walkthrough, Upload Invoice Manually is the fastest — grab a sample below.',
    },
    {
      title: 'Pick a sample invoice and upload it',
      description:
        'Download one of the sample invoices below (start with the recommended perfect-match one), drop it into this step to continue, then upload the same PDF using “Upload Invoice Manually” in the agent.',
      tip: 'Each sample is engineered to trigger a specific outcome — auto-approve, price variance, or vendor mismatch.',
      action: 'upload',
    },
    {
      title: 'Watch AI extraction & ERP lookup',
      description:
        'The agent parses the PDF into structured fields, then uses the PO number printed on the invoice to pull the matching Purchase Order and Goods Receipt Note from the ERP automatically — no PO/GRN attachments needed.',
    },
    {
      title: 'Follow the 3-way match',
      description:
        'Invoice, PO and GRN are reconciled across 12 deterministic checks — PO validity, GRN, quantity, unit price & UOM (within 2%), tax, freight/discount, payment terms, line maths, and duplicate detection.',
      tip: 'No fuzzy matching — every gate is a firm rule, and a failure prints the exact reason.',
    },
    {
      title: 'Read the decision & review',
      description:
        'Clean invoices within tolerance auto-approve and file to Processed. Anything outside tolerance routes to the review portal — open the secure link and Approve, Reject, or Request Clarification. A missing PO or unreadable invoice becomes an Exception with the reason to fix.',
      tip: 'Confirm the outcome on the dashboard tabs: Processed, Approved, or Exceptions.',
      anchor: 'usecases',
    },
  ],
  samples: [
    {
      id: 'perfect-match',
      label: 'S01 · Perfect match → auto-approve',
      expectation: 'All fields match the PO exactly, zero variance → cleared automatically.',
      tone: 'success',
      notes: [
        'ABC Industries, PO-S01-001 — two lines, prices and quantities match the PO.',
        'All 12 checks pass within tolerance.',
        'The happy path — cleared automatically and filed to Processed.',
      ],
    },
    {
      id: 'price-variance',
      label: 'S03 · Price variance → review',
      expectation: 'Invoice price about 8.5% above the PO — exceeds the 2% tolerance → manual review.',
      tone: 'warning',
      notes: [
        'Global Supplies Co, PO-S03-001 — Office Chair billed at $163 vs $150 on the PO.',
        'The unit-price gate fails, so the invoice is paused for a human decision.',
        'Shows the reviewer portal: Approve / Reject / Request Clarification.',
      ],
    },
    {
      id: 'vendor-mismatch',
      label: 'S11 · Vendor mismatch → review',
      expectation: 'Invoice vendor differs from the PO vendor → manual review.',
      tone: 'danger',
      notes: [
        'Invoice raised by Delta Office Supplies, but PO-S11-001 was issued to Sigma Stationery Works.',
        'The vendor/header gate fails — payment cannot proceed until it is resolved.',
        'Routed to a reviewer with the exact discrepancy noted.',
      ],
    },
  ],
  sampleInputsTitle: 'Sample invoices to try',
  sampleInputs: [
    {
      id: 'perfect-match',
      label: 'S01 — Perfect match (ABC Industries)',
      url: '/sample-invoices/invoice-s01-perfect-match.pdf',
      description: 'All fields match the PO exactly — expect an automatic approval.',
      recommended: true,
    },
    {
      id: 'price-variance',
      label: 'S03 — Price variance (Global Supplies Co)',
      url: '/sample-invoices/invoice-s03-price-variance.pdf',
      description: 'Unit price about 8.5% above the PO — expect a manual-review route.',
    },
    {
      id: 'vendor-mismatch',
      label: 'S11 — Vendor mismatch (Delta Office Supplies)',
      url: '/sample-invoices/invoice-s11-vendor-mismatch.pdf',
      description: 'Invoice vendor differs from the PO vendor — expect a manual-review route.',
    },
  ],
};

export const AGENT_SOLUTIONS: AgentSolution[] = [salesOrderAgent, materialAgent, contractReviewAgent, apAutomationAgent];

export const getAgentSolution = (id: string): AgentSolution | undefined =>
  AGENT_SOLUTIONS.find(a => a.id === id);
