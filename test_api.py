#!/usr/bin/env python3
"""
ClothesMart API end-to-end test script.

Usage:
    # Test local dev server
    python test_api.py

    # Test the deployed Vercel backend
    python test_api.py --url https://<your-backend>.vercel.app

    # Test with verbose output
    python test_api.py --url https://<your-backend>.vercel.app -v
"""

import argparse
import json
import sys
import time
import uuid
from typing import Optional

try:
    import requests
except ImportError:
    print("❌  'requests' not installed. Run: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# CLI args
# ---------------------------------------------------------------------------
parser = argparse.ArgumentParser(description="API integration tests for ClothesMart")
parser.add_argument(
    "--url",
    default="http://localhost:8000",
    help="Base URL of the backend (default: http://localhost:8000)",
)
parser.add_argument("-v", "--verbose", action="store_true", help="Print response bodies")
parser.add_argument(
    "--frontend-url",
    default="https://e-commerce-two-ruddy-37.vercel.app",
    help="Frontend URL to test CORS preflight against",
)
args = parser.parse_args()

BASE = args.url.rstrip("/")
VERBOSE = args.verbose
FRONTEND_URL = args.frontend_url

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
PASS = "✅"
FAIL = "❌"
WARN = "⚠️ "
DIVIDER = "-" * 60

passed = 0
failed = 0


def ok(label: str, detail: str = ""):
    global passed
    passed += 1
    print(f"  {PASS}  {label}" + (f"  → {detail}" if detail else ""))


def fail(label: str, detail: str = ""):
    global failed
    failed += 1
    print(f"  {FAIL}  {label}" + (f"  → {detail}" if detail else ""))


def section(title: str):
    print(f"\n{DIVIDER}\n{title}\n{DIVIDER}")


def dump(data):
    if VERBOSE:
        print("     ", json.dumps(data, indent=2, default=str)[:600])


def request(method: str, path: str, *, token: Optional[str] = None, **kwargs):
    headers = kwargs.pop("headers", {})
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{BASE}{path}"
    try:
        r = getattr(requests, method)(url, headers=headers, timeout=30, **kwargs)
        return r
    except requests.exceptions.ConnectionError:
        print(f"\n{FAIL} Cannot connect to {url}  (is the server running?)")
        sys.exit(1)
    except requests.exceptions.Timeout:
        print(f"\n{FAIL} Request to {url} timed out after 30 s")
        sys.exit(1)


# ===========================================================================
# 1.  Basic connectivity & health
# ===========================================================================
section("1. Connectivity & Neon DB health")

r = request("get", "/")
if r.status_code == 200:
    ok("GET /  returns 200", r.json().get("message", ""))
else:
    fail("GET /", f"status={r.status_code}")

r = request("get", "/health")
if r.status_code == 200:
    body = r.json()
    dump(body)
    if body.get("database") == "connected":
        ok("GET /health  — Neon DB connected", body.get("status"))
    else:
        fail("GET /health  — unexpected body", str(body))
elif r.status_code == 503:
    fail("GET /health  — DB unreachable", r.json().get("detail", ""))
else:
    fail("GET /health", f"status={r.status_code} body={r.text[:200]}")


# ===========================================================================
# 2.  Auth: signup → login → /me
# ===========================================================================
section("2. Auth")

unique = uuid.uuid4().hex[:8]
email = f"testuser_{unique}@clothesmart.test"
password = "TestPass123!"
full_name = "Test User"

# Signup
r = request("post", "/auth/signup", json={"email": email, "password": password, "full_name": full_name})
if r.status_code == 201:
    body = r.json()
    dump(body)
    ok("POST /auth/signup  — user created", body.get("email", ""))
else:
    fail("POST /auth/signup", f"status={r.status_code}  body={r.text[:300]}")

# Login
r = request("post", "/auth/login", json={"email": email, "password": password})
if r.status_code == 200:
    body = r.json()
    token = body.get("access_token")
    dump(body)
    ok("POST /auth/login  — token received")
else:
    fail("POST /auth/login", f"status={r.status_code}  body={r.text[:300]}")
    token = None

# /me
if token:
    r = request("get", "/auth/me", token=token)
    if r.status_code == 200:
        body = r.json()
        dump(body)
        ok("GET /auth/me  — user info returned", body.get("email", ""))
    else:
        fail("GET /auth/me", f"status={r.status_code}")
else:
    fail("GET /auth/me  — skipped (no token)")

# Wrong password
r = request("post", "/auth/login", json={"email": email, "password": "wrongpassword"})
if r.status_code == 401:
    ok("POST /auth/login  — correctly rejects bad password")
else:
    fail("POST /auth/login  — bad password not rejected", f"status={r.status_code}")


# ===========================================================================
# 3.  Products
# ===========================================================================
section("3. Products")

# List products (public)
r = request("get", "/products")
if r.status_code == 200:
    body = r.json()
    dump(body)
    ok("GET /products  — returns product list", f"total={body.get('total', '?')}")
else:
    fail("GET /products", f"status={r.status_code}")

# Create a product (auth required)
product_id = None
if token:
    payload = {
        "name": f"Test Jacket {unique}",
        "description": "Automated test listing",
        "price": 49.99,
        "location": "Berlin",
        "image_urls": ["https://picsum.photos/seed/test/600/600"],
    }
    r = request("post", "/products", token=token, json=payload)
    if r.status_code == 201:
        body = r.json()
        product_id = body.get("id")
        dump(body)
        ok("POST /products  — listing created", f"id={product_id}")
    else:
        fail("POST /products", f"status={r.status_code}  body={r.text[:300]}")

    # My listings
    r = request("get", "/products/mine", token=token)
    if r.status_code == 200:
        body = r.json()
        dump(body)
        ok("GET /products/mine  — returns user listings", f"total={body.get('total', '?')}")
    else:
        fail("GET /products/mine", f"status={r.status_code}")

    # Search
    r = request("get", "/products?search=Jacket")
    if r.status_code == 200:
        ok("GET /products?search=  — search works")
    else:
        fail("GET /products?search=", f"status={r.status_code}")

# Get single product
if product_id:
    r = request("get", f"/products/{product_id}")
    if r.status_code == 200:
        ok(f"GET /products/{{id}}  — product detail", r.json().get("name", ""))
    else:
        fail(f"GET /products/{{id}}", f"status={r.status_code}")

# Requires auth - no token
r = request("post", "/products", json={"name": "x", "description": "x", "price": 1, "location": "x"})
if r.status_code in (401, 403, 422):
    ok("POST /products  — correctly requires auth")
else:
    fail("POST /products  — unauthenticated request not blocked", f"status={r.status_code}")


# ===========================================================================
# 4.  Conversations
# ===========================================================================
section("4. Conversations")

if token and product_id:
    # Create conversation as buyer (same user here - might be rejected but tests the route)
    r = request("post", "/conversations", token=token, json={"product_id": product_id})
    if r.status_code in (200, 201, 400):
        # 400 is acceptable if backend rejects buyer == seller
        ok("POST /conversations  — endpoint reachable", f"status={r.status_code}")
    else:
        fail("POST /conversations", f"status={r.status_code}  body={r.text[:300]}")

    r = request("get", "/conversations", token=token)
    if r.status_code == 200:
        body = r.json()
        dump(body)
        ok("GET /conversations  — returns list")
    else:
        fail("GET /conversations", f"status={r.status_code}")
else:
    print(f"  {WARN}  Conversations — skipped (need token + product_id)")


# ===========================================================================
# 5.  CORS preflight
# ===========================================================================
section("5. CORS preflight")

headers = {
    "Origin": FRONTEND_URL,
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type,Authorization",
}
r = requests.options(f"{BASE}/auth/login", headers=headers, timeout=15)
acao = r.headers.get("access-control-allow-origin", "")
if acao in (FRONTEND_URL, "*"):
    ok(f"OPTIONS /auth/login  — CORS allows {FRONTEND_URL}", f"ACAO={acao}")
else:
    fail(
        f"OPTIONS /auth/login  — CORS does NOT allow {FRONTEND_URL}",
        f"ACAO header='{acao}' (set ALLOWED_ORIGINS on the backend Vercel deployment)",
    )


# ===========================================================================
# 6.  OpenAPI / Docs reachable
# ===========================================================================
section("6. OpenAPI schema")

r = request("get", "/openapi.json")
if r.status_code == 200 and "paths" in r.json():
    paths = list(r.json()["paths"].keys())
    ok("GET /openapi.json  — schema valid", f"{len(paths)} routes")
else:
    fail("GET /openapi.json", f"status={r.status_code}")

r = request("get", "/docs")
if r.status_code == 200:
    ok("GET /docs  — Swagger UI reachable")
else:
    fail("GET /docs", f"status={r.status_code}")


# ===========================================================================
# Summary
# ===========================================================================
total = passed + failed
print(f"\n{'='*60}")
print(f"Results for {BASE}")
print(f"{'='*60}")
print(f"  {PASS}  Passed : {passed}/{total}")
if failed:
    print(f"  {FAIL}  Failed : {failed}/{total}")
    sys.exit(1)
else:
    print("  All tests passed!")
