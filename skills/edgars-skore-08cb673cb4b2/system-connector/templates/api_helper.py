#!/usr/bin/env python3
"""
api_helper.py — TEMPLATE for a system-specific REST API helper.

This is a stdlib-only skeleton. Specialise it per integration:
  1. Rename the file to <system>.py.
  2. Set SYSTEM_NAME below to the slug for the connected system.
  3. Replace _auth_header with the system's auth scheme.
  4. Replace parse_body / serialise_body if the API uses XML/multipart/etc.
  5. Add subcommands matching the use cases researched in Phase 3.
  6. Write test_<system>.py covering URL building, auth header, parsing,
     env-path resolution, and a real fixture from the docs.

Determinism contract — keep these:
  - stdlib only — no `pip install` required to run.
  - JSON output to stdout, errors to stderr with non-zero exit.
  - Output JSON must NEVER contain credential values. Errors say "TOKEN looks
    wrong" without echoing the token; `test` reports auth-check outcomes,
    not the credentials used.
  - Credentials live at <active-host-root>/connectors/<SYSTEM_NAME>/.env.
    The helper resolves this automatically from its installed location; do NOT
    look in the artifact directory and do NOT hardcode a host name.
  - The `setup` subcommand creates the empty .env from .env.example
    (idempotent — never overwrites). Every other subcommand refuses to run
    when .env is missing and points at `setup`.
  - Session/cookie state lives next to .env (same directory, NOT inside the
    artifact). Cookies encode auth state; treat them like credentials.
  - Surface error response bodies verbatim.
"""

from __future__ import annotations

import argparse
import base64
import http.cookiejar
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Per-system specialisation — set these for each integration.
# ---------------------------------------------------------------------------

# Lowercase, hyphen-separated. Used as the directory name under
# <active-host-root>/connectors/. Use only [a-z0-9-].
SYSTEM_NAME = "<system>"

# Required env vars. Edit per system.
REQUIRED_VARS = ("SYSTEM_BASE_URL", "SYSTEM_TOKEN")

# Optional env vars (the helper reads them if present, but doesn't error if
# missing). Useful for things like SYSTEM_TIMEOUT, SYSTEM_VERIFY_TLS, etc.
OPTIONAL_VARS = ("SYSTEM_TIMEOUT",)

HERE = Path(__file__).resolve().parent
CATALOG_PATH = HERE / "catalog.json"  # read-only spec — fine in artifact dir


# ---------------------------------------------------------------------------
# Credential file location — see reference/credentials.md
# ---------------------------------------------------------------------------

def _host_root_from_layout() -> Path | None:
    """Infer the active host root from the helper's installed location.

    We look for the nearest ancestor named `skills` and use its parent as the
    active host root. This works for both installed helpers and the bundled
    template living inside an already-installed `system-connector` skill.
    """
    here = Path(__file__).resolve()
    for parent in here.parents:
        if parent.name == "skills":
            return parent.parent
    return None


def _env_path() -> Path:
    """Resolve where this connector's .env lives.

    Path is derived from where the helper itself is installed, so the real
    credential file lives alongside the active host that installed the skill.
    No host-name detection logic — purely structural.

    Resolution order:
      1. CONNECTOR_ENV_PATH env var (override; tests, CI, dev).
      2. Inferred from the nearest ancestor named `skills`.
      3. If neither works, fail clearly rather than guessing another host.
    """
    override = os.environ.get("CONNECTOR_ENV_PATH")
    if override:
        return Path(override).expanduser().resolve()

    host_root = _host_root_from_layout()
    if host_root is not None:
        return host_root / "connectors" / SYSTEM_NAME / ".env"

    raise RuntimeError(
        "Cannot resolve the active host root from this helper's path. "
        "Install the helper under <active-host-root>/skills/<system>/ or set "
        "CONNECTOR_ENV_PATH for tests, CI, or non-standard development."
    )


def _safe_env_path() -> Path:
    try:
        return _env_path()
    except RuntimeError as e:
        die(str(e), code=4)


