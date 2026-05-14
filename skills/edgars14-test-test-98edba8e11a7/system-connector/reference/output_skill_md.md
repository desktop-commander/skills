# Output: SKILL.md + helper script + tests

This is the default output type for REST/HTTP integrations and most non-destructive system connectors. Markdown alone is not enough. The deliverable is a small deterministic bundle:

```text
<system-name>/
├── SKILL.md
├── <system>.py
├── catalog.json
├── test_<system>.py
├── .env.example
├── .gitignore
└── glossary.md          # only when language/domain translation is useful
```

Credential handling for this output type is canonical in [`credentials.md`](credentials.md). Do not restate path logic or privacy rules elsewhere. The short version:

- The bundled `.env.example` stays in the installed skill bundle.
- `python3 <helper>.py setup` copies it to the real credential path.
- The real credential path is derived from the active host root, not hardcoded to any one host.

## What goes in each file

### `SKILL.md`

Keep this file tight and operational:

1. Frontmatter with concrete trigger phrases.
2. One-paragraph introduction.
3. A "files in this skill" table.
4. Setup section that points to `python3 <helper>.py where` / `setup` / `test` and links back to `credentials.md` for the canonical privacy and hand-off rules.
5. Decision flow for choosing the right read command.
6. Cookbook examples using the helper, not raw `curl`.
7. DSL/format reference copied from real research.
8. Troubleshooting.
9. Anti-patterns.
10. Source-of-truth links.

### `<system>.py`

Specialize `templates/api_helper.py`. The default scope is all non-destructive operations. Writes are not shipped by default.

The template must scaffold these read-side commands:

- `setup`
- `where`
- `test`
- `services` or equivalent top-level discovery
- `discover`
- `catalog`
- `schema <entity>`
- `entity get <Class> <id>`
- `entity list <Class>`
- `entity query <Class> --filter "..."`
- `raw <METHOD> <path>`

Optional convenience aliases are fine, but they must wrap the generic read surface rather than replace it.

Constraints:

- Stdlib only.
- JSON to stdout, errors to stderr, non-zero exit on failure.
- No credential values in output.
- Resolve the real credential path structurally from the active host root, with `CONNECTOR_ENV_PATH` as the only override.
- Refuse data calls when the real `.env` is missing.
- Store session-like state next to the real `.env`, not in the artifact directory.
- Surface server error bodies instead of swallowing them.

### `catalog.json`

This is the deterministic seed catalog. Include only researched facts:

```jsonc
{
  "_note": "Seed catalog from <docs URL>. Run `python3 <system>.py discover` to confirm against your deployment.",
  "seeded_from": "<docs URL>",
  "auth": {
    "default_method": "<exact header format>",
    "advertised_alternative": "<other supported auth methods>",
    "session_cookie": "<cookie name if any>",
    "anonymous_endpoints": ["..."]
  },
  "url_patterns": {
    "<operation_name>": "<HTTP method> <path pattern>"
  },
  "filter_dsl": {
    "operators": ["..."],
    "logical": ["and", "or"],
    "form_constraint": "<if any>",
    "text_quoting": "<escape rules>",
    "url_encoding": "<rules>"
  },
  "classes": {
    "<EntityName>": {
      "kind": "entity|list",
      "description_en": "...",
      "description_<localelang>": "...",
      "list_class": "<paired list>",
      "common_fields": {
        "<field>": "<meaning>"
      }
    }
  }
}
```

If you did not research a class or field, leave it out.

### `test_<system>.py`

Tests must pass with zero network access. Required coverage:

- Base URL normalization
- Auth header construction
- Installed-path credential resolution
- `CONNECTOR_ENV_PATH` override
- Missing-credential error points at the resolved real path
- Query/filter encoding for the real DSL
- Parsing of a real fixture payload
- Round-trip parse/serialize coverage for any structured body type the helper emits or accepts

If writes are added later, extend the tests with explicit write-body coverage at that time.

### `.env.example`

Mandatory. Build from `templates/.env.example`.

Rules:

- Keep it generic and vendor-neutral until specialized.
- Do not hardcode a host root in the comments.
- Do not tell the user to copy it manually; `setup` does that.
- Required variables appear first, optional below an `# --- Optional ---` divider.
- Empty values only. No placeholder secrets.
- If a value is a file path, the path goes in `.env`, not the file contents.
- Request the least privilege needed for the shipped read-only surface. Do not ask for write scopes unless write commands are explicitly being added.

### `.gitignore`

Mandatory. Build from `templates/.gitignore`.

Its job is only to prevent accidental commits if someone drops `.env`, `.session`, or discovery outputs into the artifact folder during development. The real credential rules still live in `credentials.md`.

### `glossary.md`

Include it when field names, class names, or business terms need translation or local explanation. Skip it otherwise.

## Non-API integrations

When there is no public API, keep the same bundle shape and the same credential/config rules:

- CSV/Excel import-export
- Local database read
- Desktop UI automation as a last resort

Even when the values are paths or machine-specific settings rather than secrets, the real user-edited file still follows the same `setup`/`where`/`test` flow from `credentials.md`.

## Anti-patterns

- Putting raw `curl` in `SKILL.md` as the primary interface
- Shipping only class-specific commands and no generic read surface
- Hardcoding a host root
- Asking for broader-than-read scopes in the default `.env.example`
- Skipping tests because the helper seems simple
- Leaving TODOs or placeholder catalog entries in the artifact

## Hand-off

Follow [`credentials.md`](credentials.md) for the canonical hand-off.

This output type adds two small requirements:

- Link the installed skill bundle path so the user can inspect what was created.
- Show one concrete read-only first-run command they can ask the assistant to run after `test` passes.
