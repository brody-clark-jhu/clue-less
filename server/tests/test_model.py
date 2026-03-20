"""Unit tests for ClientCommand and ServerResponse Pydantic models."""

import pytest
from pydantic import ValidationError
from src.model import ClientCommand, ServerResponse


class TestClientCommand:
    def test_valid_command(self):
        payload: dict = {"message":"test"}
        cmd = ClientCommand(type="message", payload=payload)
        assert cmd.type == "message"
        assert cmd.payload == {"message":"test"}

    def test_default_type(self):
        payload: dict = {"message":"test"}
        cmd = ClientCommand(type="hello", payload=payload)        
        assert cmd.type == "hello"

    def test_missing_message_raises(self):
        with pytest.raises(ValidationError):
            ClientCommand()

    def test_model_dump(self):
        payload: dict = {"message":"test"}
        cmd = ClientCommand(type="hello", payload=payload)
        assert cmd.model_dump() == {"type": "hello", "payload":{"message": "test"}}


class TestServerResponse:
    def test_valid_response(self):
        payload: dict = {"message":"test", "from_player":"p1"}
        resp = ServerResponse(type="game_update", payload=payload)
        assert resp.type == "game_update"
        assert resp.payload == payload

    def test_default_type(self):
        resp = ServerResponse(payload={"field":"value"})
        assert resp.type == "game_update"

    def test_missing_message_raises(self):
        with pytest.raises(ValidationError):
            ServerResponse()

    def test_model_dump(self):
        resp = ServerResponse(type="test", payload={"field":"value"})
        assert resp.model_dump() == {
            "type": "test",
            "payload": {"field": "value"}
        }
