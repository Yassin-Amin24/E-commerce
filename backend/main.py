import logging
import os
from pathlib import Path

# Load .env for local development (before other imports)
# This will load backend/.env when running locally via `uvicorn backend.main:app`
if os.path.exists(Path("backend/.env")):
    from dotenv import load_dotenv
    load_dotenv(Path("backend/.env"))
elif os.path.exists(Path(".env")):
    from dotenv import load_dotenv
    load_dotenv(Path(".env"))

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.routers import auth, products, conversations

# Initialize logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# ✅ Create the app ONCE
app = FastAPI(
    title="ClothesMart API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

@app.on_event("startup")
async def on_startup():
    logger.info("ClothesMart API starting up")

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
# ALLOWED_ORIGINS  — comma-separated list, or "*" (Vercel dashboard / .env)
# FRONTEND_URL     — the deployed frontend URL (added to origins automatically)
# CORS_ORIGIN_REGEX — regex to also cover Vercel preview branches, e.g.:
#                    https://e-commerce.*\.vercel\.app
# ---------------------------------------------------------------------------
_frontend_url = os.getenv("FRONTEND_URL", "").strip()
_local_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
default_origins = _local_origins + ([_frontend_url] if _frontend_url else [])

allowed_origins = os.getenv("ALLOWED_ORIGINS")
cors_origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://e-commerce.*\.vercel\.app")

if allowed_origins and allowed_origins.strip() == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_origin_regex=".*",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    origins = (
        [o.strip() for o in allowed_origins.split(",") if o.strip()]
        if allowed_origins
        else default_origins
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_origin_regex=cors_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "An internal server error occurred."},
    )

# Routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(conversations.router, prefix="/conversations", tags=["conversations"])

@app.get("/")
async def root():
    return {"message": "ClothesMart API"}


@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    """Ping the Neon DB and return connectivity status."""
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as exc:  # pragma: no cover
        logger.error("Health check DB error: %s", exc)
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}")

@app.get("/health")
async def health():
    return {"status": "healthy"}