# Phase 3 — Research

Goal: produce a concrete, citable specification for the integration. Every claim that ends up in the final artifact must be backed by something you read or observed — not paraphrased generalities.

## What "concrete" means

For each of the items below, you should be able to point at the exact source you got it from (URL + section, vendor SDK file, OpenAPI spec key, captured request).

- **Base URL** — exact host and path prefix. Note any per-customer/region variation (e.g. `https://<account>.api.example.com/v1`).
- **Auth flow (technical)** — header name, value format, where the value lives in a request. Include one verbatim example: `Authorization: Bearer eyJhbGc...` or `Authorization: Basic <base64(user:pass)>`.
- **Credential acquisition (user-facing) — for every value the user will need to fill in `.env`, capture the exact path they take to obtain it.** Not "from the vendor's settings page" — the actual click path:
  - *Self-serve credentials* (most modern SaaS): the URL of the page where the user generates the credential, the menu navigation if it's not directly linkable (`Settings → Developers → API Tokens → Generate`), and the required scopes/permissions to tick.
  - *Admin-issued credentials* (legacy enterprise software, on-prem ERPs): which person or role inside the user's organisation creates them. If the user can't generate it themselves, that's a hand-off blocker — flag it and the artifact's `.env.example` says "ask your `<system>` administrator" rather than implying self-service.
  - *URL/host values* (base URLs for self-hosted systems): how the user finds out their server's URL — typically "ask whoever administers the install" or "look at the address bar after you sign in to the web UI."
  - *Format / shape examples.* What does a valid value look like? `https://hop.example.lv/horizon`, `sk_live_4eC39H...`, a 40-char hex string, a UUID. The user uses the example to recognise wrong-shaped pastes before they save.
  - *Pre-existing storage hints.* If the credential might already be in a typical location (a vendor CLI's config, a `.env` in another tool's directory, a password manager entry), note that — surfacing this in the hand-off saves the user from regenerating something they already have.

  Without this captured in research, the artifact's `.env.example` and the chat hand-off can't tell users where to obtain each value, and they'll have to ask. Treat this as a Phase 3 deliverable, not a "nice to have."
- **Read endpoints (all of them).** The default scope of the artifact is every non-destructive endpoint the API exposes. List, query, get, search, schema/discovery — research them all. For each: HTTP method, full path, required parameters, one example response body. Don't paraphrase response shapes — paste them.
- **Filter / query DSL** if the API has one. Verbatim operator list, escape rules, encoding rules.
- **Pagination** — parameter names, response cursor field, how to detect "last page."
- **Error shape** — what 4xx and 5xx bodies look like so the helper can surface them faithfully.
- **Gotchas** — rate limits with concrete numbers, regional restrictions, beta-flagged endpoints, content-type quirks (e.g. XML-only, multipart-required).

Write endpoints — research them only if the user later asks for them, or if the API exposes them in a way that's coupled to read endpoints (e.g. the read response includes write URLs). The default ship is reads-only; don't pre-research a write surface that the user hasn't asked for.

## How to gather it

1. Start with whatever Phase 2 surfaced (OpenAPI spec, SDK source, vendor sample, public API collection, archived doc page).
2. If the docs are the source: open the auth chapter, the endpoint reference for each read operation, and the "errors" / "common patterns" appendix. Copy verbatim — do not summarise yet.
3. If the SDK is the source: open the request-builder code and the test fixtures. Tests typically encode the exact wire shape.
4. If a captured request is the source: extract method, URL, headers (especially Authorization, Content-Type, Accept), and body. Run it once through `curl --verbose` to confirm response shape.

## Cross-checking

Before producing the artifact:

- Pick one endpoint from your specification and write the exact `curl` command you would run. If you can't write it without ambiguity, you don't have the spec yet — go back.
- For OAuth flows, confirm whether the user can self-create credentials (most modern SaaS) or whether a vendor representative has to issue them (some legacy enterprise software). The latter is a hand-off blocker — flag it.

## What to write down

Produce a short research note (in chat or a scratchpad) before building, structured as:

```
# <System> — research note

Base URL: ...
Auth: ... (exact header format, where credential comes from)
Session/state: ... (cookies? bearer refresh? per-request?)
Format: JSON / XML / both, default content-type, Accept negotiation rules

Read endpoints (every non-destructive operation the API exposes):
  - GET  /path/to/list           (params: foo, bar; example response: ...)
  - GET  /path/to/<resource>/<id>
  - GET  /path/to/search          (filter syntax: ...)
  - GET  /path/to/schema-or-introspection
  - ...

Filter DSL: ...
Pagination: ...
Errors: ...
Gotchas: ...

Credential acquisition (per .env variable):
  <VAR_NAME_1>:
    Plain-language description: ...
    Where the user obtains it (specific path or URL): ...
    Format / example: ...
    Self-serve or admin-issued: ...
    Pre-existing-storage hints: ...
  <VAR_NAME_2>:
    ...

Sources:
  - <doc URL #1>  (read on YYYY-MM-DD)
  - <SDK file path>
  - <captured request from user>
```

This research note is what you cite when you build the helper script in Phase 4. If a field of the helper's catalog can't trace back to a line in the research note, it's a guess — remove it or go research it.

## When research can't reach ground truth

If you've exhausted Phase 2 channels (5a–5h in `discovery.md`) and still can't produce a concrete spec for some endpoint, **say so explicitly** and decide with the user:

- Skip that endpoint for v1, ship the rest, plan to revisit when the user can capture a real request.
- Pause until the user can ask the vendor for an example.
- Drop the integration entirely if the missing piece is core (typically auth or pagination — without those the artifact can't function at all).

Do not paper over the gap with hand-wavy markdown. The user has no way to recover from "the assistant will figure it out at runtime."
