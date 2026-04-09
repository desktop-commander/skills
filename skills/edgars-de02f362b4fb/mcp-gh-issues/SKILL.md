---
name: mcp-gh-issues
description: Manage and triage GitHub issues for the DesktopCommanderMCP repo. Sync new issues, cross-reference against known clusters, update triage files, draft responses, and close stale issues.
version: 1.0.0
argument-hint: "[init|sync|update|respond <number>|close-stale|status|detail <number>]"
allowed-tools: Bash(gh *) Bash(bash *) Bash(chmod *)
---

# DesktopCommanderMCP GitHub Issues Management

You are managing the open issue backlog for **wonderwhy-er/DesktopCommanderMCP**.

## Knowledge Base

The KB lives in `${CLAUDE_SKILL_DIR}/kb/`. **Before doing anything else, check if it exists.**

If `${CLAUDE_SKILL_DIR}/kb/triage.md` does NOT exist, the KB hasn't been initialized yet. In that case:
- If the user ran `init`, proceed with the init operation below.
- For any other operation, tell the user: "No knowledge base found. Run `/mcp-gh-issues init` first to bootstrap from current GitHub issues."
- Do NOT attempt other operations without a KB — they depend on it.

If the KB exists, read both files at the start of every operation:

- `${CLAUDE_SKILL_DIR}/kb/triage.md` — Detailed triage with summaries, root causes, actions, severity
- `${CLAUDE_SKILL_DIR}/kb/overview.md` — Overview tables by category

When updating triage data, always edit the files inside `${CLAUDE_SKILL_DIR}/kb/` — these are the canonical copies.

## Repo Context

- **Repo:** `wonderwhy-er/DesktopCommanderMCP`
- **Local clone:** Look for `DesktopCommanderMCP` directory relative to the project root, or use `gh` CLI directly with `--repo wonderwhy-er/DesktopCommanderMCP`
- **Owner:** Eduard Ruzga (`wonderwhy-er`) — open-source maintainer and CEO
- **Our role:** We maintain a bundled fork (`mcpb`) inside `dc-app`. Public repo issues affect us directly.

### Key Source Files Referenced in Issues

| File | Scope |
|------|-------|
| `src/tools/filesystem.ts` | `read_file`, `write_file`, `validatePath`, `isPathAllowed` |
| `src/tools/terminal-manager.ts` | `start_process`, `execute_command`, shell spawning, output buffering |
| `src/config-manager.ts` | `blockedCommands`, `allowedDirectories`, config loading/defaults |
| `src/tools/search-manager.ts` | `start_search`, regex handling |
| `src/server.ts` | MCP tool definitions and descriptions |

## Known Issue Clusters

When triaging, always check if a new issue fits an existing cluster:

### 1. Security: Blocklist/Sandbox Bypasses (anchor: #374)
#374 (AgentWard audit), #219 (symlink traversal, fixed PR #321), #323 (path/cmd substitution bypass), #352 (fail-closed on config error), #353 (restrict internal config keys), #419-#423 (YLChen-007 variants), #411 (mcpfuzz rediscovery).
**Root cause:** `extractBaseCommand`/`extractCommands` don't handle shell metacharacters, quotes, newlines, wildcards. `allowedDirectories` doesn't apply to shell commands.

### 2. Security: SSRF in read_file URL Fetching (anchor: #410)
#410 (TianYu writeup), #406 Finding 2 (AgentSeal).
**Root cause:** `readFileFromUrl()` passes URLs to `fetch()` with zero validation — no IP blocklist, no scheme restriction, no redirect limit.

### 3. Security: Agent Self-Modification via set_config_value (anchor: #374 F1)
#374 Finding 1, #406 Finding 5 (defaultShell redirect), #105 (set_config dangerous).
**Root cause:** Agent can change `blockedCommands`, `allowedDirectories`, `defaultShell` at runtime via `set_config_value`.

### 4. Security: Hardcoded Credentials (#416)
Real `TELEMETRY_PROXY_TOKEN` and GA4 secrets committed to source in `capture.ts` and setup scripts.

### 5. Security: Missing Default Blocklist Entries (#412)
`curl`, `wget`, `nc`, `bash -c`, `sh -c`, `python -c`, `node -e` not blocked by default. Enables data exfiltration via prompt injection.

### 6. Shell/PowerShell on Windows (anchor: #350)
#350 (pwsh strips `$`), #378 (no stdout from external executables), #397 (stdin support request).
**Root cause:** `getShellSpawnArgs` in `terminal-manager.ts` doesn't handle pwsh quoting. Fix: `-EncodedCommand` (base64 UTF-16LE).

### 7. Process Output Loss (anchor: #195)
#195 (PID gone before read), #395 (stderr lost on fast exit), #196 (false positive "waiting for input").
**Root cause:** Output buffer in `terminal-manager.ts` doesn't retain completed process output.

### 8. read_file Bugs
#394/#426 (empty content for extensionless files), #428 (EISDIR on directory path), #403 (path traversal in default config).

### 9. Config Loading (anchor: #147)
#147/#143 (config values not respected).
**Root cause:** `config-manager.ts` `init()` does `JSON.parse` without merging against defaults.

### 10. Tool Description Bloat (anchor: #266)
#266 (15-20k tokens), #200 (excessive whitespace from template literals).

### 11. EventEmitter Memory Leak (#391)
`drain` listeners accumulate on Socket during long sessions. Causes timeouts after 50+ tool calls.

### 12. Spam/Badge Offers
#383, #381, #376, #407, #415. Close or ignore.

