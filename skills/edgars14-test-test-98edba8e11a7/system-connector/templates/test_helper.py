"""
test_helper.py — TEMPLATE for a system-specific helper test file.

Specialise this alongside api_helper.py:
  1. Rename to test_<system>.py.
  2. Replace fixtures with real payloads pulled from the docs you read in Phase 3.
  3. Add tests for any system-specific concerns: filter DSL encoding, custom
     auth header construction, pagination cursor extraction, error-body shape.
  4. All tests must pass with zero network access. We monkeypatch the opener
     so no real HTTP happens, and we point CONNECTOR_ENV_PATH at a temp file
     so the real user credential file is never touched.

Run with:  python3 test_helper.py
Exits non-zero if any check fails.
"""
from __future__ import annotations
import base64
import json
import os
import sys
import tempfile
import urllib.parse
from pathlib import Path

# Point the helper at a temp .env BEFORE importing it, so _load_env() at
# import time (if any) doesn't read the user's real credentials.
_TMP_DIR = tempfile.mkdtemp(prefix="connector-test-")
_TMP_ENV = (Path(_TMP_DIR) / ".env").resolve()
os.environ["CONNECTOR_ENV_PATH"] = str(_TMP_ENV)

sys.path.insert(0, str(Path(__file__).parent))
import api_helper as helper  # rename import to your specialised module

results: list[tuple[str, bool, str]] = []


def t(name: str, ok: bool, detail: str = "") -> None:
    results.append((name, ok, detail))
    tag = "OK" if ok else "FAIL"
    suffix = f"  -- {detail}" if detail and not ok else ""
    print(f"  [{tag}] {name}{suffix}")


# ---------------------------------------------------------------------------
# Monkey-patch the opener so no real HTTP happens
# ---------------------------------------------------------------------------


class FakeResp:
    def __init__(self, body: bytes = b"{}", status: int = 200, headers=None):
        self._body = body
        self.status = status
        self.headers = headers or {}

    def read(self) -> bytes: return self._body
    def __enter__(self): return self
    def __exit__(self, *a): return False


captured: dict = {}


class FakeOpener:
    handlers: list = []

    def __init__(self, body=b"{}", status=200, headers=None):
        self.body, self.status, self.headers = body, status, headers or {}

    def open(self, req, timeout=None):
        captured["url"] = req.full_url
        captured["method"] = req.get_method()
        captured["headers"] = dict(req.headers)
        captured["data"] = req.data
        return FakeResp(self.body, self.status, self.headers)


def install_fake(body=b"{}", status=200, headers=None):
    helper._opener = lambda: FakeOpener(body, status, headers)
    helper._save_cookies = lambda *_a, **_k: None


# ---------------------------------------------------------------------------
# 1. Env path resolution
# ---------------------------------------------------------------------------

print("\n== Env path resolution ==")

# With CONNECTOR_ENV_PATH set (as we did at the top of this file), _env_path
# should return that override.
t("CONNECTOR_ENV_PATH override honoured",
  str(helper._env_path()) == str(_TMP_ENV),
  f"got {helper._env_path()}, want {_TMP_ENV}")

# Clearing the override should make _env_path resolve from the active host's
# installed `skills/` tree rather than guessing a different host.
saved = os.environ.pop("CONNECTOR_ENV_PATH")
try:
    p = helper._env_path()
    host_root = helper._host_root_from_layout()
    expected = host_root / "connectors" / helper.SYSTEM_NAME / ".env"
    t("default path resolves from the active host root",
      p == expected,
      f"got {p}, want {expected}")
finally:
    os.environ["CONNECTOR_ENV_PATH"] = saved

# Session path lives next to .env, not in the artifact directory.
t("session path is sibling to env path",
  helper._session_path() == _TMP_ENV.parent / ".session",
  f"got {helper._session_path()}")


# ---------------------------------------------------------------------------
# 2. _require behaviour when .env is missing
# ---------------------------------------------------------------------------

print("\n== _require with missing .env ==")

# Make sure the temp .env doesn't exist for this test.
if _TMP_ENV.exists():
    _TMP_ENV.unlink()

# _require should die() — captured here as SystemExit, with stderr containing
# the absolute path.
import io
import contextlib

buf = io.StringIO()
exited = False
with contextlib.redirect_stderr(buf):
    try:
        helper._require({}, "SYSTEM_BASE_URL")
    except SystemExit:
        exited = True