def _session_path() -> Path:
    """Cookie jar lives next to .env, not in the artifact directory.
    Cookies encode auth state, so they belong in user-scope config."""
    return _safe_env_path().parent / ".session"


def _load_env() -> dict:
    """Read .env from the user-scope path. Returns empty dict if file is
    missing — caller checks _env_status() to handle that case explicitly."""
    cfg: dict = {}
    env_path = _safe_env_path()
    if env_path.exists():
        for raw in env_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            cfg[k.strip()] = v.strip().strip('"').strip("'")
    # Process env vars override anything in the file.
    for k in REQUIRED_VARS + OPTIONAL_VARS:
        if os.environ.get(k):
            cfg[k] = os.environ[k]
    return cfg


def _env_status() -> dict:
    """Structured status of the credential file. Reveals path and existence,
    NEVER contents."""
    p = _safe_env_path()
    return {"env_path": str(p), "exists": p.exists()}


def _require(cfg: dict, *keys: str) -> None:
    env_path = _safe_env_path()
    if not env_path.exists():
        die_setup_required(env_path)
    missing = [k for k in keys if not cfg.get(k)]
    if missing:
        die(
            f"Missing values in {env_path}: {', '.join(missing)}.\n"
            f"Open the file in a text editor and fill them in. The assistant "
            f"never reads this file — fill it in yourself.",
        )


def die(msg: str, code: int = 2) -> None:
    print(json.dumps({"ok": False, "error": msg}, ensure_ascii=False, indent=2),
          file=sys.stderr)
    sys.exit(code)


def die_setup_required(env_path: Path) -> None:
    """Specialised error for the no-.env case. Points at the path and tells
    the user the one command that creates the empty template. Does NOT
    expose any credential values."""
    helper_name = Path(__file__).name
    instructions = (
        f"No credentials found.\n"
        f"\n"
        f"Expected location: {env_path}\n"
        f"\n"
        f"To create an empty template at that path, run:\n"
        f"  python3 {helper_name} setup\n"
        f"\n"
        f"Or ask the assistant to set up credentials — it'll run setup for you "
        f"and link the file so you can fill it in directly. The assistant never "
        f"reads what you put in the file; the helper reads it locally on your "
        f"machine to make API calls."
    )
    die(instructions, code=3)


def _load_catalog() -> dict[str, Any]:
    if not CATALOG_PATH.exists():
        return {}
    try:
        loaded = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        die(f"Could not parse catalog.json at {CATALOG_PATH}: {e}")
    return loaded if isinstance(loaded, dict) else {}


def _parse_params(values: list[str] | None) -> dict[str, str]:
    params: dict[str, str] = {}
    for kv in values or []:
        if "=" not in kv:
            die(f"Expected key=value pair, got: {kv!r}")
        k, v = kv.split("=", 1)
        params[k] = v
    return params


# ---------------------------------------------------------------------------
# HTTP layer
# ---------------------------------------------------------------------------

def _normalise_base(base: str) -> str:
    """Normalise the base URL. Override per system if there's an /api or /rest
    suffix that should be auto-appended or stripped."""
    return base.rstrip("/")


def _opener() -> urllib.request.OpenerDirector:
    """Build an HTTP opener with a persistent cookie jar at _session_path()."""
    sp = _session_path()
    sp.parent.mkdir(parents=True, exist_ok=True)
    jar = http.cookiejar.MozillaCookieJar(str(sp))
    if sp.exists():
        try:
            jar.load(ignore_discard=True)
        except Exception:
            pass
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))


def _save_cookies(opener: urllib.request.OpenerDirector) -> None:
    for h in opener.handlers:
        if isinstance(h, urllib.request.HTTPCookieProcessor):
            try:
                h.cookiejar.save(ignore_discard=True)
            except Exception:
                pass


