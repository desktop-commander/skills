---
name: 10times-trade-events-export
description: Creates 10times tradeshow inventories and schema-mapped Excel/CSV exports using public sitemap URLs and local WHR/10times dumps. Use when the user asks to compile trade fair lists from 10times, map events to a fixed 16-column schema, refresh a 10times export, or build a public event URL inventory without bypassing anti-bot protections.
version: 1.1.0
---

# 10times Trade Events Export

Create repeatable 10times tradeshow exports in two layers:

1. **Public inventory** of base event URLs from 10times sitemap
2. **Rich schema export** from existing local WHR/10times-aligned dumps when available

This skill is designed for workflows where the user wants a large event list but the public website applies aggressive anti-bot protections.

## When to Use

Use this skill when the task includes any of these patterns:

- building a list of trade fairs from `10times.com`
- exporting 10times events into Excel or CSV
- mapping events into a fixed customer schema
- refreshing a previously collected WHR/10times dataset
- creating a public sitemap inventory without scraping blocked detail pages
- explaining why a full public scrape cannot be completed without a valid logged-in session

## Core Rule

Do **not** bypass Cloudflare, captcha, account walls, or rate limits.

If public detail pages are blocked, switch to the safe fallback:

- collect **public sitemap URLs**
- reuse **existing local exports** for rich fields
- clearly separate what is public-only inventory vs. what is enriched local data

## Inputs to Confirm

Before running the workflow, confirm or locate:

1. the target workspace
2. the target schema columns, if different from the standard 16-column layout
3. whether a local WHR/10times CSV and raw JSON dump already exist
4. whether the user wants:
   - public inventory only, or
   - public inventory + schema-mapped enriched export

If the user already has a known schema in the workspace, read it and mirror it instead of guessing.

## Schema Disambiguation

Do not assume the standard 16-column trade-event layout when the user asks for
`wydarzenia konkurencyjne`, `wydarzenia konkurencji`, or says to follow the
local "żelazne reguły". First look for a provided schema example, screenshot,
or local workbook and mirror its header exactly.

For competitor event tables built from external directories, the expected
"żelazne reguły" event schema is:

`Nazwa; Rok; Data od; Data do; Nr edycji; Typ; Miasto; Kraj; Kontynent; Organizator; Ośrodek; Zakres; Profil wystawcy; Profil odwiedzającego; Wystawcy łącznie; Wystawcy z PL; Wystawcy z kraju wydarzenia; Częstotliwość; Prelegenci; Link`

Use the PWE panel API schema only when the source is explicitly the PWE
competitor panel or the user asks for a panel-compatible import/export:

`id; nazwa; status; liczba_wystawcow; liczba_kontaktow; www; kraj; miasto; kontynent; csv_kontakty_url; opis; kraj_kod; relevance_score; geo_kategoria; zrodlo_odkrycia; dodane_recznie; archived_at; pt_relevance_score; ma_csv_kontaktow; panel_url`

For either schema, Excel is the primary deliverable and CSV is only a raw
backup. Leave fields blank when the source does not verify them; do not invent
edition numbers, organizers, Polish exhibitor counts, contact counts, panel
URLs, profiles, or speakers.

## Polish Formatting Rules

For competitor event tables following the local "zelazne reguly", always apply
these base collaboration rules before final delivery:

- When the user asks for a website-verified event name, split naming into two
  columns at the start of the workbook:
  `Nazwa skrócona`; `Nazwa własna`; then the remaining event columns.
- `Nazwa skrócona` is the short/catalog name and must be uppercase.
- `Nazwa własna` must preserve the exact event name found on the event website
  from the row `Link` when public HTML exposes one. Prefer JSON-LD Event
  `name`, visible `h1`, Open Graph/Twitter title, and HTML title, in that
  order. Do not force uppercase or translate `Nazwa własna`; it is evidence
  copied from the website. If the page is blocked or no reliable title is
  found, fall back to the catalog name and mark that in the audit CSV.
- `Miasto`, `Kraj`, and `Kontynent` must be in Polish and uppercase.
- Use Polish country and continent names. Do not leave mixed values such as
  `USA - UNITED STATES` or `UK - UNITED KINGDOM`; use `STANY ZJEDNOCZONE` and
  `WIELKA BRYTANIA`.
- Translate event scope and profile fields into Polish:
  `Zakres`, `Profil wystawcy`, and `Profil odwiedzajacego`.
- Treat city names as proper names: translate known Polish exonyms such as
  `BEIJING -> PEKIN`, `LONDON -> LONDYN`, `VIENNA -> WIEDEN`, but do not let
  machine translation create forms like `MIASTO KANSAS`; preserve the proper
  city name in uppercase when there is no standard Polish exonym.
