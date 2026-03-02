---
name: writing-skills
description: Use when creating or updating skills so they are triggerable, concise, and easy for Codex to apply correctly.
---

# Writing Skills

Design skills for reliability and low context cost.

## Core Rules

- Keep frontmatter to only `name` and `description`.
- Make description trigger-focused ("Use when ..."), not workflow summary.
- Keep instructions concise and action-oriented.
- Add only resources that are actually reused.

## Validation

Run validator after edits:

`python3 /Users/edgarsskore/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-folder>`

## Quality Checklist

- Trigger conditions are clear.
- Steps are executable.
- No redundant docs or filler.
- Skill is short enough to load efficiently.