def _auth_header(cfg: dict) -> str:
    """Build the Authorization header. Replace with the system's actual scheme.
    Examples:

    # Bearer token
    return "Bearer " + cfg["SYSTEM_TOKEN"]

    # Basic auth (user:password)
    raw = f"{cfg['SYSTEM_USER']}:{cfg['SYSTEM_PASSWORD']}".encode()
    return "Basic " + base64.b64encode(raw).decode("ascii")

    # Custom scheme (signed timestamp, etc.) — implement here.
    """
    return "Bearer " + cfg["SYSTEM_TOKEN"]


def http_call(cfg: dict, method: str, path: str, *,
              data: bytes | None = None,
              accept: str = "application/json",
              content_type: str | None = None,
              query: dict | None = None,
              auth: bool = True) -> tuple[int, dict, bytes]:
    """Single low-level HTTP call. Returns (status, headers, body_bytes)."""
    if auth:
        _require(cfg, *REQUIRED_VARS)
    base = _normalise_base(cfg.get("SYSTEM_BASE_URL", ""))
    if not base:
        die("SYSTEM_BASE_URL not set. Edit your .env file.")
    url = base + (path if path.startswith("/") else "/" + path)
    if query:
        parts = []
        for k, v in query.items():
            if v is None:
                continue
            ek = urllib.parse.quote(str(k), safe="")
            ev = urllib.parse.quote(str(v), safe="")
            parts.append(f"{ek}={ev}")
        if parts:
            url += ("&" if "?" in url else "?") + "&".join(parts)

    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", accept)
    if auth:
        req.add_header("Authorization", _auth_header(cfg))
    if content_type:
        req.add_header("Content-Type", content_type)

    opener = _opener()
    timeout = float(cfg.get("SYSTEM_TIMEOUT", "30"))
    try:
        with opener.open(req, timeout=timeout) as resp:
            body = resp.read()
            status = resp.status
            headers = {k: v for k, v in resp.headers.items()}
    except urllib.error.HTTPError as e:
        body = e.read() if e.fp else b""
        status = e.code
        headers = {k: v for k, v in (e.headers or {}).items()}
    except urllib.error.URLError as e:
        die(f"Network error reaching {url}: {e.reason}")
    _save_cookies(opener)
    return status, headers, body


# ---------------------------------------------------------------------------
# Parse/serialise — replace per system if the API uses XML, multipart, etc.
# ---------------------------------------------------------------------------

def parse_body(body: bytes) -> Any:
    if not body:
        return None
    try:
        return json.loads(body.decode("utf-8"))
    except Exception as e:
        return {"@parse_error": str(e),
                "raw": body[:2000].decode("utf-8", "replace")}


def serialise_body(value: Any) -> bytes:
    return json.dumps(value, ensure_ascii=False).encode("utf-8")


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_where(cfg, args):
    """Print where this connector expects its .env. NEVER reveals contents."""
    s = _env_status()
    out = {
        "ok": True,
        "system": SYSTEM_NAME,
        "env_path": s["env_path"],
        "exists": s["exists"],
        "session_path": str(_session_path()),
    }
    if not s["exists"]:
        out["hint"] = (
            f"No .env file at {s['env_path']}. Run `python3 {Path(__file__).name} "
            f"setup` to create an empty template, then fill it in. The assistant "
            f"never reads the values you put in this file."
        )
    print(json.dumps(out, indent=2, ensure_ascii=False))


def cmd_setup(cfg, args):
    """Create the empty .env at the canonical user-scope path if missing.

    Idempotent. Never overwrites an existing file. Never writes secrets —
    only copies the bundled .env.example template, whose values are blank.
    """
    env_path = _safe_env_path()
    example = Path(__file__).resolve().parent / ".env.example"
    if env_path.exists():
        print(json.dumps({
            "ok": True,
            "action": "noop",
            "env_path": str(env_path),
            "message": (
                f"Credentials file already exists. Open it to edit: "
                f"{env_path}. The assistant never reads its contents."
            ),
        }, indent=2, ensure_ascii=False))
        return
    if not example.exists():
        die(f"Cannot find bundled .env.example at {example}.")
    env_path.parent.mkdir(parents=True, exist_ok=True)
    env_path.write_text(example.read_text(encoding="utf-8"), encoding="utf-8")
    try:
        os.chmod(env_path, 0o600)
    except OSError:
        pass  # non-POSIX or permission denied; not fatal
    print(json.dumps({
        "ok": True,
        "action": "created",
        "env_path": str(env_path),
        "message": (
            f"Empty credentials file created at {env_path}. Open it to fill in "
            f"your values. The assistant never reads what you put in."
        ),
    }, indent=2, ensure_ascii=False))


