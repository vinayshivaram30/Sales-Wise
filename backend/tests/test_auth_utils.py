"""Tests for auth_utils — local JWT verification."""
import os
from unittest.mock import patch

from jose import jwt

# Must set env before importing auth_utils
TEST_SECRET = "test-jwt-secret-for-unit-tests"
TEST_USER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"


def _make_token(sub=TEST_USER_ID, email="test@example.com", secret=TEST_SECRET):
    return jwt.encode({"sub": sub, "email": email}, secret, algorithm="HS256")


class TestVerifyToken:
    def test_valid_token(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": TEST_SECRET}):
            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            payload = auth_utils.verify_token(_make_token())
            assert payload is not None
            assert payload["sub"] == TEST_USER_ID
            assert payload["email"] == "test@example.com"

    def test_empty_token_returns_none(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": TEST_SECRET}):
            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            assert auth_utils.verify_token("") is None
            assert auth_utils.verify_token(None) is None

    def test_bad_signature_returns_none(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": TEST_SECRET}):
            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            bad_token = _make_token(secret="wrong-secret")
            assert auth_utils.verify_token(bad_token) is None

    def test_malformed_token_returns_none(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": TEST_SECRET}):
            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            assert auth_utils.verify_token("not.a.jwt") is None
            assert auth_utils.verify_token("garbage") is None

    def test_no_secret_configured_returns_none(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": "", "JWT_SECRET": ""}):
            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            assert auth_utils.verify_token(_make_token()) is None


class TestGetUserIdFromToken:
    def test_returns_sub(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": TEST_SECRET}):
            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            uid = auth_utils.get_user_id_from_token(_make_token())
            assert uid == TEST_USER_ID

    def test_invalid_token_returns_none(self):
        with patch.dict(os.environ, {"SUPABASE_JWT_SECRET": TEST_SECRET}):
            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            assert auth_utils.get_user_id_from_token("bad") is None
