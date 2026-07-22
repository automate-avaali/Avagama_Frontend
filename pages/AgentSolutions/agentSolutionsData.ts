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

// Placeholders illustrate that this hub is designed to grow. Mark them
// 'coming-soon' — the gallery renders them disabled until they go live.
const comingSoon: AgentSolution[] = [
  {
    id: 'invoice-processing-agent',
    name: 'Invoice Processing Agent',
    tagline: 'Extract, match and approve supplier invoices.',
    description:
      'Reads supplier invoices, performs 2- and 3-way matching against POs and goods receipts, and routes exceptions for approval.',
    category: 'Accounts Payable',
    emoji: '🧾',
    accentFrom: '#6366f1',
    accentTo: '#a26da8',
    status: 'coming-soon',
    agentUrl: '',
    embeddable: false,
    whatItDoes: [],
    steps: [],
    samples: [],
  },
  {
    id: 'vendor-onboarding-agent',
    name: 'Vendor Onboarding Agent',
    tagline: 'Onboard and verify new vendors in minutes.',
    description:
      'Collects vendor documents, validates tax and banking details, screens against compliance lists and creates the vendor master record.',
    category: 'Procurement',
    emoji: '🤝',
    accentFrom: '#0ea5e9',
    accentTo: '#6fcbbd',
    status: 'coming-soon',
    agentUrl: '',
    embeddable: false,
    whatItDoes: [],
    steps: [],
    samples: [],
  },
];

export const AGENT_SOLUTIONS: AgentSolution[] = [salesOrderAgent, materialAgent, ...comingSoon];

export const getAgentSolution = (id: string): AgentSolution | undefined =>
  AGENT_SOLUTIONS.find(a => a.id === id);
