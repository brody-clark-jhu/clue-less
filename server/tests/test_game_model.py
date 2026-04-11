"""Unit tests for BoardState, CardDeck, and SuggestionManager."""

import pytest
from src.model import PlayerState
from src.game_model import BoardState, CardDeck, SuggestionManager


class TestBoardStateValidateMove:
    def test_valid_adjacent_move(self):
        board = BoardState()
        board.validate_move("Study", "study-hall")

    def test_valid_corridor_to_room(self):
        board = BoardState()
        board.validate_move("study-hall", "Hall")

    def test_invalid_non_adjacent(self):
        board = BoardState()
        with pytest.raises(ValueError):
            board.validate_move("Study", "Ballroom")

    def test_secret_passage_allowed(self):
        board = BoardState()
        board.validate_move("Study", "Kitchen")

    def test_occupied_corridor_rejected(self):
        board = BoardState()
        board.occupants["study-hall"] = "Miss Scarlet"
        with pytest.raises(ValueError, match="occupied"):
            board.validate_move("Study", "study-hall")

    def test_room_allows_multiple(self):
        board = BoardState()
        board.occupants["Kitchen"] = "Miss Scarlet"
        board.validate_move("dining-room-kitchen", "Kitchen")


class TestBoardStateMove:
    def test_move_updates_occupants(self):
        board = BoardState()
        board.occupants["study-hall"] = "Professor Plum"
        board.move("Professor Plum", "study-hall", "Study")
        assert board.occupants["study-hall"] is None
        assert board.occupants["Study"] == "Professor Plum"


class TestBoardStateMoveSuspect:
    def test_teleports_character(self):
        board = BoardState()
        board.occupants["study-hall"] = "Miss Scarlet"
        board.move_suspect("Miss Scarlet", "Kitchen")
        assert board.occupants["study-hall"] is None
        assert board.occupants["Kitchen"] == "Miss Scarlet"

    def test_teleport_character_not_on_board(self):
        board = BoardState()
        board.move_suspect("Miss Scarlet", "Kitchen")
        assert board.occupants["Kitchen"] == "Miss Scarlet"


class TestBoardStateAvailableMoves:
    def test_from_room(self):
        board = BoardState()
        moves = board.available_moves("Study")
        assert "study-hall" in moves
        assert "study-library" in moves
        assert "Kitchen" in moves  # secret passage

    def test_filters_occupied_corridors(self):
        board = BoardState()
        board.occupants["study-hall"] = "Miss Scarlet"
        moves = board.available_moves("Study")
        assert "study-hall" not in moves
        assert "study-library" in moves

    def test_from_corridor(self):
        board = BoardState()
        moves = board.available_moves("study-hall")
        assert "Study" in moves
        assert "Hall" in moves

    def test_no_secret_passage_from_non_corner(self):
        board = BoardState()
        moves = board.available_moves("Hall")
        for room in ["Study", "Kitchen", "Lounge", "Conservatory"]:
            if room not in board.adjacency.get("Hall", []):
                assert room not in moves


class TestBoardStatePlaceStartingPositions:
    def test_places_players(self):
        board = BoardState()
        players = [
            PlayerState(playerId="p1", character="Miss Scarlet"),
            PlayerState(playerId="p2", character="Professor Plum"),
        ]
        board.place_starting_positions(players)
        assert players[0].location == "hall-lounge"
        assert players[1].location == "study-library"
        assert board.occupants["hall-lounge"] == "Miss Scarlet"
        assert board.occupants["study-library"] == "Professor Plum"


class TestCardDeckSealSolution:
    def test_seals_one_of_each(self):
        deck = CardDeck()
        deck.seal_solution()
        assert deck.sealed is True
        assert deck.solution["suspect"] in CardDeck.SUSPECTS
        assert deck.solution["weapon"] in CardDeck.WEAPONS
        assert deck.solution["room"] in CardDeck.ROOMS


