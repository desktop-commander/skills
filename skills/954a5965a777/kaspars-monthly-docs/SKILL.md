---
name: kaspars-monthly-docs
description: Generates three monthly PDFs (summary, invoice, protocol) from Kaspars Excel input sheet and templates, with optional signature embedding.
version: 1.0.0
---

# Kaspars Monthly Docs

This skill produces a consistent monthly document pack from Kaspars’ spreadsheet workflow:
1) **Monthly summary PDF** (mirrors File Nr.1)
2) **Invoice PDF** (based on “Rēķins gatavs (file Nr.2).xlsx” fields)
3) **Protocol PDF** (matching “Documents Nr3. - protokols” wording, with optional embedded signature)

## When to Use

This skill should be used when the monthly amounts in **File Nr.1 input.xlsx** were updated and a fresh set of PDFs is needed for the same month.

## Inputs (expected files)

- `File Nr.1 input.xlsx` (monthly amounts)
- `Rēķins gatavs (file Nr.2).xlsx` (invoice data/template)
- `Documents Nr3. - protokols.pdf` (protocol wording reference)
- Optional: signature image (PNG) to embed into the protocol

## Outputs

Generate 3 PDFs into a chosen output folder (default: a sibling `output/` folder next to the inputs):
- `kaspars_summary_YYYY-MM.pdf`
- `kaspars_invoice_YYYY-MM.pdf`
- `kaspars_protocol_YYYY-MM.pdf`

## Workflow

### 1) Locate the working folder and identify the month

1. List files in the user-provided folder and confirm the 3 source files exist.
2. Read the sheet list of `File Nr.1 input.xlsx` and select the target sheet:
   - Prefer an explicit user choice, OR
   - Use the *last* sheet in the workbook.
3. Parse month/year from the sheet name (example: `October, 2025`).
4. Compute:
   - `month_start` = 1st day of the month
   - `month_end` = last day of the month
   - `month_label` = “October 2025”

### 2) Read amounts from File Nr.1 and compute the total

1. Read the target month sheet (range at least `A1:C50`).
2. Treat **column C** as the amount column.
3. Collect line items:
   - A row with a label in column A/B + a numeric value in column C is a line item.
   - If a row has description text but no amount, ignore it.
4. Compute `total_eur` as the sum of all numeric amounts.

### 3) Build the Summary PDF

Create a clean table with line items and total. Then call `write_pdf()`.

### 4) Build the Invoice PDF

1. Read invoice header values from File Nr.2 (invoice number, payer details if needed).
2. Use the month label to set the service month (e.g., “Services in October, 2025…”).
3. Use `total_eur` for price/total.
4. Call `write_pdf()` to generate a polished invoice-style PDF.

For spreadsheet cell mappings, read: [invoice_cell_map.md](references/invoice_cell_map.md).

### 5) Build the Protocol PDF (+ optional signature)

1. Use protocol wording from the provided template PDF.
   - For standardized wording, also see: [protocol_template.md](references/protocol_template.md).
2. Update:
   - top date = `month_end`
   - period = `month_start` – `month_end`
   - amount line = `total_eur` formatted as `X,XXX.00 EUR`
3. Signature embedding:
   - If the user provides a PNG path, embed it using HTML in the PDF markdown:
     `<img src="/absolute/path/to/signature.png" width="200" />`
   - If no signature is provided, leave a signature line and note that signature is missing.

### 6) Confirm with the user

Show the 3 output file paths and ask for confirmation:
- Is the month correct?
- Is the total correct?
- Does the protocol need a signature image and where should it come from?

## References

- [invoice_cell_map.md](references/invoice_cell_map.md) - Invoice spreadsheet cell mappings (File Nr.2).
- [protocol_template.md](references/protocol_template.md) - Protocol wording template.

## Scripts

- [extract_docx_images.py](scripts/extract_docx_images.py) - Helper for extracting images from DOCX templates (use when needed).
