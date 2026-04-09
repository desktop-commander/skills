---
name: google-workspace-digest
description: Generates a daily digest of your Google Calendar events for today and recent unread emails. Use this skill when the user asks for a daily brief, digest, or summary of their emails and calendar.
version: 4.0.0
---

# Google Workspace Daily Digest

This skill uses the official `@googleworkspace/cli` (`gws`) command-line tool via a wrapper script to compile a daily digest of today's schedule and unread emails. 

## When to Use

Use this skill when the user asks:
- "What's on my calendar today?"
- "Do I have any important emails?"
- "Create my daily digest"
- "Give me my morning briefing"

## Workflow

1. **Run the Fetch Script**:
   Use Desktop Commander's `start_process` to run the wrapper script:
   `/Users/ds/.desktop-commander/skills/google-workspace-digest/scripts/generate-digest.sh`
   
2. **STRICT AUTHENTICATION CHECK**:
   If the script exits with an error saying authentication is required, you MUST REFUSE TO CONTINUE.
   Tell the user exactly this:
   - They must open their terminal and run:
     ```bash
     gcloud auth login
     gws auth setup
     ```
   - Explicitly mention: "This is a security step required by Google. There is absolutely no way to automate this process with AI because it requires a secure, interactive browser session."
   - Do not attempt any other commands or workarounds until the user confirms they have run this in their terminal.

3. **Format the Digest**:
   If the script succeeds, it will output a JSON object containing `calendar` and `emails`.
   Read the JSON output from the process and format it into a beautifully structured Markdown report containing:
   - A friendly morning greeting.
   - **Calendar**: Chronological list of today's meetings/events.
   - **Emails**: Bulleted list of unread/important emails, summarizing the subject and sender. Highlight any urgent emails.

4. **Deliver Output**: 
   Save the formatted Markdown to the user's workspace (e.g., `/Users/ds/dev/legal/output/daily-digest-YYYY-MM-DD.md`) and provide a brief, engaging summary in the chat!