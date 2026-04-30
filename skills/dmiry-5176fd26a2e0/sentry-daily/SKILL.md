---
name: sentry-daily
description: sentry
version: 2.0.0
---

# Sentry Daily Check Skill

**Description:** Use the Sentry CLI to check daily errors, investigate unresolved issues, and generate AI-assisted solutions directly from the terminal.
**Triggers:** "check sentry", "read errors in sentry", "sentry daily check", "sentry issues", "what's failing in sentry", "show sentry bugs"

## Prerequisites & Setup
The Sentry CLI (`sentry`) is already installed globally (`curl https://cli.sentry.dev/install -fsS | bash`) and authenticated on this machine.
No extra setup is required. The CLI uses OAuth tokens already configured on the user's system.

## Command Reference
Always use `start_process` with `shell: "zsh"` to run these commands. 

### 1. Discovery
*   **List Organizations:** `sentry org list`
*   **List Projects:** `sentry project list`
    *   *Note: Sentry CLI can auto-detect context from `.env` files, but it's safer to explicitly pass `<org>/<project>` or `<project>` when checking specific projects.*

### 2. Daily Error Checking (The "Daily Check" Workflow)
To do a daily check of unresolved or frequent errors:
*   **Get top unresolved issues by frequency:** 
    `sentry issue list <org>/<project> --query "is:unresolved" --sort freq --limit 10`
*   **Get newly introduced issues:**
    `sentry issue list <org>/<project> --query "is:unresolved" --sort new --limit 10`
*   **Search for specific errors (e.g., TypeError):**
    `sentry issue list <org>/<project> --query "is:unresolved TypeError"`

### 3. Investigating an Issue
When the user wants to look deeper into a specific issue from the list (using its `SHORT ID` like `FRONT-ABC`):
*   **View Issue Details:**
    `sentry issue view <short-id>`
    *(Shows issue status, first/last seen, events count, affected users, and latest event details like browser, OS, and URL)*

### 4. AI-Assisted Debugging (Seer Autofix)
If the user wants help understanding or fixing an issue:
*   **Explain Root Cause:**
    `sentry issue explain <short-id>`
    *(Analyzes the issue using Seer AI, providing root causes, reproduction steps, and relevant code locations. May take a few minutes for new issues.)*
*   **Generate a Fix Plan:**
    `sentry issue plan <short-id> --cause <n>`
    *(Generates a solution plan with specific implementation steps. Must run `explain` first. `--cause <n>` is required if multiple causes were found.)*

## Execution Workflow
When a user asks you to perform a daily check or check Sentry errors:
1.  **Identify the Project:** Ask the user which project they want to check, OR run `sentry project list` to see available projects and ask them to choose. If they are already working in a directory with a `.env` file that specifies the DSN, `sentry issue list` without arguments might work, but explicit is better.
2.  **Run the Query:** Use `start_process` to run the `sentry issue list` command for unresolved issues.
3.  **Summarize Results:** Read the output and present a clean, concise summary of the top issues to the user.
4.  **Offer Next Steps:** Ask if they want to view details (`view`), explain the root cause (`explain`), or generate a fix plan (`plan`) for any of the listed issues.