---
name: mcp-ui-development
description: Use when building interactive MCP tool UIs with MCP-UI/MCP Apps, including resource wiring, tool metadata, host compatibility, sandbox safety, and local validation.
---

# MCP UI Development

Build UI-enabled tools using MCP Apps as the default pattern.

## Default Stack (TypeScript)

1. Install server packages:
   - `npm install @mcp-ui/server @modelcontextprotocol/ext-apps`
2. Register an app resource with `registerAppResource`.
3. Register an app tool with `registerAppTool` and set `_meta.ui.resourceUri`.
4. Return both:
   - useful model-facing text content
   - tool/UI data needed by the widget

## Host Compatibility

- MCP Apps hosts: prefer `_meta.ui.resourceUri` flow.
- ChatGPT Apps SDK: use the adapter/template flow (`openai/outputTemplate`, `text/html+skybridge`) when ChatGPT-specific support is required.
- Legacy MCP-UI widgets: use adapter/migration path only if maintaining older `postMessage` widgets.

## Security and UX Rules

- Treat widget input as untrusted; validate on the server.
- Keep UI in sandboxed iframe-compatible resources.
- Restrict external links and only allow expected URL schemes.
- Keep fallback text so the tool remains useful without UI rendering.

## Host Interop Baseline (Required)

When targeting MCP Apps hosts, apply this baseline by default:

- Resource MIME type: `text/html;profile=mcp-app`.
- Prefer self-contained resource HTML (inline CSS/JS) to avoid host-relative asset fetch failures.
- Set tool-level metadata in `tools/list`:
  - `_meta["ui/resourceUri"]`
  - `_meta["openai/outputTemplate"]`
  - `_meta["openai/widgetAccessible"] = true` (if widget must call tools)
- Keep tool-result metadata too:
  - `_meta.ui.resourceUri`
  - compatibility keys above when needed
- Implement app lifecycle + sizing messages from iframe:
  - `ui/initialize`
  - `ui/notifications/initialized`
  - `ui/notifications/size-changed` (and compatibility `size-change`)
  - Handle `ui/notifications/tool-result` payload updates (many hosts deliver tool data through this path, not only direct `postMessage` payloads).

## Host Theme Baseline (Required)

When targeting MCP Apps hosts, host theme must be the primary CSS source:

- Use host-provided style variables as first-class tokens for colors, text, borders, shadows, and fonts.
- Keep local CSS focused on layout/spacing/geometry; do not hardcode primary color palettes.
- Apply host theme/context updates on runtime messages (for example host context changed notifications).
- Keep fallback values minimal and neutral; they are safety nets, not a design system.
- Avoid per-widget custom brand palettes for core controls (toolbars, buttons, pills, code surfaces) unless explicitly product-approved.
- Visual tone should feel host-native and restrained: avoid styles that "pop" more than surrounding thread UI.
- Prefer low-contrast surfaces, subtle borders, and compact typography scale that blends into host chrome.
- Match host spacing density and card rhythm before adding any decorative treatment.

## Runtime Build Requirement (Required)

- Treat UI runtime bundling as part of normal server build, not an optional post-step.
- `tsc` output alone is insufficient for widget runtimes that rely on browser-ready bundled assets.
- Ensure `npm run build` produces runtime artifacts expected by resource loading (for example `preview-runtime.js`, `config-editor-runtime.js`).
- Prefer a single parameterized build script for UI runtimes over duplicated per-widget scripts.
- Keep resource contract paths and build outputs aligned:
  - `resources/read` must read files that the build step actually emits.
  - If runtime file names/locations change, update both build script targets and resource loading code in the same change.

## UI Event Tracking Pattern

- Define custom events freely in widget UI (e.g., `widget_expanded`, `widget_collapsed`, `render_fallback_raw`).
- Send events via `tools/call` to a server-side tool (e.g., `track_ui_event`).
- Keep analytics forwarding server-side (GA/API secrets never in iframe).
- Exclude telemetry tool calls from onboarding/feedback text injection.

## Analytics-First Component Rule (Required)

- Every MCP UI component must ship with analytics hooks from day one.
- Decide analytics placement before coding UI interactions:
  - toolbar actions
  - expand/collapse transitions
  - mode toggles
  - submit/confirm/cancel/error states
- Track both intent and outcome events for tool writes:
  - example pair: `config_apply_clicked` and `config_apply_succeeded` / `config_apply_failed`
- Always include stable event params:
  - `component`
  - `tool_name`
  - `resource_uri`
  - `expanded` (when relevant)
  - key context (`file_type`, `config_key`, `mode`, etc.)
- For expanded/collapsed interactions, always record which tool card was toggled.

## Tool Call Interactivity Pattern (Required)

