# DesktopCommanderMCP GitHub Issues — Overview

All open issues from https://github.com/wonderwhy-er/DesktopCommanderMCP/issues

---

## 🔴 Blocker

| # | Title | Date |
|---|-------|------|
| #375 | [Security] ReDoS in Excel/DOCX Content Search | 2026-03-12 |
| #374 | [Security Audit] AgentWard Permission Analysis | 2026-03-11 |

---

## 😬 Bad Publicity

| # | Title | Date |
|---|-------|------|
| #380 | Error loading V8 startup snapshot file on opening DC windows app | 2026-03-16 |
| #350 | PowerShell 7 strips `$` from commands — fix not compiled into dist | 2026-02-21 |
| #296 | Broken npx install — puppeteer-core/md-to-pdf error, possibly resolved in newer versions | 2025-12-18 |

---

## 🟡 Nice to Have

| # | Title | Date |
|---|-------|------|
| #310 | start_process blocks main thread — needs internal verification for dc-app | 2026-01-19 |
| #378 | start_process captures no stdout from external executables (pwsh.exe) | 2026-03-15 |
| #331 | Remote Desktop Commander MCP gets disconnected (early access user, channel timeout) | 2026-02-07 |
| #359 + #145 | Feature Request: Pattern/prefix matching in blockedCommands — requested twice independently | 2026-02-25 |

---

## 🗑️ Spam / Noise

| # | Title | Date |
|---|-------|------|
| #195 | read_process_output fails for fast-completing processes — PID already gone by the time LLM calls it | 2025-08-01 |
| #196 | pytest `collecting ...` falsely detected as waiting-for-input prompt | 2025-08-02 |
| #266 + #200 | Tool description optimization — verbose (15-20k tokens) + excessive whitespace. Track together | 2025-10-27 |
| #180 | Spyware/feedback injection controversy — feedback prompts disabled in v0.2.6, but telemetry still opt-out. ⚠️ Question to CEO: should we disable DC telemetry in our bundled mcpb? | 2025-07-16 |
| #169 | DC crashing in VS Code Windows 10 — fixed in v0.2.6, user confirmed ✅ needs closing | 2025-07-02 |
| #184 | Suggestion to check out mcp-test-editing library — noise | 2025-07-19 |
| #188 | MCP init fails — notifications sent before initialized response — fixed in PR #216 | 2025-07-21 |
| #190 | .dxt Claude extension request — resolved, mcpb shipped and bundled in dc-app | 2025-07-21 |
| #203 | FAQ Suggestion — "Is DC redundant if I use Claude Code?" — answered, noise | 2025-08-09 |
| #219 | [Security] Directory Traversal via Symlink Bypass — fixed in v0.2.36 via PR #321 (fs.realpath before isPathAllowed) | 2025-08-22 |
| #242 | Claude Desktop extension submission follow-ups — mostly resolved, `kill_process` scoping point tracked in #374 | 2025-09-16 |
| #263 | DC tools not available in Claude Code despite successful connection — Claude Code bug, fixed | 2025-10-20 |
| #272 | BUG: DC reads `<Name>` XML tag as `<n>` in Claude Desktop — cannot reproduce, likely Claude Desktop bug | 2025-11-05 |
| #291 | read_multiple_files only returns metadata in ChatGPT — ChatGPT proxy setup, cold thread | 2025-12-11 |
| #293 | Significant latency in write_file — model behaviour, cold thread | 2025-12-16 |
| #295 | How to configure for Windows 11 on VS Code — dead support thread | 2025-12-17 |
| #297 | Deprecated transitive dependencies via exceljs — blocked upstream, cosmetic only | 2025-12-18 |
| #308 | Compaction no longer works after Claude update — Claude Desktop/Anthropic issue | 2026-01-15 |
| #383 | Nerq Trust Score badge offer | 2026-03-17 |
| #382 | Accidental path submission | 2026-03-16 |
| #381 | DesktopCommanderMCP ranks #15 in Infrastructure | 2026-03-16 |
| #376 | Your project is listed on Spark | 2026-03-16 |
| #147 + #143 | Config values (read/write line limits) not respected — two reports, root cause pinpointed, needs fixing | 2025-05-31 |
| #119 | Shell commands don't inherit custom PATH (.zshrc/.bashrc) — multiple users affected, open question on fix approach | 2025-05-15 |
| #123 | Vague install issue — no info provided, user didn't follow up after wonderwhy-er asked for details ✅ needs closing | 2025-05-18 |
| #124 | DC fails on Node 18/20 — open question: document min Node version + add startup version check? | 2025-05-19 |
| #126 | Docker image request — already exists at hub.docker.com/r/mcp/desktop-commander, community member answered ✅ needs closing | 2025-05-20 |
| #127 | "Terminate" JSON corruption — same as #154, likely Smithery runner issue on Windows, cold thread | 2025-05-21 |
| #135 | move_file fails "no sandbox ID" — Smithery/Claude Desktop issue, v0.2.1, never responded, very old and cold | 2025-05-23 |
| #141 | Multiple file read sometimes fails — likely temporary Claude Desktop issue, cold thread, no repro | 2025-05-28 |
| #142 | Fuzzy file search (fzf) — marginal benefit, DC already has search_files+ripgrep, fzf is TUI/dep overhead | 2025-05-28 |
| #148 | search_code fails with `q` param undefined — Claude Desktop parameter mapping bug, not DC. Needs closing | 2025-05-31 |
| #149 | Per-project MCP permissions — Claude Desktop limitation. Could be a dc-app feature someday, but single user request, noise for now | 2025-06-03 |
| #151 | Claude Desktop crashes mid-response — Claude Desktop issue, wonderwhy-er confirmed ✅ needs closing | 2025-06-05 |
| #154 | "Terminate" string corrupting JSON protocol on Windows — likely Smithery, cold thread | 2025-06-09 |
| #155 | Server disconnected — Smithery 401 auth issue, not DC bug. serg33v replied with fix ✅ needs closing | 2025-06-09 |
| #157 | Server disconnects on Windows in v0.2.3 — old version, needs close comment: try latest + open new issue | 2025-06-12 |
| #163 | Windows bugs (&&, emoji/Unicode) — && tracked in #350, emoji tracked as open question | 2025-06-22 |
| #164 | Docker MCP Toolkit folder sharing — niche edge case, cold thread | 2025-06-24 |