- If automatic translation is used for long descriptions, cache translations,
  post-process obvious navigation labels (`VISITORS`, `EXHIBITORS`,
  `CONFERENCE`, `SHOWCASE`), and run a final sample check.

## Competitor Event Website Enrichment

When a competitor-event directory provides only base fields and the user asks
to fill the remaining columns from each event website, run a separate
enrichment pass before final delivery:

- Design the enrichment as resumable checkpoints from the start. For large
  tables, write one JSONL checkpoint row immediately after each event row is
  processed. Re-running the script must skip completed rows and continue from
  missing rows, not restart from the first row.
- Visit the event `Link` for every row and, when useful, a small number of
  same-domain public pages such as about/overview, exhibitor, visitor, speaker,
  agenda, and organizer pages.
- Before final delivery, validate each event `Link`: it must return public
  HTML and the page content must match the event name tokens. If the original
  link is dead or mismatched, try safe URL variants and then public search for
  the official event site. Correct the `Link` in the workbook only when the
  replacement is verified; otherwise keep the original and put the row in a
  separate manual-review file.
- Use only public HTML. Do not bypass login, captcha, Cloudflare, HTTP 403/404,
  non-HTML responses, or obvious rate limits.
- Keep provenance columns out of the main workbook. If a new business column is
  required, such as `Nazwa skrócona` before `Nazwa własna`, add it deliberately
  and document the schema change in the report.
- Save a separate sources/audit CSV with row number, field, value, source URL,
  extraction method, confidence, and source snippet.
- Fill only fields verified by the page text or structured data. Leave Polish
  exhibitor counts and country-of-event exhibitor counts blank unless a public
  exhibitor source explicitly supports those counts.
- Be conservative with heuristics: avoid copying navigation, registration,
  cookie, sponsor, calendar, or generic marketing fragments into profile fields.
- State clearly in the report whether `robots.txt` was checked or skipped; do
  not claim robots compliance for a fast public-HTML pass that did not check it.

## Standard Workflow

1. **Inspect existing files first**
   - Look for prior exports, schema examples, and checkpoint files in the workspace.
   - Prefer Desktop Commander file tools for discovery and inspection.

2. **Use public sources safely**
   - Read `https://10times.com/robots.txt` when needed.
   - Prefer the public sitemap index `https://10times.com/xml/sitemaps.xml`.
   - Use browser-like request headers for sitemap fetches when plain requests receive `403`.
   - Filter sitemap results down to **base event URLs** only, meaning exactly one path segment after the domain.
   - Exclude nested paths such as `/exhibitors`, `/visitors`, `/alternatives`, or `/speakers`.

3. **Avoid blocked detail scraping**
   - If direct event-page HTTP fetches return Cloudflare blocks or similar protection pages, stop public detail scraping.
   - Do not try to evade the block.
   - Explain the limitation briefly and continue with the fallback workflow.

4. **Build the outputs**
   - Always produce a public inventory when the sitemap is reachable.
   - If local WHR/10times dump files exist, build the rich schema export from them.
   - Use [export_10times_public.py](scripts/export_10times_public.py) for large-scale generation.

5. **Validate the output**
   - Check row counts.
   - Preview the first few rows of both CSV files.
   - Confirm that Excel files were written successfully.
   - Add a short text report describing what was generated and what was skipped.

6. **Explain the result clearly**
   - Distinguish between:
     - full public URL inventory
     - schema-mapped enriched dataset from local dumps
   - State when detail enrichment was skipped because of Cloudflare or expired cookies.

## Default Output Set

Unless the user asks otherwise, generate these files inside the chosen workspace `output/10times_public_global/` folder:

- `10times_public_inventory_base_urls.csv`
- `10times_public_inventory_base_urls.xlsx`
- `10times_schema_from_local_whr_*.csv`
- `10times_schema_from_local_whr_*.xlsx`
- `10times_public_export_report.txt`

## Scripts

- [export_10times_public.py](scripts/export_10times_public.py) - Builds the public sitemap inventory and, when local WHR files are present, creates a schema-mapped enriched export in CSV/XLSX.

## References

- [Schema Mapping](references/schema-mapping.md) - Standard 16-column target schema and mapping rules.
- [Source Strategy and Limits](references/source-strategy.md) - Safe collection strategy, fallbacks, and common failure modes.

## Execution Notes

For big exports, a local Python process is appropriate because:

- sitemap files contain tens of thousands of URLs
- Excel writing is more reliable in Python than in chat-only transformations
- the workflow benefits from deterministic row counting and file generation

Before starting Python, explain briefly why a local script is needed.

## Success Criteria

Consider the run successful when:

- the inventory file exists and has non-zero rows
- schema export exists when local WHR inputs are available
- the report explains data provenance and limitations
- the first rows match the expected schema
