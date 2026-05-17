import os
import uuid

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from logger import setup_logging

log = setup_logging()

_jwks_client: PyJWKClient | None = None


def _supabase_url() -> str | None:
    url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    return url or None


def is_auth_configured() -> bool:
    return bool(_supabase_url() or os.getenv("SUPABASE_JWT_SECRET", "").strip())


def _jwks_client_for_project() -> PyJWKClient | None:
    global _jwks_client
    base = _supabase_url()
    if not base:
        return None
    if _jwks_client is None:
        _jwks_client = PyJWKClient(f"{base}/auth/v1/.well-known/jwks.json", cache_keys=True)
    return _jwks_client


def decode_supabase_user_id(authorization: str | None) -> uuid.UUID | None:
    """Return Supabase auth user id (JWT ``sub``) when Bearer token is valid."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None

    payload = _decode_token(token)
    if payload is None:
        return None

    sub = payload.get("sub")
    if not sub:
        return None
    try:
        return uuid.UUID(str(sub))
    except ValueError:
        return None


def _decode_token(token: str) -> dict | None:
    # Prefer asymmetric keys (ES256) — current Supabase default after JWT key rotation.
    jwks = _jwks_client_for_project()
    if jwks is not None:
        base = _supabase_url()
        issuer = f"{base}/auth/v1" if base else None
        try:
            signing_key = jwks.get_signing_key_from_jwt(token)
            decode_kwargs: dict = {
                "algorithms": ["ES256", "RS256"],
                "audience": "authenticated",
            }
            if issuer:
                decode_kwargs["issuer"] = issuer
            try:
                return jwt.decode(token, signing_key.key, **decode_kwargs)
            except jwt.InvalidAudienceError:
                # Some tokens use a list aud claim — verify signature only.
                return jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    issuer=issuer,
                    options={"verify_aud": False},
                )
        except jwt.PyJWTError as exc:
            log.warning("JWKS JWT verification failed: %s", exc)

    # Fallback: legacy HS256 shared secret (pre-rotation projects only).
    secret = os.getenv("SUPABASE_JWT_SECRET", "").strip()
    if secret:
        try:
            return jwt.decode(
                token,
                secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        except jwt.PyJWTError as exc:
            log.debug("HS256 JWT verification failed: %s", exc)

    return None


def require_user_id(authorization: str | None = Header(default=None)) -> uuid.UUID:
    user_id = decode_supabase_user_id(authorization)
    if user_id is None:
        if not is_auth_configured():
            raise HTTPException(
                status_code=503,
                detail="Set SUPABASE_URL (recommended) or SUPABASE_JWT_SECRET on the server.",
            )
        raise HTTPException(status_code=401, detail="Valid Supabase login required.")
    return user_id


def optional_user_id(authorization: str | None = Header(default=None)) -> uuid.UUID | None:
    return decode_supabase_user_id(authorization)


def describe_auth_failure(authorization: str | None) -> str:
    """Human-readable reason JWT auth failed (for logs and API errors)."""
    if not authorization or not authorization.lower().startswith("bearer "):
        return "No Authorization Bearer token was sent — sign in on the frontend first."
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return "Authorization header is empty."
    if not is_auth_configured():
        return (
            "The API server cannot verify Supabase tokens. "
            "Set SUPABASE_URL on Railway (same project as VITE_SUPABASE_URL)."
        )
    return "Bearer token was sent but could not be verified (expired, wrong project, or invalid signature)."


def require_user_id_for_persist(authorization: str | None = Header(default=None)) -> uuid.UUID:
    """Require a valid Supabase user when automations are stored in the database."""
    user_id = decode_supabase_user_id(authorization)
    if user_id is not None:
        return user_id
    detail = describe_auth_failure(authorization)
    if not is_auth_configured():
        raise HTTPException(
            status_code=503,
            detail=detail,
        )
    raise HTTPException(status_code=401, detail=detail)


def workflow_persist_user_id(authorization: str | None = Header(default=None)) -> uuid.UUID | None:
    """When DATABASE_URL is set, require login; otherwise auth is optional."""
    from db.database import is_database_configured

    if is_database_configured():
        return require_user_id_for_persist(authorization)
    return decode_supabase_user_id(authorization)
