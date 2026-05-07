# Output: full MCP server

Use this only when the integration genuinely needs a long-running server, such as:

- Stateful OAuth refresh or signed-request rotation
- Subscriptions, webhooks, long-polling, or streaming
- A read surface large or stateful enough that a request-per-call helper becomes awkward

If a stdlib helper can cover the read surface cleanly, prefer `output_skill_md.md`.

## How to deliver

This skill does not hand-roll full MCP servers itself. Hand off to the `mcp-builder`-style capability available in the current host, and brief it with:

- System name and slug
- Auth flow
- Full read-side endpoint surface
- Any explicitly requested write operations and only those
- State/lifecycle requirements
- Source-of-truth references from Phase 3
- The credential convention from [`credentials.md`](credentials.md)

## Credential handling

This output type is still helper-style credential handling, not the MCP-config-snippet exception. The server should:

- Read credentials from the canonical helper-style path described in [`credentials.md`](credentials.md)
- Expose `setup`, `where`, and `test`-style diagnostics or their equivalent
- Never ask the user to paste secrets into chat

Do not let the generated server invent its own credential location or secret-ingestion flow.

## Anti-patterns

- Defaulting to a full MCP server because it sounds cleaner
- Letting the builder choose a new credential convention
- Skipping verification after the server is generated
