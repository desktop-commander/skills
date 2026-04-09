# DesktopCommanderMCP GitHub Issues Triage

Tracked issues from https://github.com/wonderwhy-er/DesktopCommanderMCP/issues

---

## 🔴 Blocker

### #375 — [Security] ReDoS in Excel/DOCX Content Search
- **Reported:** 2026-03-12 | **Status:** No response
- **Summary:** `start_search` with malicious regex like `(a+)+$` against Excel/DOCX blocks the Node.js event loop indefinitely.
- **Fix:** Validate patterns with `safe-regex2`, run in Worker.

### #374 — [Security Audit] AgentWard Permission Analysis
- **Reported:** 2026-03-11 | **Status:** Acknowledged
- **Summary:** Agent can modify own security settings, path restrictions bypassed by shell.
- **Action:** Enforce strict config-set blocking and shell-interaction validation.

### #403 — [Security] Direct Path Traversal in read_file
- **Reported:** 2026-03-28
- **Summary:** No validation on default config path access.

### #406 — [Security] AgentSeal 5 Findings
- **Reported:** 2026-03-30
- **Summary:** History exfil, SSRF, credential exfil, etc.

### #410 — [Security] SSRF in `read_file` URL Fetching
- **Reported:** 2026-04-02
- **Summary:** Unvalidated `fetch` calls.

### #411 — [Security] Path Traversal + Command Injection Bypass
- **Reported:** 2026-04-02
- **Summary:** Complex bypass.

### #412 — [Security] Default blocklist missing network tools
- **Reported:** 2026-04-02
- **Summary:** `curl`/`wget` unblocked.

### #416 — [Security] Hardcoded credentials in production
- **Reported:** 2026-04-03
- **Summary:** Secrets in `capture.ts`.

### #419/#420/#421/#422/#423 — [Security] Various Sandbox Escapes
- **Reported:** 2026-04-05
- **Summary:** Path validation bypass, symlink traversal, blocklist avoidance via shell tricks.
- **Action:** Mandatory `fs.realpath` and array-based command parsing.

---

## 😬 Bad Publicity

### #380 — Error loading V8 startup snapshot (Windows)
### #350 — PowerShell 7 strips `$`
### #391 — [BUG] EventEmitter memory leak (drain listeners)

---

## 🟡 Nice to Have

### #394/#426/#428 — `read_file` error handling chain
- **Reported:** 2026-03-25/04-09
- **Summary:** EISDIR errors, empty content on extensionless files.

### #397 — stdin support for `start_process`
- **Reported:** 2026-03-25 
- **Summary:** Bypass shell quoting via stdin.
