# Output: MCP config snippet

Use this when discovery surfaced a public MCP server that's the right fit, **and** you've read its source. If you can't read the source, route to `output_skill_md.md` instead — never recommend a credential-handling third-party MCP you haven't audited.

## What you produce

A single config block the user pastes into their host application's MCP config file. The path varies by host: the Claude desktop app uses `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS; Claude Code, Codex, Desktop Commander, and other host environments each have their own config location — check the host's documentation or the host's own settings UI for the right path. Add a 3-step setup paragraph alongside the snippet.

```jsonc
{
  "mcpServers": {
    "<short-name>": {
      "command": "<runtime>",            // e.g. node-package-runner, python-runner, container engine
      "args": ["<package-or-image>", "..."],
      "env": {
        "<VAR_NAME>": "<placeholder — user fills in>"
      }
    }
  }
}
```

## Required pre-flight checks

Before producing the snippet:

1. **Source visibility.** Open the MCP server's public source (registry source link). Skim the request handler to confirm it does what the description claims and doesn't do anything surprising with credentials. If the source is private or the marketplace listing is the only artifact, treat as not-found and route to `output_skill_md.md`.
2. **Last-updated check.** A repo with no commits in 18+ months is a yellow flag — note it for the user.
3. **Auth flow.** Confirm the env vars match what the user can plausibly obtain. If it requires a long-lived service-account JSON the user can't generate, you have to walk them through obtaining it as part of the hand-off.

## Credentials in this output type

This is the one exception described in [`credentials.md`](credentials.md) under "MCP config snippet exception".

Short version:

- Placeholder values live in the host application's MCP config file, not a connector-local `.env`.
- The assistant still never asks for secrets in chat.
- The assistant still never opens the user's filled-in config to inspect values.
- The same inline per-variable acquisition guidance is still mandatory in chat.

## What goes in the response to the user

```
Here's the MCP server I found:
- **Name**: <name>
- **Source**: <repo URL>             ← so they can click and see what it does
- **Maintainer**: <vendor / community>, last updated <date>
- **Covers**: every read endpoint listed in Phase 3 / <write endpoints if any are exposed>
- **Doesn't cover**: <if any of the read use cases is missing>

To install:

1. Open your host config file at <path>.
2. Add this block (or merge into your existing `mcpServers` object):

   ```json
   <the snippet>
   ```

3. Replace the placeholder values for each env var with your real credentials:
   - <step-by-step where each credential comes from on the vendor side>
   - Use the same four-part inline guidance standard as `credentials.md` (what it is / exactly where to get it / format / if-you-already-have-it). Don't just name the variables.

4. Save and restart the host application, then ask me to run a quick test like "<concrete first command using read-only data>".

I won't read what you put in the env block. The MCP server reads it locally when the host app spawns it.
```

For this output type there is no separate `.env.example`, so the chat response itself becomes the authoritative credential walkthrough. Treat that inline per-variable block as the critical last step of the hand-off.

## When the snippet alone isn't enough

If the MCP requires a vendor-side setup (OAuth app registration, webhook configuration, API enablement on a console), include those steps **before** the config snippet, with screenshots-by-words ("Settings → Developers → Create new app → grant scopes X and Y").

## Verification step (do not skip)

After the user reports installation, ask the assistant to call one read-only tool from the MCP. If it errors, the helpful error patterns are:

- "Cannot find module" — wrong package name in the snippet, or the runtime isn't installed.
- "Authentication failed" — env var typo or wrong scope on the credential.
- Tool calls return empty arrays where data is expected — common when the credential lacks scope; have them re-create the credential with the exact scopes the MCP source declares.

## Anti-patterns

- **Recommending a closed-source / unverified MCP.** Even if it has a glowing badge, if the actual repo is gated, don't.
- **Making the user paste secrets into chat to fill the env vars.** They put values in their own host-app config file directly. See `credentials.md` for the full rule.
- **Adding an MCP whose feature set is broader than needed** if a tighter alternative exists. The smallest tool that covers the use cases is the one to suggest.
- **Including write tools in the recommended config when the user hasn't asked for writes.** Default scope is reads. If the MCP server's tool list includes destructive operations, mention them in the response so the user knows what's available, but don't promote them as default capabilities.
