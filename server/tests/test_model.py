"""Unit tests for Pydantic models in model.py."""

import pytest
from pydantic import ValidationError
from src.model import ClientCommand, ServerResponse, PlayerState, GameState


class TestClientCommand:
    def test_valid_command(self):
        cmd = ClientCommand(type="message", payload={"message": "test"})
        assert cmd.type == "message"
        assert cmd.payload == {"message": "test"}

    def test_default_type(self):
        cmd = ClientCommand(type="hello", payload={"message": "test"})
        assert cmd.type == "hello"

    def test_defaults(self):
        cmd = ClientCommand()
        assert cmd.type == "message"
        assert cmd.payload == {}

    def test_model_dump(self):
        cmd = ClientCommand(type="hello", payload={"message": "test"})
        assert cmd.model_dump() == {"type": "hello", "payload": {"message": "test"}}


class TestServerResponse:
    def test_valid_response(self):
        payload = {"message": "test", "from_player": "p1"}
        resp = ServerResponse(type="game_update", payload=payload)
        assert resp.type == "game_update"
        assert resp.payload == payload

    def test_default_type(self):
        resp = ServerResponse(payload={"field": "value"})
        assert resp.type == "game_update"

    def test_defaults(self):
        resp = ServerResponse()
        assert resp.type == "game_update"
        assert resp.payload == {}

    def test_model_dump(self):
        resp = ServerResponse(type="test", payload={"field": "value"})
        assert resp.model_dump() == {"type": "test", "payload": {"field": "value"}}


class TestPlayerState:
    def test_defaults(self):
        p = PlayerState(playerId="p1")
        assert p.displayName == ""
        assert p.character == ""
        assert p.location == ""
        assert p.hand == []
        assert p.eliminated is False
        assert p.is_host is False
        assert p.moved_this_turn is False
        assert p.must_suggest is False
        assert p.dragged_to_room is False

    def test_can_move_default(self):
        p = PlayerState(playerId="p1")
        assert p.can_move() is True

    def test_can_move_false_when_eliminated(self):
        p = PlayerState(playerId="p1", eliminated=True)
        assert p.can_move() is False

    def test_can_move_false_when_already_moved(self):
        p = PlayerState(playerId="p1", moved_this_turn=True)
        assert p.can_move() is False

    def test_can_suggest_in_room_with_must_suggest(self):
        p = PlayerState(playerId="p1", location="Kitchen", must_suggest=True)
        assert p.can_suggest() is True

    def test_can_suggest_in_room_when_dragged(self):
        p = PlayerState(playerId="p1", location="Kitchen", dragged_to_room=True)
        assert p.can_suggest() is True

    def test_cannot_suggest_in_corridor(self):
        p = PlayerState(playerId="p1", location="study-hall", must_suggest=True)
        assert p.can_suggest() is False

    def test_cannot_suggest_without_flag(self):
        p = PlayerState(playerId="p1", location="Kitchen")
        assert p.can_suggest() is False

    def test_cannot_suggest_when_eliminated(self):
        p = PlayerState(playerId="p1", location="Kitchen", must_suggest=True, eliminated=True)
        assert p.can_suggest() is False

    def test_can_accuse_default(self):
        p = PlayerState(playerId="p1")
        assert p.can_accuse() is True

    def test_cannot_accuse_when_eliminated(self):
        p = PlayerState(playerId="p1", eliminated=True)
        assert p.can_accuse() is False

    def test_matches_suggestion(self):
        p = PlayerState(playerId="p1", hand=["Rope", "Kitchen", "Mr. Green", "Hall"])
        matches = p.matches_suggestion("Mr. Green", "Rope", "Library")
        assert set(matches) == {"Rope", "Mr. Green"}

    def test_matches_suggestion_none(self):
        p = PlayerState(playerId="p1", hand=["Rope", "Kitchen"])
        matches = p.matches_suggestion("Mr. Green", "Knife", "Library")
        assert matches == []

    def test_reset_turn_flags(self):
        p = PlayerState(
            playerId="p1",
            moved_this_turn=True,
            must_suggest=True,
            dragged_to_room=True,
        )
        p.reset_turn_flags()
        assert p.moved_this_turn is False
        assert p.must_suggest is False
        assert p.dragged_to_room is False


class TestGameState:
    def _make_state(self, num_players=3, eliminated=None):
        """Helper to build a GameState with players and turn order."""
        eliminated = eliminated or []
        players = [
            PlayerState(playerId=f"p{i}", eliminated=(i in eliminated))
            for i in range(num_players)
        ]
        return GameState(
            playerStates=players,
            turn_order=[p.playerId for p in players],
            current_turn_index=0,
            phase="active",
        )

    def test_active_player_id(self):
        gs = self._make_state()
        assert gs.active_player_id() == "p0"

    def test_active_player_id_empty(self):
        gs = GameState()
        assert gs.active_player_id() == ""

    def test_advance_turn(self):
        gs = self._make_state()
        gs.advance_turn()
        assert gs.active_player_id() == "p1"

    def test_advance_turn_wraps(self):
        gs = self._make_state()
        gs.current_turn_index = 2
        gs.advance_turn()
        assert gs.active_player_id() == "p0"

    def test_advance_turn_skips_eliminated(self):
        gs = self._make_state(num_players=3, eliminated=[1])
        gs.advance_turn()
        assert gs.active_player_id() == "p2"

    def test_advance_turn_resets_flags(self):
        gs = self._make_state()
        gs.playerStates[1].moved_this_turn = True
        gs.playerStates[1].must_suggest = True
        gs.advance_turn()
        assert gs.playerStates[1].moved_this_turn is False
        assert gs.playerStates[1].must_suggest is False

    def test_get_player_found(self):
        gs = self._make_state()
        assert gs._get_player("p1").playerId == "p1"

    def test_get_player_not_found(self):
        gs = self._make_state()
        assert gs._get_player("missing") is None