def cmd_test(cfg, args):
    """Structured connection diagnostic. Replace endpoints with real ones."""
    report = {"ok": True, "checks": []}

    # 0. .env file exists?
    s = _env_status()
    report["checks"].append({
        "name": "env_file_exists",
        "ok": s["exists"],
        "env_path": s["env_path"],
        **({"hint":
            f"Create the file at {s['env_path']} from this skill's "
            f".env.example. The assistant never reads it."} if not s["exists"] else {})
    })
    if not s["exists"]:
        report["ok"] = False
        print(json.dumps(report, indent=2, ensure_ascii=False))
        sys.exit(1)

    # 1. Required values present?
    missing = [k for k in REQUIRED_VARS if not cfg.get(k)]
    report["checks"].append({
        "name": "required_values_present",
        "ok": not missing,
        **({"missing": missing,
            "hint": f"Open {s['env_path']} and fill in: {', '.join(missing)}"} if missing else {})
    })
    if missing:
        report["ok"] = False
        print(json.dumps(report, indent=2, ensure_ascii=False))
        sys.exit(1)

    # 2. Anonymous reachability — pick an endpoint that doesn't need auth.
    try:
        status, _, body = http_call(cfg, "GET", "/health", auth=False)
    except SystemExit:
        report["checks"].append({
            "name": "reachable", "ok": False,
            "hint": "Network error. If the service is VPN-only or behind a "
                    "firewall, connect first.",
        })
        report["ok"] = False
        print(json.dumps(report, indent=2, ensure_ascii=False))
        sys.exit(1)
    report["checks"].append({"name": "reachable", "ok": status < 500, "status": status})

    # 3. Auth — pick a known-authenticated endpoint (e.g. /me, /user, /whoami).
    status, headers, body = http_call(cfg, "GET", "/me")
    if status == 401:
        report["checks"].append({
            "name": "auth", "ok": False, "status": 401,
            "advertised": headers.get("WWW-Authenticate", ""),
            "hint": ("Wrong credential, or this deployment uses a different "
                     "auth method than expected. Check the WWW-Authenticate "
                     "header to see what the server accepts."),
        })
        report["ok"] = False
    elif status == 403:
        report["checks"].append({"name": "auth", "ok": False, "status": 403,
                                 "hint": "Auth ok but missing permission scope on the credential."})
        report["ok"] = False
    elif 200 <= status < 300:
        report["checks"].append({"name": "auth", "ok": True, "status": status,
                                 "data": parse_body(body)})
    else:
        report["checks"].append({"name": "auth", "ok": False, "status": status,
                                 "body_preview": body[:400].decode("utf-8", "replace")})
        report["ok"] = False

    print(json.dumps(report, indent=2, ensure_ascii=False))
    if not report["ok"]:
        sys.exit(1)


def cmd_services(cfg, args):
    """List top-level services/classes from the bundled catalog or OpenAPI."""
    catalog = _load_catalog()
    classes = catalog.get("classes") if isinstance(catalog.get("classes"), dict) else {}
    if classes:
        services = [
            {
                "name": name,
                "kind": entry.get("kind", "unknown"),
                "description": entry.get("description_en", ""),
            }
            for name, entry in sorted(classes.items())
        ]
        print(json.dumps({
            "ok": True,
            "source": "catalog",
            "services": services,
        }, indent=2, ensure_ascii=False))
        return

    status, _, body = http_call(cfg, "GET", "/openapi.json", auth=False)
    if status == 200:
        spec = parse_body(body) or {}
        paths = sorted((spec.get("paths") or {}).keys()) if isinstance(spec, dict) else []
        print(json.dumps({
            "ok": True,
            "source": "openapi",
            "services": paths,
        }, indent=2, ensure_ascii=False))
        return

    die("No bundled service catalog and no readable OpenAPI at /openapi.json. Specialise cmd_services for this system.")


