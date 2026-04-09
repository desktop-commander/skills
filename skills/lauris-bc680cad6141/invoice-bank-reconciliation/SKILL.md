---
name: invoice-bank-reconciliation
description: Compare a bank statement against a month invoice folder, identify payments that have no matching invoice file, search adjacent month folders for carry-over invoices, and keep a confirmed missing list updated. This skill should be used when reconciling monthly expenses from a PDF statement against invoice PDFs.
version: 1.0.0
---

# Invoice Bank Reconciliation

Reconcile a bank statement PDF against invoice files in a target month folder. Extract payment lines from the statement, match them against invoice and receipt files already present, search adjacent month folders when a charge posting date crosses month boundaries, and return a clean missing-invoice list that can be refined as the user confirms exceptions.

## When to Use

Use this skill when:
- A bank statement PDF must be compared against a folder of invoice PDFs for a month.
- The goal is to find payments that appear in the statement but do not have a corresponding invoice or receipt file in the target folder.
- The user may want likely carry-over invoices checked in the previous or next month folder.
- The user may want matching files copied into the target month folder after they are found elsewhere.

## Workflow

### Step 1: Gather inputs

Collect:
- Absolute path to the bank statement PDF.
- Absolute path to the target month invoice folder.
- If obvious from the folder structure, identify adjacent month folders that may contain carry-over invoices.

### Step 2: Read the statement

Use Desktop Commander file tools first. If direct PDF reading is incomplete, explain the fallback and use a local shell extractor only if needed. Extract enough text to capture:
- Posting date
- Transaction amount
- Merchant or payee name
- Any invoice, receipt, order, or payment reference
- Original card purchase date when shown

Ignore non-invoice items such as taxes, bank fees, refunds, internal transfers, payroll, pension contributions, and similar non-vendor lines unless the user explicitly wants them included.

### Step 3: Inventory the target folder

List the files in the target month folder. Focus on PDFs first, but also inspect image files if they may contain invoices. Build a working set of likely matches from:
- Filenames
- Extracted invoice numbers
- Receipt numbers
- Merchant names
- Amounts and dates when available

For matching heuristics and carry-over rules, read [Matching Rules](references/matching-rules.md).

### Step 4: Match statement payments to files

Compare statement payments against the target folder using strongest evidence first:
1. Exact invoice or receipt number
2. Exact merchant name plus amount
3. Merchant name plus date proximity
4. Supporting evidence from receipt text or order identifiers

Treat invoices and receipts as valid supporting documents unless the user says to require only invoices.

### Step 5: Build the missing list

Produce a concise list of statement payments that have no confirmed matching file in the target folder. For each item include:
- Statement posting date
- Amount
- Merchant or payee
- Key reference if present
- Short note if the item is only a possible miss

### Step 6: Search adjacent month folders when needed

If a statement line shows a purchase date in a different month, or if the merchant follows a repeated billing pattern, search the adjacent month folder before treating the item as missing. If a matching file is found elsewhere, report the exact file path and explain why it matches.

### Step 7: Refine the list with user feedback

If the user says to remove an item from the missing list, update the list without re-adding it unless new evidence appears. Keep the latest confirmed missing list concise and current.

### Step 8: Copy confirmed carry-over files when requested

If the user wants a matching file copied from another month into the target month folder, state the source and destination clearly, then perform the copy while preserving the original.

## Output

Return:
- The current missing-invoice list
- Any likely-but-unconfirmed items called out separately
- Any files found in adjacent month folders that resolve prior missing items

When useful, offer to create a CSV or checklist in the output folder after the reconciliation is complete.
