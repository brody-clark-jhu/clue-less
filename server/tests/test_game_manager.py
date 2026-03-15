"""Unit tests for the GameManager class (Game Subsystem)."""

import pytest
from pydantic import ValidationError
from src.game_manager import GameManager


class TestAddPlayer:
    def test_adds_player_to_set(self):
        gm = GameManager()
        gm.add_player("player-1")
        assert "player-1" in gm.players

    def test_returns_targeted_welcome(self):
        gm = GameManager()
        responses = gm.add_player("player-1")
        assert len(responses) == 1
        target, response = responses[0]
        assert target == "player-1"
        assert response["type"] == "welcome"
        assert "player-1" in response["message"]

    def test_returns_from_player(self):
        gm = GameManager()
        responses = gm.add_player("player-1")
        _, response = responses[0]
        assert response["from_player"] == "player-1"


class TestRemovePlayer:
    def test_removes_existing_player(self):
        gm = GameManager()
        gm.add_player("player-1")
        gm.remove_player("player-1")
        assert "player-1" not in gm.players

    def test_remove_nonexistent_player_does_not_raise(self):
        gm = GameManager()
        gm.remove_player("nobody")


class TestHandleCommand:
    def test_returns_broadcast(self):
        gm = GameManager()
        responses = gm.handle_command("player-1", {"message": "hello"})
        assert len(responses) == 1
        target, response = responses[0]
        assert target is None

    def test_response_contains_message(self):
        gm = GameManager()
        _, response = gm.handle_command("player-1", {"message": "hello"})[0]
        assert response["type"] == "game_update"
        assert "hello" in response["message"]

    def test_response_contains_from_player(self):
        gm = GameManager()
        _, response = gm.handle_command("player-1", {"message": "hello"})[0]
        assert response["from_player"] == "player-1"

    def test_invalid_command_raises(self):
        gm = GameManager()
        with pytest.raises(ValidationError):
            gm.handle_command("player-1", {"bad_field": "no message"})