- Keep interactive config/state editors attached to the read tool (example: `get_config`), not the write tool.
- From widget UI, call write tools through the bridge:
  - first try host helper bridge (`window.openai.callTool` / `window.mcp.callTool`)
  - always implement JSON-RPC fallback via `postMessage` + `tools/call` with request id correlation
- After successful write, immediately call the read tool again and re-render from returned `structuredContent`.
- Treat widget-local state as temporary; server response is source of truth.

## Consistent UI Baseline (Required)

- Use the `read_file` UI as the baseline interaction language for new MCP widgets:
  - metadata-first toolbar header
  - compact action buttons on the right
  - details panel below header
  - clean empty-state fallback
- Reuse shared component patterns (toolbar/actions/badges/panel shell) instead of inventing per-tool layouts.
- Keep visual rhythm consistent across widgets:
  - same spacing scale
  - same button sizing
  - same badge and status treatment
  - same collapsed/expanded behavior
- Favor minimal, integrated presentation over standout branding:
  - no loud gradients or saturated accents by default
  - avoid heavy shadows and oversized controls
  - prioritize readability and host visual continuity over novelty

## Visual Integration Examples

- Do:
  - use host theme variables for card/background/text/button states
  - keep borders subtle and component density compact
  - align with host card/header spacing and typography scale
- Don't:
  - introduce bright accent-heavy palettes for core actions/surfaces
  - rely on large shadows, glowing effects, or novelty animations
  - create standalone branded "mini-app" visuals inside tool cards

## Collapsed-First Tool Card Pattern (Required)

- All tool-wrapped MCP UI components start collapsed by default.
- Provide one reusable toolbar-style header component for tool cards:
  - title + tool identity
  - primary status badges
  - expand/collapse control
  - optional quick actions
- Expanding/collapsing must be explicit user action (no surprise auto-expand after render, except fatal errors).
- Emit analytics on both transitions:
  - `widget_expanded`
  - `widget_collapsed`
- Include tool identity in event params (for example `tool_name: "get_config"`).

## Confirmation and Pause Limits (Required)

- Do not assume widget can send direct assistant/user chat messages into transcript.
- Do not assume widget can globally pause assistant execution with a host modal.
- For sensitive actions, enforce confirmation server-side with two tools:
  - `*_prepare` / draft tool (no side effects)
  - `*_confirm` / apply tool (side effects only with explicit confirmation token or state)
- Widget confirmation UI is allowed, but must not be the only enforcement layer.

## Validation Checklist

- Tool works without UI.
- `resources/list` exposes UI resource URI.
- `resources/read` returns expected MCP Apps resource MIME + HTML.
- `tools/list` includes required tool-level app metadata.
- UI renders from the registered resource URI.
- UI colors/surfaces/typography primarily resolve from host theme variables.
- UI does not visually overpower adjacent host messages/cards (integrated, minimal presentation).
- Error states render understandable output.
- Host-specific path (MCP Apps vs ChatGPT Apps SDK) is explicitly tested.

## Recent Failure Modes (Must Avoid)

1. Hidden iframe with reserved space and no UI:
   - Symptom: host shows app container with `visibility: hidden` and height `0`.
   - Common cause: widget did not complete lifecycle/size handshake or did not process `ui/notifications/tool-result`.
   - Guardrail: always implement initialize + initialized + repeated size notifications after render and on resize.

2. Inline script truncation in resource HTML:
   - Symptom: app never boots, no visible UI, no explicit host error.
   - Common cause: embedding bundled JS directly inside `<script>...</script>` without escaping `</script`.
   - Guardrail: escape inline payloads before embedding:
     - replace `</script` with `<\\/script`
     - replace `</style` with `<\\/style`

3. Regressing UX while fixing host wiring:
   - Symptom: app renders but loses expand/collapse and polished metadata layout.
   - Guardrail: keep host lifecycle logic separate from UI state logic so transport fixes do not flatten UX behavior.

4. Bridge helper unavailable despite valid UI render:
   - Symptom: widget shows "bridge unavailable" though lifecycle messages work and iframe is visible.
   - Common cause: host did not inject `openai.callTool` / `mcp.callTool` helper APIs for this app context.
   - Guardrail: implement JSON-RPC `tools/call` fallback over `postMessage`; resolve by request `id` and handle timeout/error paths.

5. Stale config after apply:
   - Symptom: write reports success but widget still shows old values.
   - Common cause: widget does not re-read canonical config after `set_config_value`.
   - Guardrail: always perform read-after-write (`get_config`) and re-render from fresh payload.

6. Over-styled widget that fights host theme:
   - Symptom: widget looks visually disconnected (too blue/neon/high-contrast vs thread theme).
   - Common cause: hardcoded local palette overriding host variables for primary surfaces/actions.
   - Guardrail: keep host-theme-first token mapping; reserve local tokens for spacing/layout only.
