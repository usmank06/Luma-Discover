"""Rapidly page Luma's discover endpoint over a worldwide bbox to probe rate limits.

Usage:
    python3 rate_test.py [--proxy] [--limit 50] [--max-pages 0] [--delay 0]

Defaults: hits api2.luma.com directly with no delay between requests, pages until
the API stops returning a cursor or until it errors. Reports per-request status,
cumulative event count, request latency, and any 429 / Retry-After signals.
"""

import argparse
import sys
import time
import urllib.parse
import urllib.request
import json

DIRECT = "https://api2.luma.com/discover/get-paginated-events"
PROXY  = "https://proxy.corsfix.com/?https://api2.luma.com/discover/get-paginated-events"

WORLD_BBOX = {"east": 180, "west": -180, "north": 85, "south": -85}


def build_url(base: str, bbox: dict, limit: int, cursor: str | None) -> str:
    params = {
        "east":  str(bbox["east"]),
        "north": str(bbox["north"]),
        "south": str(bbox["south"]),
        "west":  str(bbox["west"]),
        "pagination_limit": str(limit),
    }
    if cursor:
        params["pagination_cursor"] = cursor
    qs = urllib.parse.urlencode(params)
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}{qs}"


def fetch(url: str, timeout: float = 30.0):
    req = urllib.request.Request(url, headers={"User-Agent": "luma-discover-rate-test/1.0"})
    t0 = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            elapsed = time.monotonic() - t0
            return r.status, dict(r.headers), body, elapsed, None
    except urllib.error.HTTPError as e:
        elapsed = time.monotonic() - t0
        body = e.read() if hasattr(e, "read") else b""
        return e.code, dict(e.headers or {}), body, elapsed, str(e)
    except Exception as e:
        elapsed = time.monotonic() - t0
        return None, {}, b"", elapsed, repr(e)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--proxy", action="store_true", help="Route through proxy.corsfix.com")
    ap.add_argument("--limit", type=int, default=50)
    ap.add_argument("--max-pages", type=int, default=0, help="0 = unlimited")
    ap.add_argument("--delay", type=float, default=0.0, help="Seconds between requests")
    args = ap.parse_args()

    base = PROXY if args.proxy else DIRECT
    cursor = None
    total = 0
    page = 0
    started = time.monotonic()

    print(f"target  : {base}")
    print(f"bbox    : {WORLD_BBOX}")
    print(f"limit   : {args.limit}/page  delay: {args.delay}s  max_pages: {args.max_pages or 'unlimited'}")
    print("-" * 80)

    try:
        while True:
            page += 1
            url = build_url(base, WORLD_BBOX, args.limit, cursor)
            status, headers, body, elapsed, err = fetch(url)

            ratelimit_hint = {k: v for k, v in headers.items()
                              if any(s in k.lower() for s in ("ratelimit", "retry-after"))}

            if err and status is None:
                print(f"page {page:>4}  network error after {elapsed*1000:7.0f}ms — {err}")
                break

            if status != 200:
                print(f"page {page:>4}  HTTP {status} after {elapsed*1000:7.0f}ms  hints={ratelimit_hint}")
                snippet = body[:300].decode("utf-8", errors="replace")
                print(f"           body: {snippet}")
                break

            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                print(f"page {page:>4}  HTTP 200 but body was not JSON ({len(body)} bytes)")
                break

            entries = data.get("entries", []) or []
            cursor = data.get("next_cursor")
            has_more = bool(data.get("has_more"))
            total += len(entries)

            print(f"page {page:>4}  HTTP 200  {elapsed*1000:6.0f}ms  +{len(entries):3d}  total={total:>5d}  has_more={has_more}  hints={ratelimit_hint or '-'}")

            if not cursor or not has_more:
                print(f"\nfinished cleanly — no more pages.")
                break
            if args.max_pages and page >= args.max_pages:
                print(f"\nstopped at max_pages={args.max_pages}")
                break
            if args.delay:
                time.sleep(args.delay)
    except KeyboardInterrupt:
        print("\ninterrupted by user")

    elapsed = time.monotonic() - started
    rate = page / elapsed if elapsed else 0
    print("-" * 80)
    print(f"summary: {page} requests, {total} events, {elapsed:.1f}s wall, {rate:.2f} req/s")


if __name__ == "__main__":
    sys.exit(main() or 0)
