# Credentials handling — canonical reference

This is the single source of truth for how every `system-connector` artifact handles credentials and user-specific connection values. `SKILL.md`, `output_skill_md.md`, `output_mcp_config.md`, `output_mcp_server.md`, the helper template, and any future output type must inherit their credential behavior from here instead of restating it in parallel.

## Where the `.env` file lives

For helper-based outputs, credentials live at:

`<active-host-root>/connectors/<system>/.env`

Definitions:

- `<system>` is the connector slug from the helper's `SYSTEM_NAME` constant. Use only `[a-z0-9-]`.
- `<active-host-root>` is the root directory of the host currently running the skill. The helper derives it structurally from its own install path by finding the nearest ancestor named `skills` and using that directory's parent.

Examples:

- Helper at `~/.desktop-commander/skills/visma-horizon/horizon.py`
  Credentials at `~/.desktop-commander/connectors/visma-horizon/.env`
- Helper at `~/.codex/skills/stripe-reader/stripe_reader.py`
  Credentials at `~/.codex/connectors/stripe-reader/.env`
- Helper at `~/.claude/skills/hubspot-reader/hubspot_reader.py`
  Credentials at `~/.claude/connectors/hubspot-reader/.env`

The helper must not guess between multiple host roots on disk. It uses the host it is installed under, and only that host. If it cannot infer an active host root and `CONNECTOR_ENV_PATH` is not set, it fails clearly and tells the assistant to install it under `<active-host-root>/skills/<system>/` or set the override for tests/CI/dev.

`CONNECTOR_ENV_PATH` is the only supported override. Use it for tests, CI, or unusual development setups. It is not part of the normal end-user flow.

Why this location:

- *Skills are shareable, credentials are not.* The skill bundle may be copied, versioned, or distributed; secrets must stay in user-owned storage.
- *Host-aligned.* The connector's data lives beside the host that runs it, so the user has one predictable place to look.
- *No cross-host ambiguity.* Installing under Desktop Commander means using Desktop Commander’s connector directory, not Claude’s or Codex’s.
- *Easy cleanup.* Deleting `<active-host-root>/connectors/<system>/` removes the connector’s private state without touching the skill bundle.

## What the helper must do

The helper script must:

1. Resolve the credential path from its installed location plus `SYSTEM_NAME`, not from a hardcoded host name.
2. Provide `setup`, `where`, and `test` subcommands.
3. Create the real `.env` by copying the bundled `.env.example` only when the file does not already exist.
4. Report the resolved path without ever revealing the file contents.
5. Refuse data-fetching operations when required values are missing, and point at the exact resolved path.
6. Persist session-like state next to `.env` when needed, not in the artifact directory.

The helper must NOT:

- Look for `.env` in the artifact directory.
- Default to `~/.claude/`, `~/.desktop-commander/`, or any other specific host root.
- Ask the user to export permanent shell env vars as the main setup path.
- Overwrite an existing `.env`.
- Read the system name from `.env`.

## The setup flow — what the assistant actually does

The user is non-technical. The assistant handles file creation; the user only fills in values.

1. Run `python3 <helper>.py setup`.
2. Read the JSON result and capture the resolved absolute path.
3. Optionally run `python3 <helper>.py where` if you need to confirm the path before linking it.
4. Emit a clickable absolute-path markdown file link to the real `.env` file, for example `[.env](/Users/me/.desktop-commander/connectors/<system>/.env)`.
5. In the same response, reproduce the per-variable guidance inline using the template in "Surfacing variable acquisition — the inline-handoff template" below.
6. After the user saves their values, run `python3 <helper>.py test` and work only from the structured diagnostic output.

The user should never be told to `mkdir`, `cp`, or move files around manually as part of the normal setup.

For re-runs:

- If the real `.env` already exists and is complete, skip `setup` and run `test`.
- If the real `.env` exists but required values are blank, re-emit the link and tell the user which variables are missing. Do not show existing values.
- If the user rotates credentials, they edit the same file in place.

The `where` subcommand reports the resolved path and whether the file exists, without revealing contents:

```json
{
  "ok": true,
  "system": "<system>",
  "env_path": "/Users/me/.desktop-commander/connectors/<system>/.env",
  "exists": true
}
```

Use that output to build the file link and any host-specific gitignore suggestion.

## MCP config snippet exception

`reference/output_mcp_config.md` is the one credential-storage exception.

For that output type:

- There is no connector-local `.env`.
- Placeholder credential values live in the host application's MCP config file, in the snippet's `env` block.
- The assistant still never asks the user to paste secrets into chat.
- The assistant still never opens the filled-in config file to inspect values.
- The same inline per-variable acquisition guidance is still mandatory in chat.

