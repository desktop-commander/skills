# Matching Rules

Use this reference when reconciling statement payments to invoice files.

## Strong Matches

Treat an item as matched when one of these is true:
- The statement includes an invoice or receipt number that matches a file or extracted PDF text.
- The merchant name and amount match clearly.
- A receipt file ties directly to the same invoice number and payment date.
- A bank-transfer reference matches the invoice number or contract reference in a file.

## Moderate Matches

Treat an item as probably matched, but call it out if confidence is not high:
- Merchant name matches and the amount is close after currency conversion.
- Statement posting date differs from purchase date, but the underlying card purchase date lines up with the invoice date.
- Filename lacks the merchant name, but extracted PDF text confirms it.

## Carry-Over Month Rule

Search the adjacent month folder before marking an item missing when:
- The statement shows a card purchase date from the prior month.
- The invoice issue date is at the end of the prior month, but the bank posting date is in the target month.
- The merchant is a recurring service that bills near month-end.

## Exclusions

Exclude these by default unless the user asks otherwise:
- Taxes and state payments
- Bank fees and commissions
- Internal transfers and payroll
- Pension contributions
- Refunds and charge reversals
- Non-vendor government items

## User-Driven Refinement

If the user removes an item from the missing list, treat that as a confirmed exclusion for the current reconciliation. Keep the live list updated and avoid repeating removed items.

## Copy Rule

When a matching file is found in another month folder and the user asks to copy it, preserve the original and copy the same filename into the target folder unless the user requests a rename.
