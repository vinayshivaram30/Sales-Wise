"""Tests for LLM response parsing and retry logic."""
import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.llm import _parse_json_response, _extract_text
from unittest.mock import MagicMock
import pytest


class TestParseJsonResponse:
    def test_plain_json(self):
        result = _parse_json_response('{"key": "value"}')
        assert result == {"key": "value"}

    def test_json_in_code_block(self):
        text = '```json\n{"key": "value"}\n```'
        assert _parse_json_response(text) == {"key": "value"}

    def test_json_in_bare_code_block(self):
        text = '```\n{"key": "value"}\n```'
        assert _parse_json_response(text) == {"key": "value"}

    def test_json_with_surrounding_whitespace(self):
        text = '  \n  {"key": "value"}  \n  '
        assert _parse_json_response(text) == {"key": "value"}

    def test_empty_string_raises(self):
        with pytest.raises(ValueError, match="Empty response"):
            _parse_json_response("")

    def test_whitespace_only_raises(self):
        with pytest.raises(ValueError, match="Empty response"):
            _parse_json_response("   \n  ")

    def test_invalid_json_raises(self):
        with pytest.raises(json.JSONDecodeError):
            _parse_json_response("not json at all")

    def test_nested_json(self):
        data = {"questions": [{"q": "test", "priority": 1}], "meddic_gaps": {"pain": False}}
        text = json.dumps(data)
        assert _parse_json_response(text) == data

    def test_code_block_with_extra_text_before(self):
        text = 'Here is the JSON:\n```json\n{"key": "value"}\n```\nDone.'
        assert _parse_json_response(text) == {"key": "value"}


class TestExtractText:
    def test_extracts_text_block(self):
        msg = MagicMock()
        block = MagicMock()
        block.text = "hello"
        msg.content = [block]
        assert _extract_text(msg) == "hello"

    def test_empty_content_returns_empty(self):
        msg = MagicMock()
        msg.content = []
        assert _extract_text(msg) == ""

    def test_none_content_returns_empty(self):
        msg = MagicMock()
        msg.content = None
        assert _extract_text(msg) == ""

    def test_block_without_text_attr(self):
        msg = MagicMock()
        block = MagicMock(spec=[])  # no attributes
        msg.content = [block]
        assert _extract_text(msg) == ""
