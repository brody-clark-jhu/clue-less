"""Unit tests for the GameManager class (Game Subsystem)."""

from src.model import GameState, PlayerState
from src.game_manager import GameManager

class TestAddPlayer:
    def test_adds_player_to_game_state(self):
        gm = GameManager()
        gm.add_player("player-1")
        assert "player-1" == gm.game_state.playerStates[0].playerId

    def test_returns_targeted_welcome(self):
        gm = GameManager()
        responses = gm.add_player("player-1")
        assert len(responses) == 2
        assert responses[0][0] == "player-1"
        assert responses[0][1]["type"] == "welcome"

class TestRemovePlayer:
    def test_removes_existing_player(self):
        gm = GameManager()
        gm.add_player("player-1")
        gm.remove_player("player-1")
        assert not any(p.playerId == "player-1" for p in gm.game_state.playerStates)

class TestHandleCommand:
    def test_unsupported_command_type_returns_error(self):
        gm = GameManager()
        bad_command = {"type": "fly_to_moon", "payload": {"message": "hi"}}
        responses = gm.handle_command("player-1", bad_command)
        assert responses[0][1]["type"] == "error"
        assert "unsupported command" in responses[0][1]["payload"]["message"]