def cmd_schema(cfg, args):
    """Return the bundled schema hint for an entity.

    Many systems expose vendor-specific schema endpoints, so the template reads
    from catalog.json by default and asks the integrator to specialise further
    when richer live schema inspection is needed.
    """
    catalog = _load_catalog()
    classes = catalog.get("classes") if isinstance(catalog.get("classes"), dict) else {}
    entry = classes.get(args.entity)
    if entry is None:
        die(
            f"No bundled schema entry for {args.entity!r}. Add it to catalog.json "
            f"or specialise cmd_schema for this vendor's schema endpoint."
        )
    print(json.dumps({
        "ok": True,
        "entity": args.entity,
        "schema": entry,
    }, indent=2, ensure_ascii=False))


def cmd_entity_get(cfg, args):
    status, _, body = http_call(cfg, "GET", f"/{args.entity}/{args.id}")
    _emit(status, body)


def cmd_entity_list(cfg, args):
    status, _, body = http_call(
        cfg,
        "GET",
        f"/{args.entity}",
        query=_parse_params(args.param),
    )
    _emit(status, body)


def cmd_entity_query(cfg, args):
    query = _parse_params(args.param)
    if args.filter:
        query["filter"] = args.filter
    status, _, body = http_call(cfg, "GET", f"/{args.entity}", query=query)
    _emit(status, body)


def cmd_entity(cfg, args):
    handlers = {
        "get": cmd_entity_get,
        "list": cmd_entity_list,
        "query": cmd_entity_query,
    }
    handlers[args.entity_cmd](cfg, args)


def cmd_get(cfg, args):
    cmd_entity_get(cfg, args)


def cmd_list(cfg, args):
    cmd_entity_list(cfg, args)


def cmd_query(cfg, args):
    cmd_entity_query(cfg, args)


def cmd_create(cfg, args):
    payload = json.loads(sys.stdin.read() if args.json == "-" else Path(args.json).read_text())
    status, _, body = http_call(
        cfg, "POST", f"/{args.entity}",
        data=serialise_body(payload),
        content_type="application/json")
    _emit(status, body, expect=(200, 201))


def cmd_update(cfg, args):
    # Fetch -> patch -> PUT pattern. Override to PATCH semantics if the API
    # supports it natively.
    status, _, body = http_call(cfg, "GET", f"/{args.entity}/{args.id}")
    if status != 200:
        die(f"Could not fetch existing record: HTTP {status}")
    existing = parse_body(body) or {}
    patch = json.loads(sys.stdin.read() if args.json == "-" else Path(args.json).read_text())
    if isinstance(existing, dict) and isinstance(patch, dict):
        existing.update(patch)
        merged = existing
    else:
        merged = patch  # caller supplied full body
    status, _, body = http_call(
        cfg, "PUT", f"/{args.entity}/{args.id}",
        data=serialise_body(merged),
        content_type="application/json")
    _emit(status, body, expect=(200, 204))


def cmd_delete(cfg, args):
    status, _, body = http_call(cfg, "DELETE", f"/{args.entity}/{args.id}")
    _emit(status, body, expect=(200, 204))


def cmd_raw(cfg, args):
    data = args.data.encode() if args.data else None
    ct = args.content_type if args.data else None
    status, _, body = http_call(
        cfg, args.method.upper(), args.path,
        data=data, content_type=ct,
        accept=args.accept or "application/json")
    _emit(status, body)