t("_require exits when .env missing", exited)
err = buf.getvalue()
t("error message includes absolute path",
  str(_TMP_ENV) in err,
  f"got: {err[:300]}")
t("error message tells user assistant doesn't read it",
  "never reads" in err.lower() or "assistant never reads" in err.lower(),
  f"got: {err[:300]}")


# ---------------------------------------------------------------------------
# 3. _load_env reads the file when it exists
# ---------------------------------------------------------------------------

print("\n== _load_env from a file ==")

_TMP_ENV.write_text(
    "# comment line ignored\n"
    "SYSTEM_BASE_URL=https://api.example.com\n"
    "SYSTEM_TOKEN=tok123\n"
    "\n"
    "QUOTED_VAL=\"with quotes\"\n",
    encoding="utf-8",
)
cfg = helper._load_env()
t("base URL parsed", cfg.get("SYSTEM_BASE_URL") == "https://api.example.com",
  f"got {cfg.get('SYSTEM_BASE_URL')!r}")
t("token parsed", cfg.get("SYSTEM_TOKEN") == "tok123",
  f"got {cfg.get('SYSTEM_TOKEN')!r}")
t("quoted value stripped", cfg.get("QUOTED_VAL") == "with quotes",
  f"got {cfg.get('QUOTED_VAL')!r}")


# ---------------------------------------------------------------------------
# 4. URL building
# ---------------------------------------------------------------------------

print("\n== URL building ==")
install_fake()

helper.http_call(cfg, "GET", "/items")
t("plain path", captured["url"] == "https://api.example.com/items",
  f"got {captured['url']}")

helper.http_call(cfg, "GET", "/items", query={"page": 2, "size": 50})
t("query params present", "page=2" in captured["url"] and "size=50" in captured["url"],
  f"got {captured['url']}")

helper.http_call(cfg, "GET", "/items", query={"q": "hello world"})
t("space encoded as %20",
  "q=hello%20world" in captured["url"],
  f"got {captured['url']}")

# Trailing slash on base should be stripped
cfg2 = dict(cfg, SYSTEM_BASE_URL="https://api.example.com/")
helper.http_call(cfg2, "GET", "/items")
t("trailing slash on base", captured["url"] == "https://api.example.com/items")


# ---------------------------------------------------------------------------
# 5. Auth header
# ---------------------------------------------------------------------------

print("\n== Auth header ==")
helper.http_call(cfg, "GET", "/items")
expected = "Bearer tok123"
t("Authorization header", captured["headers"].get("Authorization") == expected,
  f"got {captured['headers'].get('Authorization')!r}")


# ---------------------------------------------------------------------------
# 6. Parsing real fixture
# ---------------------------------------------------------------------------

print("\n== Response parsing ==")

# Replace this with a verbatim payload from the docs / a captured response.
FIXTURE = b'{"items":[{"id":1,"name":"Acme"},{"id":2,"name":"Globex"}],"page":{"next":"abc"}}'
parsed = helper.parse_body(FIXTURE)
t("parses items array",
  isinstance(parsed.get("items"), list) and len(parsed["items"]) == 2)
t("first item fields",
  parsed["items"][0]["id"] == 1 and parsed["items"][0]["name"] == "Acme")
t("pagination cursor", parsed["page"]["next"] == "abc")


# ---------------------------------------------------------------------------
# 7. Round-trip parse/serialise
# ---------------------------------------------------------------------------

print("\n== Round-trip ==")
patch = {"name": "Acme Inc.", "active": True}
roundtripped = helper.parse_body(helper.serialise_body(patch))
t("dict survives round-trip",
  roundtripped == patch, f"got {roundtripped!r}")


# ---------------------------------------------------------------------------
# 8. Error body surfacing
# ---------------------------------------------------------------------------

print("\n== Error body surfacing ==")
install_fake(body=b'{"error":"not found"}', status=404)
status, _, body = helper.http_call(cfg, "GET", "/items/999")
t("4xx status preserved", status == 404)
t("4xx body returned", b"not found" in body)


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

failed = [(n, d) for n, ok, d in results if not ok]
print(f"\n{'='*40}\n{len(results)} tests, {len(failed)} failed")
if failed:
    for n, d in failed:
        print(f"  FAIL: {n} -- {d}")
    sys.exit(1)
else:
    print("All checks passed.")