class TestCardDeckDeal:
    def test_deals_18_cards(self):
        deck = CardDeck()
        deck.seal_solution()
        players = [PlayerState(playerId=f"p{i}") for i in range(3)]
        deck.deal(players)
        total_cards = sum(len(p.hand) for p in players)
        assert total_cards == 18

    def test_solution_cards_not_in_hands(self):
        deck = CardDeck()
        deck.seal_solution()
        players = [PlayerState(playerId=f"p{i}") for i in range(4)]
        deck.deal(players)
        all_dealt = []
        for p in players:
            all_dealt.extend(p.hand)
        assert deck.solution["suspect"] not in all_dealt
        assert deck.solution["weapon"] not in all_dealt
        assert deck.solution["room"] not in all_dealt

    def test_round_robin_distribution(self):
        deck = CardDeck()
        deck.seal_solution()
        players = [PlayerState(playerId=f"p{i}") for i in range(3)]
        deck.deal(players)
        counts = [len(p.hand) for p in players]
        assert max(counts) - min(counts) <= 1


class TestCardDeckCheckSolution:
    def test_correct(self):
        deck = CardDeck()
        deck.seal_solution()
        s = deck.solution
        assert deck.check_solution(s["suspect"], s["weapon"], s["room"]) is True

    def test_wrong_suspect(self):
        deck = CardDeck()
        deck.seal_solution()
        s = deck.solution
        wrong = [x for x in CardDeck.SUSPECTS if x != s["suspect"]][0]
        assert deck.check_solution(wrong, s["weapon"], s["room"]) is False

    def test_wrong_weapon(self):
        deck = CardDeck()
        deck.seal_solution()
        s = deck.solution
        wrong = [x for x in CardDeck.WEAPONS if x != s["weapon"]][0]
        assert deck.check_solution(s["suspect"], wrong, s["room"]) is False

    def test_wrong_room(self):
        deck = CardDeck()
        deck.seal_solution()
        s = deck.solution
        wrong = [x for x in CardDeck.ROOMS if x != s["room"]][0]
        assert deck.check_solution(s["suspect"], s["weapon"], wrong) is False


class TestSuggestionManager:
    def test_builds_clockwise_queue(self):
        mgr = SuggestionManager(
            suggesting_player_id="p1",
            suspect="Miss Scarlet",
            weapon="Rope",
            room="Kitchen",
            turn_order=["p0", "p1", "p2", "p3"],
        )
        assert mgr.disproof_queue == ["p2", "p3", "p0"]

    def test_current_disproving_player(self):
        mgr = SuggestionManager(
            suggesting_player_id="p0",
            suspect="Miss Scarlet",
            weapon="Rope",
            room="Kitchen",
            turn_order=["p0", "p1", "p2"],
        )
        assert mgr.current_disproving_player() == "p1"

    def test_advance(self):
        mgr = SuggestionManager(
            suggesting_player_id="p0",
            suspect="Miss Scarlet",
            weapon="Rope",
            room="Kitchen",
            turn_order=["p0", "p1", "p2", "p3"],
        )
        assert mgr.advance() == "p2"
        assert mgr.advance() == "p3"
        assert mgr.advance() is None

    def test_is_exhausted(self):
        mgr = SuggestionManager(
            suggesting_player_id="p0",
            suspect="Miss Scarlet",
            weapon="Rope",
            room="Kitchen",
            turn_order=["p0", "p1"],
        )
        assert mgr.is_exhausted() is False
        mgr.advance()
        assert mgr.is_exhausted() is True

    def test_wraps_around_turn_order(self):
        mgr = SuggestionManager(
            suggesting_player_id="p3",
            suspect="Miss Scarlet",
            weapon="Rope",
            room="Kitchen",
            turn_order=["p0", "p1", "p2", "p3"],
        )
        assert mgr.disproof_queue == ["p0", "p1", "p2"]