## Helper Scripts

Scripts are bundled in `${CLAUDE_SKILL_DIR}/scripts/`. Make them executable before first use:
```
chmod +x ${CLAUDE_SKILL_DIR}/scripts/*.sh
```

- **`fetch-issues.sh [--since YYYY-MM-DD]`** — Fetch all open issues as JSON (number, title, date, author, body)
- **`extract-triaged-numbers.sh`** — Extract all issue numbers from triage files (sorted, deduped)
- **`diff-issues.sh`** — Compare open issues vs triaged, output untriaged list with summary

## Operations

Determine the operation from: $ARGUMENTS

If no argument provided, check if KB exists. If not, suggest `init`. If yes, ask what to do.

### `init` — Bootstrap the knowledge base from scratch
Use this when the KB doesn't exist yet (first-time setup or new team member).

1. Create the `${CLAUDE_SKILL_DIR}/kb/` directory if it doesn't exist
2. Fetch all open issues: `bash ${CLAUDE_SKILL_DIR}/scripts/fetch-issues.sh`
3. For each issue, fetch its body: `gh issue view <number> --repo wonderwhy-er/DesktopCommanderMCP --json body,title,number,createdAt,author,comments`
   - Work in batches of 10-15 to avoid overwhelming context
   - Start with the most recent issues first
4. Categorize every issue into one of these severity buckets:
   - **Blocker** — security vulnerabilities, data loss, crashes affecting many users
   - **Bad Publicity** — visible bugs that make the project look bad, broken installs
   - **Open Questions** — issues needing design decisions or more investigation
   - **Needs CEO Decision** — issues requiring Eduard/wonderwhy-er's input
   - **Nice to Have** — valid bugs or features that aren't urgent
   - **Spam / Noise** — badge offers, dead threads, external bugs, no-info reports
5. Create `${CLAUDE_SKILL_DIR}/kb/triage.md` with this structure:
   ```markdown
   # DesktopCommanderMCP GitHub Issues Triage

   Tracked issues from https://github.com/wonderwhy-er/DesktopCommanderMCP/issues

   ---

   ## Blocker

   ### #<number> — <title>
   - **Reported:** <date> | **Status:** <status>
   - **Summary:** <what the issue is and root cause>
   - **Action:** <recommended fix or next step>

   ---

   ## Bad Publicity
   ...

   ## Open Questions
   ...

   ## Needs CEO Decision
   ...

   ## Nice to Have
   ...
   ```
6. Create `${CLAUDE_SKILL_DIR}/kb/overview.md` with this structure:
   ```markdown
   # DesktopCommanderMCP GitHub Issues — Overview

   All open issues from https://github.com/wonderwhy-er/DesktopCommanderMCP/issues

   ---

   ## Blocker

   | # | Title | Date |
   |---|-------|------|
   | #<number> | <title> | <date> |

   ---

   ## Bad Publicity
   ...

   ## Nice to Have
   ...

   ## Spam / Noise
   ...
   ```
7. Group related issues into clusters and update the "Known Issue Clusters" section in this SKILL.md
8. Show a summary: how many issues total, breakdown by category, any clusters identified

### `sync` — Find new untriaged issues
1. Run `bash ${CLAUDE_SKILL_DIR}/scripts/diff-issues.sh` to get the untriaged list
2. For each untriaged issue, fetch its body: `gh issue view <number> --repo wonderwhy-er/DesktopCommanderMCP --json body,title,number,createdAt,author,comments`
3. Cross-reference against the known issue clusters above
4. Present a table with columns: #, Title, Date, Cluster Match (or "NEW"), Suggested Category

### `update` — Add new issues to triage files
After a `sync`, update both knowledge base files inside `${CLAUDE_SKILL_DIR}/kb/`:
- Add each new issue to the correct severity category in `kb/triage.md` (include summary, root cause, action)
- Add each new issue to the correct category table in `kb/overview.md`
- If a new issue belongs to an existing cluster, note the relationship
- Update the cluster list in this SKILL.md if new clusters emerge
- Mark spam in the Spam/Noise section

### `respond <issue-number>` — Draft a response
1. Fetch issue + comments: `gh issue view <number> --repo wonderwhy-er/DesktopCommanderMCP --json body,title,number,comments,author`
2. Read triage entry for context
3. If issue references source files, read them for current state
4. Draft response that:
   - Acknowledges the reporter
   - References related issues if applicable
   - Gives concrete status (investigating, fix planned, wontfix, duplicate)
   - Thanks security reporters for responsible disclosure
   - For spam/noise: suggests closing with brief explanation
5. **Show draft for review — do NOT post without explicit user approval**
6. When approved, post via: `gh issue comment <number> --repo wonderwhy-er/DesktopCommanderMCP --body "<comment>"`

### `close-stale` — Identify closable issues
1. Read triage files
2. Find issues marked as: fixed, confirmed resolved, noise, needs closing
3. Draft a brief closing comment for each
4. Present list for approval — **do NOT close without explicit approval**

### `status` — Triage dashboard
1. Read both triage files
2. Count by category (Blocker, Bad Publicity, Nice to Have, Spam, Open Questions)
3. Run diff-issues.sh to count untriaged
4. Show: total open, triaged count, untriaged count, blockers, items needing response, items ready to close

### `detail <issue-number>` — Deep-dive on one issue
1. Fetch issue + all comments
2. Check triage files for existing notes
3. If issue references source code, read the relevant files in the local clone
4. Present full briefing: what it is, code state, fixed/unfixed, related issues, recommended next step
