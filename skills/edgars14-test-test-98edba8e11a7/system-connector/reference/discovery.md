# Phase 2 — Discovery

Goal: do not build a new connector when the current host or the public ecosystem already gives the user a safe, usable option.

This phase is capability-driven, not tool-ID-driven. Use whatever registry, marketplace, installed-skill list, tool catalog, or web-search surface the current host exposes. If a specific search tool is available, use it. If it is not, continue with the generic steps below instead of stalling.

## 1. Check what the current host already exposes

Before researching anything new:

- Scan the current session's available tools, skills, plugins, and apps for the product name, vendor name, and close synonyms.
- If the current host already exposes connected tools for the service, use or suggest those and stop.
- If the current host exposes an installable plugin/skill that clearly covers the service, recommend that instead of building a new helper.

Examples of useful capability surfaces:

- A registry/marketplace search tool
- The available-skills list
- The available-tools list
- A host UI that already labels installed apps/plugins/connectors

Do not require any one exact tool name. The rule is "use the host's existing discovery surface if it exists."

## 2. Search for public MCP servers or existing skill bundles

If the current host does not already expose the integration:

- Search the web for `"<system name> MCP server"` and `"<system name> model context protocol"`
- Search for existing public skill bundles or plugins for the product

Rules:

- Only recommend a public MCP server if you can read its source.
- If a marketplace listing exists but the source is private, gated, or unreadable, treat it as not-found.
- If a public skill/plugin exists but the current host has no clear way to install it, keep researching instead of assuming the user can wire it up manually.

If discovery finds a safe public MCP with readable source, route to `reference/output_mcp_config.md`.

## 3. Search the vendor's official surface

If nothing reusable is already available, search the vendor's official materials:

- Official API docs
- Official SDK/source repositories
- Official sample code
- Official OpenAPI/Swagger endpoints
- Official help-center or admin documentation that explains how users obtain credentials or base URLs

This is the preferred ground truth for anything that will become part of the artifact.

## 4. The docs are JavaScript-rendered — keep going

If the host's fetch/browser tool returns an empty SPA shell or `<noscript>` page, try the usual escape hatches in order:

1. Direct content URLs
2. `sitemap.xml` and `robots.txt`
3. Web archive snapshots
4. Vendor SDK/tests/sample code
5. OpenAPI/Swagger probes such as `/openapi.json`, `/swagger.json`, `/api-docs`, `/redoc`
6. Public API collections
7. Vendor-hosted forums or recent Q&A answers with real request examples
8. A user-provided "Copy as cURL" example from their own browser session

Do not stop at "the docs are a SPA" if other concrete sources are still available.

## 5. When discovery succeeds

If you find one clearly best option, tell the user what you found and why it fits.

If you find multiple genuinely low-friction options, present only the 2-3 easiest paths with one-line trade-offs and recommend one.

## 6. When discovery fails

If you have exhausted the host's discovery surfaces plus the public/vendor sources above and still do not have a safe reusable option, continue to Phase 3 research.

Do not invent runtime-magic behavior such as "the assistant can figure it out later." Either you found something concrete, or you did not.
