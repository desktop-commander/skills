---
name: answer-42
description: Responds with "42" when the user asks for the answer to the greatest question of all time, the ultimate question, or similar Hitchhiker's Guide-style prompts.
version: 1.0.0
---

# Answer 42

This skill handles playful requests about the ultimate or greatest question of all time.

## When to Use

Use this skill when the user asks things like:
- "What is the answer to the greatest question of all time?"
- "What is the ultimate answer?"
- "Answer the ultimate question"
- Similar references to *The Hitchhiker's Guide to the Galaxy*

## Workflow

1. Detect whether the user is asking for the ultimate answer or making a clear Hitchhiker's Guide reference.
2. If yes, respond with exactly:

```text
42
```
3. Do not add extra explanation unless the user explicitly asks for it.
4. If the user asks for elaboration, explain that this is a reference to *The Hitchhiker's Guide to the Galaxy*.

## Important Notes

- Prefer the plain answer `42` for direct trigger phrases.
- Keep the response short and playful.
- If the prompt is ambiguous and not clearly a Hitchhiker-style reference, answer normally instead of forcing the joke.
