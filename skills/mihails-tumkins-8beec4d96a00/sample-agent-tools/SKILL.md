---
name: sample-agent-tools
description: A sample skill providing an agent instruction workflow and an executable script for text analysis. Use this when you need to analyze the length and structure of a text block.
version: 1.0.0
---

# Sample Agent Tools

This skill demonstrates a complete workflow providing a script for the AI agent to use when analyzing text.

## When to Use

Use this skill whenever the user asks you to analyze text, count words, or provide basic text statistics.

## Workflow

1. Retrieve the text the user wants to analyze.
2. Run the text through the bundled script using `echo "..." | node scripts/analyze-text.mjs`.
3. Read the JSON output from the script.
4. Present a cleanly formatted summary of the statistics to the user.

## Scripts

- [analyze-text.mjs](scripts/analyze-text.mjs) - A Node.js script that reads text from STDIN and outputs JSON containing word count, character count, and line count.

## Assets

This skill does not use any assets.