def cmd_discover(cfg, args):
    """Hit the API's introspection endpoint (OpenAPI, GraphQL schema,
    HATEOAS root, etc.) and write catalog.json. Specialise per system."""
    status, _, body = http_call(cfg, "GET", "/openapi.json")
    if status != 200:
        die("No OpenAPI at /openapi.json. Specialise cmd_discover for this system.")
    spec = parse_body(body)
    catalog = {"discovered_at": _now(), "openapi": spec}
    # Discovered catalog goes next to the credential file (user-scope), since
    # it's deployment-specific.
    out_path = _safe_env_path().parent / "catalog.discovered.json"
    out_path.write_text(json.dumps(catalog, indent=2, ensure_ascii=False))
    print(json.dumps({"ok": True, "wrote": str(out_path)}, indent=2))


def cmd_catalog(cfg, args):
    if not CATALOG_PATH.exists():
        die("No catalog cached. Run: python3 helper.py discover")
    print(CATALOG_PATH.read_text())


# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def _emit(status: int, body: bytes, *, expect: tuple = (200,)) -> None:
    parsed = parse_body(body) if body else None
    payload = {"ok": status in expect, "status": status, "data": parsed}
    if not payload["ok"] and body:
        payload["body_preview"] = body[:600].decode("utf-8", "replace")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    if not payload["ok"]:
        sys.exit(1)


def _now() -> str:
    import datetime
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main(argv: list[str]) -> None:
    p = argparse.ArgumentParser(prog="helper")
    sp = p.add_subparsers(dest="cmd", required=True)
    sp.add_parser("setup", help="Create the empty credentials file at the canonical path (idempotent; never overwrites)")
    sp.add_parser("where", help="Print where this connector's .env is expected")
    sp.add_parser("test", help="Connection + auth diagnostic")
    sp.add_parser("services", help="List top-level services/classes from the bundled catalog or OpenAPI")
    sp.add_parser("discover")
    sp.add_parser("catalog")
    s = sp.add_parser("schema", help="Show the bundled schema hint for an entity")
    s.add_argument("entity")
    e = sp.add_parser("entity", help="Generic entity-level read commands")
    esp = e.add_subparsers(dest="entity_cmd", required=True)
    s = esp.add_parser("get"); s.add_argument("entity"); s.add_argument("id")
    s = esp.add_parser("list"); s.add_argument("entity")
    s.add_argument("--param", action="append", help="key=value (repeatable)")
    s = esp.add_parser("query"); s.add_argument("entity")
    s.add_argument("--filter", help="Vendor-specific query/filter string")
    s.add_argument("--param", action="append", help="key=value (repeatable)")
    # Convenience aliases for the generic entity commands.
    s = sp.add_parser("get", help="Alias for `entity get`"); s.add_argument("entity"); s.add_argument("id")
    s = sp.add_parser("list", help="Alias for `entity list`"); s.add_argument("entity")
    s.add_argument("--param", action="append", help="key=value (repeatable)")
    s = sp.add_parser("query", help="Alias for `entity query`"); s.add_argument("entity")
    s.add_argument("--filter", help="Vendor-specific query/filter string")
    s.add_argument("--param", action="append", help="key=value (repeatable)")
    # cmd_create / cmd_update / cmd_delete are defined above as REFERENCE
    # implementations only. Default ship is reads-only; the user opts in to
    # writes later by asking, and you wire the relevant subcommand at that
    # point with confirmation gating.
    s = sp.add_parser("raw"); s.add_argument("method"); s.add_argument("path")
    s.add_argument("--data"); s.add_argument("--content-type", dest="content_type",
                                              default="application/json")
    s.add_argument("--accept")
    args = p.parse_args(argv)
    cfg = _load_env()
    handlers = {
        "setup": cmd_setup, "where": cmd_where, "test": cmd_test,
        "services": cmd_services, "discover": cmd_discover,
        "catalog": cmd_catalog, "schema": cmd_schema,
        "entity": cmd_entity, "get": cmd_get, "list": cmd_list,
        "query": cmd_query,
        # write handlers (cmd_create / cmd_update / cmd_delete) intentionally
        # NOT mapped — see comment in argparse setup above.
        "raw": cmd_raw,
    }
    handlers[args.cmd](cfg, args)


if __name__ == "__main__":
    main(sys.argv[1:])
