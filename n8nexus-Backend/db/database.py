import os
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from db.models import Base

_engine = None
_SessionLocal = None


def is_database_configured() -> bool:
    return bool(_normalize_database_url(os.getenv("DATABASE_URL", "")))


def _normalize_database_url(raw: str) -> str:
    """Strip quotes and accidental ``DATABASE_URL=`` prefix from .env values."""
    url = raw.strip().strip('"').strip("'")
    if url.upper().startswith("DATABASE_URL="):
        url = url.split("=", 1)[1].strip().strip('"').strip("'")
    return url


def _get_engine():
    global _engine, _SessionLocal
    if _engine is not None:
        return _engine

    url = _normalize_database_url(os.getenv("DATABASE_URL", ""))
    if not url:
        raise RuntimeError("DATABASE_URL is not set")

    # Supabase pooler URLs often use postgres:// — SQLAlchemy 2 prefers postgresql://
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+psycopg://", 1)
    elif url.startswith("postgresql://") and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+psycopg://", 1)

    # Supabase pooler (port 6543): disable prepared statements (transaction mode).
    _engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"prepare_threshold": None},
    )
    _SessionLocal = sessionmaker(bind=_engine, autocommit=False, autoflush=False)
    return _engine


def init_db() -> None:
    if not is_database_configured():
        return
    engine = _get_engine()
    Base.metadata.create_all(bind=engine)


def get_session_factory() -> sessionmaker[Session]:
    _get_engine()
    assert _SessionLocal is not None
    return _SessionLocal


def get_db() -> Generator[Session, None, None]:
    if not is_database_configured():
        raise RuntimeError("DATABASE_URL is not set")
    factory = get_session_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()


def get_db_optional() -> Generator[Session | None, None, None]:
    if not is_database_configured():
        yield None
        return
    factory = get_session_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()
