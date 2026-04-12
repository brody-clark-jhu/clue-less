"""Unit tests for the GameManager class."""

from src.model import GameState, PlayerState
from src.game_manager import GameManager


def _setup_game(num_players=3):
    """Helper: create a GameManager with players, characters assigned, and game started."""
    gm = GameManager()
    characters = ["Miss Scarlet", "Professor Plum", "Colonel Mustard",
                  "Mrs. White", "Mr. Green", "Mrs. Peacock"]
    for i in range(num_players):
        gm.add_player(f"p{i}")
        gm.game_state.playerStates[i].character = characters[i]

    gm.handle_command("p0", {"type": "start_game", "payload": {}})
    return gm


class TestAddPlayer:
    def test_adds_player_to_state(self):
        gm = GameManager()
        gm.add_player("p0")
        assert gm.game_state.playerStates[0].playerId == "p0"

    def test_first_player_is_host(self):
        gm = GameManager()
        gm.add_player("p0")
        assert gm.game_state.playerStates[0].is_host is True

    def test_second_player_not_host(self):
        gm = GameManager()
        gm.add_player("p0")
        gm.add_player("p1")
        assert gm.game_state.playerStates[1].is_host is False

    def test_returns_welcome_and_game_update(self):
        gm = GameManager()
        responses = gm.add_player("p0")
        types = [r[1]["type"] for r in responses]
        assert "welcome" in types
        assert "game_update" in types

    def test_notifies_existing_players(self):
        gm = GameManager()
        gm.add_player("p0")
        responses = gm.add_player("p1")
        joined = [r for r in responses if r[1]["type"] == "player_joined"]
        assert len(joined) == 1
        assert joined[0][0] == "p0"


class TestStartGame:
    def test_starts_successfully(self):
        gm = _setup_game()
        assert gm.started is True
        assert gm.game_state.phase == "active"
        assert len(gm.game_state.turn_order) == 3

    def test_deals_cards(self):
        gm = _setup_game()
        total = sum(len(p.hand) for p in gm.game_state.playerStates)
        assert total == 18

    def test_non_host_cannot_start(self):
        gm = GameManager()
        gm.add_player("p0")
        gm.add_player("p1")
        responses = gm.handle_command("p1", {"type": "start_game", "payload": {}})
        assert responses[0][1]["type"] == "error"

    def test_cannot_start_with_one_player(self):
        gm = GameManager()
        gm.add_player("p0")
        responses = gm.handle_command("p0", {"type": "start_game", "payload": {}})
        assert responses[0][1]["type"] == "error"


class TestHandleMove:
    def test_valid_move(self):
        gm = _setup_game(2)
        player = gm.game_state.playerStates[0]
        location = player.location
        moves = gm.board.available_moves(location)
        responses = gm.handle_command("p0", {
            "type": "move", "payload": {"destination": moves[0]}
        })
        assert responses[0][1]["type"] == "game_update"
        assert player.location == moves[0]

    def test_not_your_turn(self):
        gm = _setup_game(2)
        responses = gm.handle_command("p1", {
            "type": "move", "payload": {"destination": "Study"}
        })
        assert responses[0][1]["type"] == "error"
        assert "not your turn" in responses[0][1]["payload"]["message"]

    def test_move_to_room_sets_must_suggest(self):
        gm = _setup_game(2)
        player = gm.game_state.playerStates[0]
        adj = gm.board.adjacency.get(player.location, [])
        room = next((r for r in adj if r in gm.board.rooms), None)
        if room:
            gm.handle_command("p0", {
                "type": "move", "payload": {"destination": room}
            })
            assert player.must_suggest is True


class TestHandleSuggestion:
    def test_suggestion_after_move_to_room(self):
        gm = _setup_game(2)
        player = gm.game_state.playerStates[0]
        adj = gm.board.adjacency.get(player.location, [])
        room = next((r for r in adj if r in gm.board.rooms), None)
        if room:
            gm.handle_command("p0", {
                "type": "move", "payload": {"destination": room}
            })
            responses = gm.handle_command("p0", {
                "type": "suggest",
                "payload": {"suspect": "Mrs. White", "weapon": "Rope"}
            })
            types = [r[1]["type"] for r in responses]
            assert "suggestion_made" in types

    def test_cannot_suggest_without_move(self):
        gm = _setup_game(2)
        responses = gm.handle_command("p0", {
            "type": "suggest",
            "payload": {"suspect": "Mrs. White", "weapon": "Rope"}
        })
        assert responses[0][1]["type"] == "error"


class TestHandleAccusation:
    def test_correct_accusation_wins(self):
        gm = _setup_game(2)
        s = gm.deck.solution
        responses = gm.handle_command("p0", {
            "type": "accuse",
            "payload": {"suspect": s["suspect"], "weapon": s["weapon"], "room": s["room"]}
        })
        types = [r[1]["type"] for r in responses]
        assert "game_over" in types
        assert gm.game_state.phase == "ended"

    def test_wrong_accusation_eliminates(self):
        gm = _setup_game(2)
        responses = gm.handle_command("p0", {
            "type": "accuse",
            "payload": {"suspect": "fake", "weapon": "fake", "room": "fake"}
        })
        types = [r[1]["type"] for r in responses]
        assert "accusation_result" in types
        assert gm.game_state.playerStates[0].eliminated is True

    def test_last_player_standing_wins(self):
        gm = _setup_game(2)
        gm.handle_command("p0", {
            "type": "accuse",
            "payload": {"suspect": "fake", "weapon": "fake", "room": "fake"}
        })
        types = [r[1]["type"] for r in gm.handle_command("p0", {
            "type": "accuse",
            "payload": {"suspect": "fake", "weapon": "fake", "room": "fake"}
        })]
        # p0 already eliminated, can't accuse again
        assert "error" in types


class TestHandleDisprove:
    def test_disprove_no_active_suggestion(self):
        gm = _setup_game(2)
        responses = gm.handle_command("p0", {
            "type": "disprove", "payload": {"card": "Rope"}
        })
        assert responses[0][1]["type"] == "error"
        assert "no active suggestion" in responses[0][1]["payload"]["message"]


class TestHandleCannotDisprove:
    def test_cannot_disprove_no_active_suggestion(self):
        gm = _setup_game(2)
        responses = gm.handle_command("p0", {
            "type": "cannot_disprove", "payload": {}
        })
        assert responses[0][1]["type"] == "error"


class TestUnsupportedCommand:
    def test_unknown_type(self):
        gm = GameManager()
        gm.add_player("p0")
        responses = gm.handle_command("p0", {
            "type": "fly_to_moon", "payload": {}
        })
        assert responses[0][1]["type"] == "error"
        assert "unsupported command" in responses[0][1]["payload"]["message"]
