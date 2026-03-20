"""Shared fixtures for backend tests."""
import os
import sys
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from jose import jwt

# Ensure backend root is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

TEST_JWT_SECRET = "test-jwt-secret-for-unit-tests"
TEST_USER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"


def _make_token(sub: str = TEST_USER_ID, email: str = "test@example.com") -> str:
    """Create a signed HS256 JWT for tests."""
    return jwt.encode({"sub": sub, "email": email}, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture()
def valid_token():
    return _make_token()


@pytest.fixture()
def auth_headers(valid_token):
    return {"Authorization": f"Bearer {valid_token}"}


# ---------------------------------------------------------------------------
# Mock Supabase before any application code imports db.py
# ---------------------------------------------------------------------------
_mock_supabase = MagicMock()


@pytest.fixture(autouse=True)
def _patch_env():
    """Set env vars needed by auth_utils and db before import."""
    with patch.dict(os.environ, {
        "SUPABASE_JWT_SECRET": TEST_JWT_SECRET,
        "SUPABASE_URL": "https://fake.supabase.co",
        "SUPABASE_SERVICE_KEY": "fake-service-key",
    }):
        yield


@pytest.fixture()
def mock_supabase():
    """Return the mocked supabase client so tests can configure return values."""
    return _mock_supabase


@pytest.fixture()
def client(mock_supabase):
    """FastAPI TestClient with supabase patched out."""
    with patch.dict(os.environ, {
        "SUPABASE_JWT_SECRET": TEST_JWT_SECRET,
        "SUPABASE_URL": "https://fake.supabase.co",
        "SUPABASE_SERVICE_KEY": "fake-service-key",
    }):
        with patch("db.create_client", return_value=mock_supabase):
            # Force reimport so patched env/client are used
            import importlib
            import db
            importlib.reload(db)

            # Reload routers that reference db.supabase
            from routers import auth as auth_mod, calls as calls_mod
            importlib.reload(auth_mod)
            importlib.reload(calls_mod)

            # Reload auth_utils to pick up test secret
            import auth_utils
            importlib.reload(auth_utils)

            from main import app
            importlib.reload(sys.modules["main"])
            from main import app as fresh_app

            yield TestClient(fresh_app)
