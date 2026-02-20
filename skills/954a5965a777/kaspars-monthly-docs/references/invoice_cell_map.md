# Invoice template cell map (File Nr.2)

Template file: `Rēķins gatavs (file Nr.2).xlsx`
Sheet example: `October, 2025`

These are useful if you choose to update the XLSX before exporting (optional).

## Header

- **Invoice number**: `G2`
- **Invoice date**: `F3` and `G3` (merged/repeated)

## Main line item

Service description is duplicated across merged cells.

- **Description**: `A29:D29` and `A30:D30`
- **Quantity**: `E29` and `E30`
- **Price**: `F29` and `F30`
- **Line total**: `G29` and `G30`

## Totals

- **Total (primary)**: `G31` and `G32`
- **Total (repeated near bottom)**: `G35` and `G36`

## Notes
- The template repeats many values for formatting/printing; update all the cells above for consistency.
- If the template structure changes, re-check ranges around rows 26–36.
