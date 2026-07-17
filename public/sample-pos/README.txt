Sample Purchase Orders — Sales Order Agent tutorial
====================================================

The "Agent Solutions" tutorial (/agent-solutions/sales-order-agent) offers
these four PDFs as downloadable samples. Drop the exact files here so the
"Download PDF" buttons work:

  sample_po_success.pdf            -> Clean order (happy path)   — Bharat Traders LLP, PO-2026-00112
  sample_po.pdf                    -> Standard multi-line order  — ABC Retail Pvt Ltd, PO-2026-00047
  sample_po_partial_stock.pdf      -> Partial stock              — Metro Superstores Pvt Ltd, PO-2026-00133
  sample_po_validation_errors.pdf  -> Validation errors          — ABC Retale Private Ltd, PO-2026-00150

Notes
-----
- File names must match exactly (case-sensitive on the server).
- They are served statically from /sample-pos/<file>.pdf.
- Until the PDFs are added, the tutorial still works: each scenario card shows
  an inline preview of the PO and a "Copy details" button, so users can paste
  the order into the agent even without the PDF download.
