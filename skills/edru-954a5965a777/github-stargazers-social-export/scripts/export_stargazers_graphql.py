#!/usr/bin/env python3
"""Export GitHub repo stargazers to CSV + best-effort social links.

- Uses GitHub GraphQL API (fast for thousands of stargazers)
- Extracts LinkedIn and X/Twitter links from PUBLIC GitHub profile fields:
  - twitterUsername
  - websiteUrl
  - bio (URLs)

Usage:
  export GITHUB_TOKEN='...'
  python3 -u export_stargazers_graphql.py --owner ORG --repo REPO --out-dir /abs/path

Tip (if GitHub CLI is logged in):
  GITHUB_TOKEN=$(gh auth token) python3 -u export_stargazers_graphql.py ...

Security:
- Do NOT paste tokens into chat logs.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import os
import re
import subprocess
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Iterable, List, Optional

GQL_ENDPOINT = "https://api.github.com/graphql"

URL_RE = re.compile(r"https?://[^\s)\]}>\"']+", re.IGNORECASE)
LINKEDIN_RE = re.compile(r"https?://(?:[a-z]+\.)?linkedin\.com/[^\s)\]}>\"']+", re.IGNORECASE)
X_RE = re.compile(r"https?://(?:www\.)?(?:x\.com|twitter\.com)/[A-Za-z0-9_]{1,15}", re.IGNORECASE)


def _normalize_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return "https://" + url


def _headers(token: str) -> Dict[str, str]:
    return {
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "github-stargazers-social-export",
        "Authorization": f"Bearer {token}",
    }


def _post_graphql(token: str, query: str, variables: Dict[str, Any]) -> Dict[str, Any]:
    payload = json.dumps({"query": query, "variables": variables}).encode("utf-8")
    req = urllib.request.Request(GQL_ENDPOINT, data=payload, headers=_headers(token))

    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            out = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = ""
        try:
            body = e.read().decode("utf-8", errors="replace")
        except Exception:
            pass
        raise RuntimeError(f"GraphQL HTTP {e.code}. Body: {body[:800]}") from e

    if out.get("errors"):
        raise RuntimeError(f"GraphQL errors: {out['errors']}")

    return out


def _parse_linkedin(website_url: str, bio: str) -> str:
    candidates: List[str] = []
    for text in (website_url, bio):
        if not text:
            continue
        candidates.extend(LINKEDIN_RE.findall(text))

    web_norm = _normalize_url(website_url)
    if web_norm and "linkedin.com" in web_norm.lower():
        candidates.insert(0, web_norm)

    return candidates[0] if candidates else ""


def _parse_x_url(twitter_username: str, website_url: str, bio: str) -> str:
    if twitter_username:
        return f"https://x.com/{twitter_username.strip()}"

    candidates: List[str] = []
    for text in (website_url, bio):
        if not text:
            continue
        candidates.extend(X_RE.findall(text))

    web_norm = _normalize_url(website_url)
    if web_norm and ("x.com/" in web_norm.lower() or "twitter.com/" in web_norm.lower()):
        candidates.insert(0, web_norm)

    return candidates[0] if candidates else ""


def _extract_other_urls(website_url: str, bio: str) -> str:
    urls: List[str] = []

    web_norm = _normalize_url(website_url)
    if web_norm:
        urls.append(web_norm)

    for u in URL_RE.findall(bio or ""):
        if u not in urls:
            urls.append(u)

    return " | ".join(urls)


def iter_stargazers(
    token: str,
    owner: str,
    repo: str,
    limit: Optional[int] = None,
) -> Iterable[Dict[str, Any]]:
    query = """
    query($owner: String!, $repo: String!, $after: String) {
      repository(owner: $owner, name: $repo) {
        stargazers(first: 100, after: $after) {
          pageInfo { hasNextPage endCursor }
          edges {
            starredAt
            node {
              login
              name
              url
              company
              location
              bio
              websiteUrl
              twitterUsername
              followers { totalCount }
            }
          }
        }
      }
      rateLimit { cost remaining resetAt }
    }
    """

    after: Optional[str] = None
    fetched = 0

    while True:
        out = _post_graphql(token, query, {"owner": owner, "repo": repo, "after": after})
        repo_data = ((out.get("data") or {}).get("repository") or {})
        sg = (repo_data.get("stargazers") or {})
        edges = sg.get("edges") or []
        if not edges:
            return

        for edge in edges:
            node = (edge or {}).get("node") or {}
            node["starredAt"] = (edge or {}).get("starredAt")
            yield node
            fetched += 1
            if limit is not None and fetched >= limit:
                return

        page_info = sg.get("pageInfo") or {}
        if not page_info.get("hasNextPage"):
            return
        after = page_info.get("endCursor")


def build_row(node: Dict[str, Any]) -> Dict[str, str]:
    bio = str(node.get("bio") or "")
    website_url = str(node.get("websiteUrl") or "")
    twitter_username = str(node.get("twitterUsername") or "")

    followers_total = ""
    followers = node.get("followers")
    if isinstance(followers, dict) and "totalCount" in followers:
        followers_total = str(followers.get("totalCount") or "")

    return {
        "github_login": str(node.get("login") or ""),
        "github_name": str(node.get("name") or ""),
        "github_url": str(node.get("url") or ""),
        "company": str(node.get("company") or ""),
        "location": str(node.get("location") or ""),
        "followers": followers_total,
        "website": _normalize_url(website_url),
        "twitter_username": twitter_username,
        "x_url": _parse_x_url(twitter_username, website_url, bio),
        "linkedin_url": _parse_linkedin(website_url, bio),
        "other_urls": _extract_other_urls(website_url, bio),
        "starred_at": str(node.get("starredAt") or ""),
        "bio": bio,
    }


def write_csv(rows: Iterable[Dict[str, str]], out_path: str) -> int:
    fieldnames = [
        "github_login",
        "github_name",
        "github_url",
        "company",
        "location",
        "followers",
        "website",
        "twitter_username",
        "x_url",
        "linkedin_url",
        "other_urls",
        "starred_at",
        "bio",
    ]

    count = 0
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
            count += 1
    return count


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser()
    p.add_argument("--owner", required=True)
    p.add_argument("--repo", required=True)
    p.add_argument("--out-dir", required=True, help="Directory to write output CSV into")
    p.add_argument("--limit", type=int, default=None, help="Optional max stargazers (testing)")
    p.add_argument(
        "--reveal",
        action="store_true",
        help="Reveal the CSV in Finder (macOS) after export",
    )
    return p.parse_args()


def main() -> int:
    args = parse_args()

    token = os.environ.get("GITHUB_TOKEN", "").strip()
    if not token:
        raise SystemExit(
            "GITHUB_TOKEN is required. Set it as an environment variable, "
            "or use: GITHUB_TOKEN=$(gh auth token) ..."
        )

    out_dir = os.path.abspath(args.out_dir)
    os.makedirs(out_dir, exist_ok=True)

    ts = dt.datetime.now().strftime("%Y%m%d_%H%M%S")
    out_path = os.path.join(out_dir, f"{args.owner}_{args.repo}_stargazers_socials_{ts}.csv")

    print(f"Exporting stargazers for {args.owner}/{args.repo}...")
    started = time.time()

    def _rows() -> Iterable[Dict[str, str]]:
        for i, node in enumerate(iter_stargazers(token, args.owner, args.repo, limit=args.limit), start=1):
            if i % 500 == 0:
                elapsed = time.time() - started
                print(f"Processed {i} stargazers in {elapsed:.1f}s")
            yield build_row(node)

    count = write_csv(_rows(), out_path)
    elapsed = time.time() - started
    print(f"Done. Wrote {count} rows to: {out_path} ({elapsed:.1f}s)")

    if args.reveal:
        try:
            subprocess.run(["open", "-R", out_path], check=False)
        except Exception:
            pass

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
