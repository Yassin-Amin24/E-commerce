import os
from typing import AsyncGenerator
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

Base = declarative_base()


def normalize_database_url(raw_url: str) -> str:
    """
    Normalize Neon/Postgres URLs for SQLAlchemy asyncpg.

    - Accepts Neon strings like: postgresql://...?...sslmode=require
    - Converts to: postgresql+asyncpg://...
    - Removes sslmode (asyncpg + SQLAlchemy can choke on it depending on config)
    """
    url = raw_url.strip()

    # Convert scheme to asyncpg if needed
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]

    if url.startswith("postgresql://") and "+asyncpg" not in url:
        url = "postgresql+asyncpg://" + url[len("postgresql://") :]

    # Strip sslmode from query params (we'll enforce SSL via connect_args)
    parts = urlsplit(url)
    if parts.query:
        qs = [(k, v) for (k, v) in parse_qsl(parts.query, keep_blank_values=True) if k.lower() != "sslmode"]
        url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(qs), parts.fragment))

    return url


DATABASE_URL_RAW = os.getenv("DATABASE_URL")
if not DATABASE_URL_RAW:
    raise RuntimeError("DATABASE_URL is required (set it in Vercel env vars).")

DATABASE_URL = normalize_database_url(DATABASE_URL_RAW)

# Force SSL for Neon (recommended)
engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    connect_args={"ssl": True},
)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session