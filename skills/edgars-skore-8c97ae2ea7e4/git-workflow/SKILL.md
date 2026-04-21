---
name: git-workflow
description: Apply safe git workflow for DesktopCommander MCP development. Use when creating branches, committing changes, preparing pull requests, or handling merge conflicts.
---

# MCP Git Workflow

Use non-interactive git commands.

## Branching

- Start from updated default branch.
- Create feature branches with prefix `codex/`.
- Keep one concern per branch.

## Commit Rules

- Commit message format: `{type}({scope}): {description}`
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`
- Keep commits small and logically grouped.

## Safety Rules

- Never use force-push unless explicitly requested.
- Never run destructive reset/checkout operations unless explicitly requested.
- Resolve conflicts by preserving intended behavior and rerunning verification.

## PR Readiness

Before PR:
1. Build passes
2. Relevant tests pass
3. Diff is scoped and documented