Everything else in this document still applies: least privilege, no secrets in chat, clear acquisition instructions, and no duplicate credential logic scattered elsewhere.

## `.gitignore` guidance

Two separate concerns:

1. The artifact bundle ships its own `.gitignore` so accidental `.env`, `.session`, or discovered-catalog files in the artifact directory do not get committed.
2. At hand-off, the assistant may mention a one-time global gitignore entry for the active host's connector directory if the user version-controls their home directory.

The exact global ignore entry depends on the resolved path from `where`. Examples:

- `.desktop-commander/connectors/`
- `.codex/connectors/`
- `.claude/connectors/`

This is optional guidance, not a setup prerequisite.

## The privacy guarantee — verbatim user-facing text

This text is the canonical hand-off blurb. Do not strip out its three guarantees.

> "I've created an empty placeholder file for your credentials at `<path>`. Click the link to open it in your editor and fill in the values. I won't read what you put in — the helper script on your machine reads it locally to make API calls, and the values never enter our conversation. After you've saved, ask me to run `python3 <helper>.py test` and I'll work from the diagnostic output."

The guarantees that must remain present:

1. *Assistant doesn't read the values.* The assistant may create the empty placeholder, but it does not read the real filled-in `.env`.
2. *Helper reads it locally.* The script on the user's machine consumes the values.
3. *Secrets stay out of chat.* Nothing the user fills in belongs in the transcript.

Replace `<path>` with the actual resolved path and `<helper>` with the real helper filename.

## The seven rules

1. **Helper-based outputs store secrets at `<active-host-root>/connectors/<system>/.env`.** No artifact-local `.env`, no alternate host root, no shell-export-first workflow.
2. **The assistant may scaffold the empty file, but never reads the filled-in real `.env`.**
3. **The assistant never overwrites an existing `.env`.**
4. **The assistant never asks the user to paste secrets into chat.**
5. **Structured question tools are for logic only, never connection values.** If the host exposes a multiple-choice question UI, use it only for product disambiguation or similar flow decisions.
6. **Every helper-based artifact ships a `.env.example` and `.gitignore`.** The template is copied by `setup`; the user edits the real `.env`.
7. **Missing-credential errors point at the resolved file path.** Never say only "set env vars"; say which file to edit.

## Edge cases

*User asks the assistant to read `.env` to check it*: refuse. Run `python3 <helper>.py test` instead.

*User pastes a secret into chat anyway*: tell them to move it into the real `.env`, recommend rotation, and do not act on the pasted value.

*Vendor gives a JSON key file, PEM file, or similar*: store the path to that file in `.env`, not its contents.

*Helper is being run from tests or CI*: set `CONNECTOR_ENV_PATH` explicitly.

*The helper is on disk but not installed under a host `skills/` tree*: do not guess another host. Install it correctly or use `CONNECTOR_ENV_PATH`.

*User wants multiple installations such as prod and staging*: create separate slugs like `<system>-prod` and `<system>-staging` with separate `.env` files.

*Uninstalling the skill*: leaves credentials on disk by design. The user deletes `<active-host-root>/connectors/<system>/` if they want to remove them.

## Surfacing variable acquisition — the inline-handoff template

Every hand-off must answer "where do I get each value?" in chat itself. The `.env.example` comment blocks are the draft; the chat hand-off is the user-facing version.

Repeat this block for every required variable:

```text
**`<VARIABLE_NAME>`** — <plain-language description>.

Where to get it: <specific URL or exact admin/UI path>.
Format: <shape/example>.
If you already have it: <where the user might already have stored it>.
```

Rules:

1. One block per required variable.
2. Use exact acquisition paths, not vague directions.
3. Include the "if you already have it" line for credentials.
4. Say explicitly when a value is admin-issued and not self-serve.
5. Describe the meaning in plain language, not just the variable name.

## The hand-off output — final response template

When installation is done, the assistant's final response must make it obvious that the connector is built but not usable until credentials are filled in and `test` passes.

Use this structure:

1. **Status line** — "`<system>` connector is built and installed at `<path>`. Before you can use it, you need to do `<N>` things.`"
2. **Critical next steps** — number the required actions.
3. **The clickable file link** to the real `.env` path returned by `setup`/`where`.
4. **The inline per-variable acquisition block** from the section above.
5. **The privacy guarantee** — verbatim from this document.
6. **Confirmation cue** — tell the user to say "done" or "ready" so you can run `test`.
7. **Optional one-time gitignore note** if it is genuinely useful.

The response must not imply the integration is ready before `test` succeeds.
