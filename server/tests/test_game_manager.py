"""Unit tests for the GameManager class (Game Subsystem)."""

import pytest
from pydantic import ValidationError
from src.model import ClientCommand, GameState, PlayerState
from src.game_manager import GameManager


class TestAddPlayer:
    def test_adds_player_to_game_state(self):
        gm = GameManager()
        gm.add_player("player-1")
        assert "player-1" == gm.game_state.playerStates[0].playerId

    def test_returns_targeted_welcome(self):
        gm = GameManager()
        responses = gm.add_player("player-1")

        # Expect a welcome + a game_update targeted to the new player
        assert len(responses) == 2

        tgt0, resp0 = responses[0]
        tgt1, resp1 = responses[1]

        assert tgt0 == "player-1"
        assert resp0["type"] == "welcome"
        assert resp0["payload"]["playerId"] == "player-1"

        assert tgt1 == "player-1"
        assert resp1["type"] == "game_update"
        payload = resp1["payload"]
        assert "playerStates" in payload
        assert any(
            p["playerId"] == "player-1" and p["clickCount"] == 0
            for p in payload["playerStates"]
        )


class TestRemovePlayer:
    def test_removes_existing_player(self):
        gm = GameManager()
        gm.add_player("player-1")
        assert any(p.playerId == "player-1" for p in gm.game_state.playerStates)
        gm.remove_player("player-1")
        assert not any(p.playerId == "player-1" for p in gm.game_state.playerStates)

    def test_remove_nonexistent_player_does_not_raise(self):
        gm = GameManager()
        gm.remove_player("nobody")


class TestHandleCommand:
    def test_returns_broadcast(self):
        gm = GameManager()
        gm.game_state = GameState(
            playerStates=[PlayerState(playerId="player-1", clickCount=0)]
        )
        responses = gm.handle_command(
            "player-1",
            ClientCommand(type="message", payload={"message": "Hello"}).model_dump(),
        )
        assert len(responses) == 1
        target, response = responses[0]
        assert target is None

    def test_response_contains_message(self):
        gm = GameManager()
        gm.game_state = GameState(
            playerStates=[PlayerState(playerId="player-1", clickCount=0)]
        )
        responses = gm.handle_command(
            "player-1",
            ClientCommand(type="message", payload={"message": "Hello"}).model_dump(),
        )
        assert responses[0][1]["type"] == "game_update"
        expected_player_state = PlayerState(playerId="player-1", clickCount=1)
        expected_game_state = GameState(playerStates=[expected_player_state])
        assert responses[0][1]["payload"] == expected_game_state.model_dump()

    def test_invalid_command_raises(self):
        gm = GameManager()
        with pytest.raises(ValidationError):
            gm.handle_command("player-1", {"bad_field": "no message"})
