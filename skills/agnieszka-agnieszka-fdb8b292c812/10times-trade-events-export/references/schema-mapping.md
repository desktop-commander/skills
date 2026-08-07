# Schema Mapping

This workflow uses a standard 16-column export schema:

1. `PELNA NAZWA WYDARZENIA`
2. `DATA OD`
3. `DATA DO`
4. `EDYCJE`
5. `MIASTO`
6. `KRAJ`
7. `KONTYNENT`
8. `ORGANIZATOR NAZWA SKROCONA`
9. `ORGANIZATOR PELNA NAZWA`
10. `WYSTAWCY`
11. `WYSTAWCY Z POLSKI`
12. `WYSTAWCY Z KRAJU WYDARZENIA`
13. `WWW`
14. `ZAKRES BRANZOWY TARGOW`
15. `PROFIL WYSTAWCY`
16. `PROFIL ODWIEDZAJACEGO`

## Default Mapping Rules

- `DATA OD`, `DATA DO`: convert ISO `YYYY-MM-DD` to `DD.MM.YYYY`
- `KONTYNENT`: infer from region/country when available
- `ORGANIZATOR NAZWA SKROCONA`: derive from organizer name by trimming long suffixes when possible
- `WWW`: prefer official event website, then fallback to 10times event URL if necessary
- `ZAKRES BRANZOWY TARGOW`: combine categories, tags, and concise description
- `PROFIL WYSTAWCY`: combine tags and categories
- `PROFIL ODWIEDZAJACEGO`: combine audience designations and top audience countries
- Preserve empty strings for unverifiable values instead of inventing content
- When only the public sitemap is available, keep the inventory as a separate output instead of pretending it is a rich schema export

## Empty-by-Default Columns

Leave these blank unless verified data exists:

- `WYSTAWCY Z POLSKI`
- `WYSTAWCY Z KRAJU WYDARZENIA`

Do not invent counts.

## Local WHR Inputs Used by Default

When present in the workspace, the script expects:

- `output/whr_global_tradeshows_june2026_merged_latest.csv`
- `output/whr_global_tradeshows_june2026_merged_latest_raw.json`

These defaults can be overridden with script arguments.
