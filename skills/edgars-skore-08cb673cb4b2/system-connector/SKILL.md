---
name: system-connector
description: Build a deterministic connector to ANY third-party system, app, or API — popular SaaS, niche or regional software, internal company tools, or anything in between. Use when the user wants to "connect to", "set up", "integrate with", "link", "hook up", "give the assistant access to", or "use" an external service and there is no existing tool already wired up. The skill conducts a short interview, checks whether an existing MCP/connector already covers it, researches the API (or other integration surface) if not, and produces the lightest *deterministic* artifact that gets the user connected — usually a SKILL.md plus a stdlib helper script and self-tests, sometimes an MCP config snippet, occasionally a full MCP server, and sometimes an honest "this isn't feasible without X."
---

# System Connector

This skill helps a non-technical user build a connector to a third-party system. It works for **any** system the user names — well-known SaaS, regional/niche software, internal company tools, or legacy desktop apps. The connector this skill produces is host-neutral: a Python helper script plus markdown documentation, runnable from any host environment that supports skills (Cowork, Claude Code, Codex, Desktop Commander, etc.). It is a multi-phase workflow — never skip phases, never produce an artifact on the first turn.

## Operating principles

1. **Cheapest path wins by default.** A working setup using something that already exists beats a custom build every time. When one path is clearly simpler, safer, or easier to maintain, take it. When discovery surfaces **2-3 genuinely easy paths** with meaningfully different trade-offs, present those options briefly, recommend one, and let the user choose before building.
2. **Non-technical user, just-do-it-for-me, always.** Treat every user as if they picked "Just do it for me" — walk them through every step, do the technical bits yourself. Never ask about OAuth scopes, REST verbs, or rate limits unless the answer affects what *they* need to do. Translate jargon. Don't ask "are you a developer?" — assume not.
3. **Minimum-friction interview.** Ask the user the smallest possible set of questions that actually changes what gets built. In practice this is one question at most: which specific product do they mean, when the name is ambiguous. Don't ask about use cases, account status, or comfort level — defaults handle all three (see Phase 1).
4. **Default scope: all non-destructive operations.** When you build an artifact, cover every read / list / query / search / introspection endpoint the API exposes — without asking. Writes (create / update / delete / anything that changes state on the vendor's side) are produced **only when the user explicitly asks for a specific write operation** during the conversation that follows the artifact hand-off. Reads are safe-by-default; writes are opt-in.
5. **Structured question tools are for logic only, never for connection values.** Logic = "which product?", "include the experimental write commands?". Connection values = base URL, API token, region, environment — those go in `.env`. See `reference/credentials.md`.
6. **Show, then ask permission.** After research, summarise what you found and propose the output type before generating files. If there are several low-friction implementation paths, show the short option set first and ask which path the user wants.
7. **No guessing — the artifact must be deterministic.** Every endpoint, payload schema, filter syntax, and auth flow that ends up in the artifact must be grounded in something concrete: official docs you actually read, a real API response you observed, or a vendor-published sample you verified. Phrases like "the exact parameter names appear in the resource's self-description" or "the assistant figures it out at runtime" are smell. If you don't have the ground truth, get it (Phase 3) before producing files; if you can't get it, say so honestly and stop. The non-technical user has no way to recover from an underbaked artifact, so the burden of being right is on the skill, not on the assistant at runtime.

## The six phases

Run these in order. Use the host's progress/planning tool if one exists; otherwise keep a short in-chat checklist. The phases are not optional.

### Phase 1 — Interview

Goal: confirm which specific product the user means, if and only if the name is ambiguous. Otherwise, skip the interview entirely and proceed.

**Default assumptions — don't ask about any of these:**

- *Use cases.* Default scope of the artifact is **every read / list / query / search / introspection endpoint the API exposes**. Don't ask "what do you want the assistant to do?" — covering all reads is the default. Writes are opt-in later (the user asks "add a create-customer command" once they've used the read tools and want more).
- *Account status.* Assume the user may or may not have an account/installation set up. The hand-off walks them through both cases (here's how to verify if you have one; here's how to obtain one if you don't). Don't ask "do you already have a login?".
- *Technical comfort level.* Always treat the user as if they picked "Just do it for me." Walk them through every step. Don't ask "are you a developer?".

**The one question worth asking — disambiguation.** When the system name is ambiguous, ask one concise question: *"Which <name> do you mean?"*, listing the plausible products plus their distinguishing details. If the host offers a structured multiple-choice question tool, use it; otherwise ask in plain text. Patterns that justify asking (described abstractly so this guidance applies to anything the user names):

- *Family-name shadowing.* The name refers to multiple distinct products from different vendors with different APIs.
- *Edition divergence.* One vendor ships several editions or SKUs with materially different APIs — legacy vs. modern, on-prem vs. cloud, free vs. enterprise, regional editions.
- *Same name, different category.* The name belongs to a popular product in one category and an unrelated tool in another.

Patterns that **don't** justify asking (proceed straight to Phase 2):

- The name maps to one canonical product with one canonical API.
- The user pasted a specific URL — that fully resolves the ambiguity.
- The user named an internal or custom system precisely (their own naming, no public collision).

**Never ask, via any channel, about:** auth method, API scope, region, environment, workspace ID, base URL, token, password, comfort level, or anything that ends up in `.env`. Connection values live in `.env`. Auth method is inferred during research.

### Phase 2 — Discovery

Before researching anything new, check whether the work is already done. Read `reference/discovery.md` and follow it. Decision tree:

- **The current host already exposes connected tools/plugins/skills for the service** → use or suggest those and stop.
- **A vendor-published MCP server exists for this service** (a package like `@<vendor>/<system>-mcp-server`) **and you can read its source** → produce an **MCP config snippet** (Phase 4 output type B).
- **A public skill/plugin already covers it and the current host can install it cleanly** → use that path instead of building a new helper.
- **Nothing safe and usable exists** → continue to Phase 3.

When discovery finds something, *tell the user what you found and why it's the right fit* before suggesting it. Don't just dump a name. **Don't recommend a third-party MCP whose source you can't read** — if the install page is blocked or the repo is private, treat it as not-found and continue to research.

### Phase 3 — Research

Only enter this phase if Phase 2 found nothing usable. Read `reference/research.md` and follow it. Goal: produce a concrete, citable specification covering:

- Official docs URL(s) you actually read content from
- The exact auth flow with one verbatim request example (header values, payload shape)
- The 1–5 endpoints that map to what the user said in Phase 1 question 2 — with their actual paths, parameters, and example responses
- Any gotchas (rate limits, pagination quirks, beta status, regional caveats, VPN-only access)

If the docs are JS-rendered SPAs that return empty HTML, **don't give up** — `reference/discovery.md` covers the workarounds (direct content URLs, web archives, vendor-published source samples, OpenAPI probes). If after exhausting those you still don't have ground truth, surface that honestly and ask the user how to proceed (e.g. they may be able to share a curl example from their own usage).

### Phase 4 — Pick output type and build

If one output type is clearly the best fit, propose that path and proceed after the user confirms. If there are **multiple easy implementation paths** (for example, an official MCP config snippet versus a lightweight helper skill, or two equally viable non-API approaches), do **not** silently pick one. Give the user a short choice set with:

- the 2-3 easiest paths only
- one-line trade-offs for each
- a clear recommendation for the default path
- a direct question asking which path they want

Keep this brief. The goal is to let the user choose among the realistic low-friction options, not to dump every theoretical architecture.

| Situation | Output | Why |
|---|---|---|
| Current host already exposes connected tools for the service | **Use the host's existing integration** | Already done. |
| Public MCP server + readable source | **MCP config snippet** (`reference/output_mcp_config.md`) | Fastest, official, kept up to date by the vendor. Credentials still follow `reference/credentials.md`. |
| Public REST/HTTP API, ≤10 endpoints needed | **SKILL.md + helper script + tests** (`reference/output_skill_md.md`) | The default for nearly all integrations. The helper script makes calls deterministic; the tests prove the parsing logic; the SKILL.md is a tight cookbook on top. |
| OAuth + many stateful endpoints, or vendor expects a long-running server | **Full MCP server** (`reference/output_mcp_server.md`, delegates to the official `mcp-builder` capability) | The integration needs real code and lifecycle management. Credentials still follow `reference/credentials.md`. |
| **No public API at all** (niche ERP, on-prem desktop app, regional software) | **SKILL.md + helper, non-API integration** | File watching, CSV/Excel import-export, local DB read, or Desktop Commander to drive the app's UI. See `reference/output_skill_md.md` "non-API integrations" section. |
| Service has no usable integration surface | **Honest stop** | Don't ship a snippet that won't work. Tell the user what's missing. Let them pick. |

A bare markdown SKILL.md with curl one-liners is **not** an acceptable output for any non-trivial integration. If the system has a real API, you owe the user a helper script with tests.

**Default-scope rule when building the helper.** The helper must cover every non-destructive endpoint the API exposes — list, query, get, search, schema, discover, introspection. No asking which subset; cover them all. For systems where the API has dozens of resource classes, this means exposing generic class-parameterised commands (e.g. `helper entity list <Class>`, `helper entity get <Class> <id>`, `helper raw <method> <path>`) so any class on the user's deployment is reachable without the helper having to enumerate every one. **Writes (create / update / delete) are NOT included by default.** The user adds them later by asking ("now I want to be able to create customers from this") — at which point the assistant adds the specific write verb and tests, with explicit confirmation before the first real call.

### Phase 5 — Verify

Before installing or handing off:

1. Run the helper's self-tests (`python3 test_*.py`). They must pass on fixture data drawn from real docs/responses, with zero network access. If they don't pass, the artifact isn't done — fix and re-run before continuing to Phase 6.
2. Skim the produced `SKILL.md` end-to-end, the helper's `--help` output, and the `catalog.json` for sanity. The artifact should be self-contained: nothing should reference the assistant's chat context, no TODOs, no hand-wavy comments.

### Phase 6 — Install and hand off

The artifact you built in Phase 4 sits in your build directory (the host-specific scratch location where the assistant produces files). It isn't installed yet — the host environment's skill discovery doesn't know about it. Read **[`reference/install.md`](reference/install.md)** for the full procedure. Brief version:

1. **Resolve the active host root** from the current session's installed `system-connector` skill path.
2. **Install directly into that same host** at `<active-host-root>/skills/<system>/`.
3. **Smoke-test from the installed path** with `python3 <installed_path>/<helper>.py where`. If it does not point at `<active-host-root>/connectors/<system>/.env`, the install did not take.
4. **Hand off credentials per `reference/credentials.md`.** The final response in chat must follow the canonical hand-off output template and inline acquisition guidance. Do not claim the integration is ready before `test` passes.

## Credentials handling

Credentials live at the canonical helper path described in [`reference/credentials.md`](reference/credentials.md). The helper resolves it automatically from its installed location; the assistant scaffolds the empty placeholder via `setup`, emits a normal absolute-path markdown file link, and never reads the filled-in real `.env`. Connection values never go through chat.

**The full ruleset — the seven rules, the setup flow, the verbatim privacy guarantee, edge cases — lives in [`reference/credentials.md`](reference/credentials.md). Read it before producing any artifact. Link to it from any new output-type document. Don't restate the rules elsewhere — drift between two copies is the failure mode that file exists to prevent.**

## File layout reference

```
system-connector/
├── SKILL.md                         ← you are here
├── reference/
│   ├── credentials.md               ← canonical credentials doc — link, don't duplicate
│   ├── discovery.md                 ← Phase 2 procedure (hardened)
│   ├── research.md                  ← Phase 3 procedure
│   ├── install.md                   ← Phase 6 host detection + install routing
│   ├── output_skill_md.md           ← lightweight skill output (helper + tests required)
│   ├── output_mcp_config.md         ← config snippet output
│   └── output_mcp_server.md         ← full server output (delegates)
└── templates/
    ├── api_helper.py                ← stdlib helper skeleton; resolves .env to user scope
    ├── test_helper.py               ← test scaffold (no network required)
    ├── .env.example                 ← canonical credential template (privacy header + placeholders)
    └── .gitignore                   ← canonical artifact .gitignore
```

## Anti-patterns to avoid

- **Building before discovering.** Always run Phase 2 before Phase 3.
- **Recommending a third-party MCP server you couldn't read the source of.** Credential-handling third-party code is not "cheapest path wins" — it's a security risk you didn't audit.
- **Producing markdown + curl as the entire artifact for a REST API.** That offloads endpoint discovery, payload templating, error handling, and pagination onto the assistant at runtime, which means the artifact behaves differently every session. Add the helper script.
- **Asking for any credential or connection value in chat.** Never via free-form prompt, never via a structured question tool, never "just to verify." Full ruleset in `reference/credentials.md`.
- **Putting `.env` in the artifact directory.** Skills are shared, credentials are not. The helper resolves to the canonical helper path from `reference/credentials.md`, not `<artifact>/.env`.
- **Overwriting an existing `.env`.** `setup` is idempotent — if the file is there, it's a no-op. Never replace user-filled values via setup, regenerate, or "fresh start" the file.
- **Telling the user to `mkdir` and `cp` themselves.** That's what `setup` is for. The assistant runs it; the user clicks the link.
- **Leaving the artifact in the build directory after Phase 5.** That's the scratchpad, not the install location — host-specific (Cowork's session `outputs/`, Claude Code's working directory, etc.). Phase 6 routes the artifact to where the host environment expects to find skills; skipping it means the user can't invoke the skill from a fresh session.
- **Picking an install path without detecting the active host.** Installing into another host's `skills/` tree leaves the connector invisible to the current environment. Always derive the active host root from the current session first.
- **Scanning the machine for multiple host roots and choosing among them.** The active host is determined from the current session, not from whatever other skill directories happen to exist on disk.
- **Asking the user questions you don't actually need answers to.** The interview is one question (disambiguation) at most, and only when the name is genuinely ambiguous. Don't ask about use cases, account status, or comfort level — defaults handle them.
- **Building only the use cases the user mentioned.** Default scope is every non-destructive endpoint the API exposes. If the user says "I want to read customers," still build out the full read surface — items, documents, reports, schema, discovery — so they can do anything read-only without coming back. Writes are the exception that requires explicit ask.
- **Stopping at "the docs are a JS SPA, can't read them."** That's the moment to try direct content URLs, web archives, vendor-published source samples, and `/openapi.json` probes. See `reference/discovery.md`.
- **Leaving the user with a half-built artifact.** If the integration genuinely cannot be completed (e.g. the service requires manual approval, or the API is gated behind enterprise sales), say so explicitly and stop, rather than handing them a snippet that won't work.
- **Duplicating the credential rules into a new doc.** When a new output type is added, link to `reference/credentials.md` rather than copy-pasting the rules. Drift between two copies is the failure mode that file exists to prevent.
- **Link-only credential hand-offs.** A file link plus variable names is not enough. The chat response itself must tell the user exactly where each value comes from, mirroring the detailed `.env.example` comments in plain language.
- **Silently choosing between multiple equally easy paths.** If discovery finds several low-friction options with real trade-offs, surface the short choice set and let the user pick.
