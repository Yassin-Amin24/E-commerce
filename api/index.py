import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

# Ensure the project root is in sys.path so `backend` is importable as a package
root = Path(__file__).resolve().parent.parent
if str(root) not in sys.path:
    sys.path.insert(0, str(root))

# Load .env from backend/ (only meaningful locally; Vercel uses dashboard env vars)
if load_dotenv:
    load_dotenv(root / "backend" / ".env")

from backend.main import app  # noqa: E402 — single canonical import
