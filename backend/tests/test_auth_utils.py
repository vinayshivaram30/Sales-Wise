"""Tests for auth_utils — Supabase REST API auth verification."""
import os
import sys
from unittest.mock import patch, AsyncMock, MagicMock

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

TEST_USER_ID = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"


@pytest.mark.asyncio
class TestGetUserFromToken:
    async def test_valid_token_returns_user(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": TEST_USER_ID, "email": "test@example.com"}

        with patch("auth_utils.httpx.AsyncClient") as MockClient:
            instance = AsyncMock()
            instance.get.return_value = mock_response
            instance.__aenter__ = AsyncMock(return_value=instance)
            instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = instance

            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            result = await auth_utils.get_user_from_token("valid-token")
            assert result is not None
            assert result["id"] == TEST_USER_ID

    async def test_empty_token_returns_none(self):
        import importlib
        import auth_utils
        importlib.reload(auth_utils)

        result = await auth_utils.get_user_from_token("")
        assert result is None

    async def test_invalid_token_returns_none(self):
        mock_response = MagicMock()
        mock_response.status_code = 401

        with patch("auth_utils.httpx.AsyncClient") as MockClient:
            instance = AsyncMock()
            instance.get.return_value = mock_response
            instance.__aenter__ = AsyncMock(return_value=instance)
            instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = instance

            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            result = await auth_utils.get_user_from_token("bad-token")
            assert result is None


@pytest.mark.asyncio
class TestGetUserIdFromToken:
    async def test_returns_user_id(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": TEST_USER_ID, "email": "test@example.com"}

        with patch("auth_utils.httpx.AsyncClient") as MockClient:
            instance = AsyncMock()
            instance.get.return_value = mock_response
            instance.__aenter__ = AsyncMock(return_value=instance)
            instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = instance

            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            uid = await auth_utils.get_user_id_from_token("valid-token")
            assert uid == TEST_USER_ID

    async def test_invalid_token_returns_none(self):
        mock_response = MagicMock()
        mock_response.status_code = 401

        with patch("auth_utils.httpx.AsyncClient") as MockClient:
            instance = AsyncMock()
            instance.get.return_value = mock_response
            instance.__aenter__ = AsyncMock(return_value=instance)
            instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = instance

            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            uid = await auth_utils.get_user_id_from_token("bad-token")
            assert uid is None


@pytest.mark.asyncio
class TestRequireUserId:
    async def test_valid_auth_returns_user_id(self):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"id": TEST_USER_ID, "email": "test@example.com"}

        with patch("auth_utils.httpx.AsyncClient") as MockClient:
            instance = AsyncMock()
            instance.get.return_value = mock_response
            instance.__aenter__ = AsyncMock(return_value=instance)
            instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = instance

            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            uid = await auth_utils.require_user_id(f"Bearer valid-token")
            assert uid == TEST_USER_ID

    async def test_invalid_auth_raises_401(self):
        mock_response = MagicMock()
        mock_response.status_code = 401

        with patch("auth_utils.httpx.AsyncClient") as MockClient:
            instance = AsyncMock()
            instance.get.return_value = mock_response
            instance.__aenter__ = AsyncMock(return_value=instance)
            instance.__aexit__ = AsyncMock(return_value=False)
            MockClient.return_value = instance

            import importlib
            import auth_utils
            importlib.reload(auth_utils)

            from fastapi import HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await auth_utils.require_user_id("Bearer bad-token")
            assert exc_info.value.status_code == 401
