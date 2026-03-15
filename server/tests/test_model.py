"""Unit tests for ClientCommand and ServerResponse Pydantic models."""

import pytest
from pydantic import ValidationError
from src.model import ClientCommand, ServerResponse


class TestClientCommand:
    def test_valid_command(self):
        cmd = ClientCommand(type="message", message="hello")
        assert cmd.type == "message"
        assert cmd.message == "hello"

    def test_default_type(self):
        cmd = ClientCommand(message="hello")
        assert cmd.type == "message"

    def test_missing_message_raises(self):
        with pytest.raises(ValidationError):
            ClientCommand()

    def test_model_dump(self):
        cmd = ClientCommand(message="hello")
        assert cmd.model_dump() == {"type": "message", "message": "hello"}


class TestServerResponse:
    def test_valid_response(self):
        resp = ServerResponse(type="game_update", message="test", from_player="p1")
        assert resp.type == "game_update"
        assert resp.message == "test"
        assert resp.from_player == "p1"

    def test_default_type(self):
        resp = ServerResponse(message="test")
        assert resp.type == "game_update"

    def test_default_from_player_is_none(self):
        resp = ServerResponse(message="test")
        assert resp.from_player is None

    def test_missing_message_raises(self):
        with pytest.raises(ValidationError):
            ServerResponse()

    def test_model_dump(self):
        resp = ServerResponse(message="test", from_player="p1")
        assert resp.model_dump() == {
            "type": "game_update",
            "message": "test",
            "from_player": "p1",
        }
