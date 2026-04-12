import logging
from pydantic import ValidationError
from src.model import (
    ClientCommand,
    ServerResponse,
    WelcomeResponse,
    PlayerJoinedEvent,
    GameState,
    PlayerState,
)
from src.game_model import BoardState, CardDeck, SuggestionManager

_logger = logging.getLogger(__name__)

# This type alias defines the response format used throughout GameManager methods.
#   - target: player_id (str), or None if message is broadcast
#   - response: a dict to send as a JSON message
Responses = list[tuple[str | None, dict]]


class GameManager:
    """Central controller for the Game Subsystem. Receives commands from the
    Networking Subsystem, delegates to domain objects, mutates GameState, and
    returns (target, response) tuples."""
    
    def __init__(self):
        self.game_state = GameState()
        self.board = BoardState()
        self.deck = CardDeck()
        self.suggestion_mgr: SuggestionManager | None = None
        self.started = False

    def add_player(self, player_id: str) -> Responses:
        """Register a new player and notify all clients."""
        is_first = len(self.game_state.playerStates) == 0
        player = PlayerState(playerId=player_id, is_host=is_first)
        player.displayName = f"Player {len(self.game_state.playerStates) + 1}"
        self.game_state.playerStates.append(player)
        responses: Responses = []
        responses.append((
            player_id,
            ServerResponse(
                type="welcome",
                payload=WelcomeResponse(playerId=player_id).model_dump(),
            ).model_dump(),
        ))
        for p in self.game_state.playerStates:
            if p.playerId != player_id:
                responses.append((
                    p.playerId,
                    ServerResponse(
                        type="player_joined",
                        payload=PlayerJoinedEvent(playerId=player_id).model_dump(),
                    ).model_dump(),
                ))
        responses.append((
            player_id,
            self._game_update(),
        ))
        return responses


    def remove_player(self, player_id: str) -> None:
        """Unregister a player on disconnect."""
        self.game_state.playerStates = [
            p for p in self.game_state.playerStates if p.playerId != player_id
        ]
        if self.suggestion_mgr and not self.suggestion_mgr.resolved:
            if self.suggestion_mgr.current_disproving_player() == player_id:
                self.suggestion_mgr.advance()


    def handle_command(self, player_id: str, command: dict) -> Responses:
        """Validate and dispatch a client command to the appropriate handler."""
        try:
            validated = ClientCommand(**command)
        except ValidationError as e:
            _logger.warning("Invalid command from %s: %s", player_id, e)
            return [self._error(player_id, "invalid command format")]
        
        handlers = {
            "start_game": self._handle_start_game,
            "move": self._handle_move,
            "suggest": self._handle_suggestion,
            "accuse": self._handle_accusation,
            "disprove": self._handle_disprove,
            "cannot_disprove": self._handle_cannot_disprove,
        }

        handler = handlers.get(validated.type)
        if not handler:
            return [self._error(player_id, f"unsupported command: {validated.type}")]
        return handler(player_id, validated.payload)

    def _handle_start_game(self, player_id: str, payload: dict) -> Responses:
        """Seal solution, deal cards, place players, begin the game."""
        player = self._get_player(player_id)
        if not player or not player.is_host:
            return [self._error(player_id, "only the host can start the game")]
        if self.started:
            return [self._error(player_id, "game already started")]
        if len(self.game_state.playerStates) < 2:
            return [self._error(player_id, "need at least 2 players")]
        
        self.deck.seal_solution()
        self.deck.deal(self.game_state.playerStates)
        self.board.place_starting_positions(self.game_state.playerStates)
        self.game_state.turn_order = [
            p.playerId for p in self.game_state.playerStates
        ]
        self.game_state.current_turn_index = 0
        self.game_state.phase = "active"
        self.started = True
        responses: Responses = []
        for p in self.game_state.playerStates:
            responses.append((
                p.playerId,
                ServerResponse(
                    type="deal_cards",
                    payload={"cards": p.hand},
                ).model_dump(),
            ))
        responses.append((None, self._game_update()))
        return responses


    def _handle_move(self, player_id: str, payload: dict) -> Responses:
        """Validate and execute a player move."""
        player = self._get_player(player_id)
        if not player:
            return [self._error(player_id, "player not found")]
        if self.game_state.active_player_id() != player_id:
            return [self._error(player_id, "not your turn")]
        if not player.can_move():
            return [self._error(player_id, "cannot move right now")]
        destination = self._normalize(payload.get("destination", ""))
        
        try:
            self.board.validate_move(player.location, destination)
        except ValueError as e:
            return [self._error(player_id, str(e))]
       
        self.board.move(player.character, player.location, destination)
        player.location = destination
        player.moved_this_turn = True
        
        if destination in self.board.rooms:
            player.must_suggest = True
        else:
            self.game_state.advance_turn()
        
        return [(None, self._game_update())]
    
    
    def _handle_suggestion(self, player_id: str, payload: dict) -> Responses:
        """Start a suggestion and kick off the disproof cycle."""
        player = self._get_player(player_id)
        if not player:
            return [self._error(player_id, "player not found")]
        if self.game_state.active_player_id() != player_id:
            return [self._error(player_id, "not your turn")]
        if not player.can_suggest():
            return [self._error(player_id, "cannot suggest right now")]
        
        suspect = self._normalize(payload.get("suspect", ""))
        weapon = self._normalize(payload.get("weapon", ""))
        room = player.location
        
        self.board.move_suspect(suspect, room)
        for p in self.game_state.playerStates:
            if p.character == suspect:
                p.location = room
                p.dragged_to_room = True
                break
        
        player.must_suggest = False
        self.game_state.suggestion_pending = True
        
        self.suggestion_mgr = SuggestionManager(
            suggesting_player_id=player_id,
            suspect=suspect,
            weapon=weapon,
            room=room,
            turn_order=self.game_state.turn_order,
        )
        responses: Responses = []
        responses.append((
            None,
            ServerResponse(
                type="suggestion_made",
                payload={"playerId": player_id, "suspect": suspect, "weapon": weapon, "room": room},
            ).model_dump(),
        ))
        candidate = self.suggestion_mgr.current_disproving_player()
        
        if candidate:
            responses.append((
                candidate,
                ServerResponse(
                    type="disprove_request",
                    payload={"suspect": suspect, "weapon": weapon, "room": room},
                ).model_dump(),
            ))
        responses.append((None, self._game_update()))
        return responses


    def _handle_disprove(self, player_id: str, payload: dict) -> Responses:
        """Reveal a card privately to the suggester and end the disproof cycle."""
        
        if not self.suggestion_mgr or self.suggestion_mgr.resolved:
            return [self._error(player_id, "no active suggestion")]
        if self.suggestion_mgr.current_disproving_player() != player_id:
            return [self._error(player_id, "not your turn to disprove")]
        
        card = self._normalize(payload.get("card", ""))
        player = self._get_player(player_id)
        
        if not player or card not in player.matches_suggestion(
            self.suggestion_mgr.suspect,
            self.suggestion_mgr.weapon,
            self.suggestion_mgr.room,
        ):
            return [self._error(player_id, "invalid card for disproof")]
        
        self.suggestion_mgr.resolved = True
        self.game_state.suggestion_pending = False
        
        responses: Responses = []
        responses.append((
            self.suggestion_mgr.suggesting_player_id,
            ServerResponse(
                type="disprove_card",
                payload={"playerId": player_id, "card": card},
            ).model_dump(),
        ))
        responses.append((
            None,
            ServerResponse(
                type="suggestion_disproved",
                payload={"disprovedBy": player_id},
            ).model_dump(),
        ))
        self.suggestion_mgr = None
        self.game_state.advance_turn()
        responses.append((None, self._game_update()))
        
        return responses


    def _handle_cannot_disprove(self, player_id: str, payload: dict) -> Responses:
        """Advance the disproof cycle to the next candidate."""
        
        if not self.suggestion_mgr or self.suggestion_mgr.resolved:
            return [self._error(player_id, "no active suggestion")]
        if self.suggestion_mgr.current_disproving_player() != player_id:
            return [self._error(player_id, "not your turn to disprove")]
        responses: Responses = []
        responses.append((
            None,
            ServerResponse(
                type="cannot_disprove",
                payload={"playerId": player_id},
            ).model_dump(),
        ))
        next_player = self.suggestion_mgr.advance()
        if next_player:
            responses.append((
                next_player,
                ServerResponse(
                    type="disprove_request",
                    payload={
                        "suspect": self.suggestion_mgr.suspect,
                        "weapon": self.suggestion_mgr.weapon,
                        "room": self.suggestion_mgr.room,
                    },
                ).model_dump(),
            ))
        else:
            responses.append((
                None,
                ServerResponse(
                    type="suggestion_unchallenged",
                    payload={"playerId": self.suggestion_mgr.suggesting_player_id},
                ).model_dump(),
            ))
            self.suggestion_mgr = None
            self.game_state.suggestion_pending = False
            self.game_state.advance_turn()
        responses.append((None, self._game_update()))
        return responses


    def _handle_accusation(self, player_id: str, payload: dict) -> Responses:
        """Check accusation against solution. Win or eliminate the player."""
        player = self._get_player(player_id)
        if not player:
            return [self._error(player_id, "player not found")]
        if not player.can_accuse():
            return [self._error(player_id, "eliminated players cannot accuse")]
        suspect = self._normalize(payload.get("suspect", ""))
        weapon = self._normalize(payload.get("weapon", ""))
        room = self._normalize(payload.get("room", ""))
        correct = self.deck.check_solution(suspect, weapon, room)
        responses: Responses = []
        if correct:
            self.game_state.phase = "ended"
            responses.append((
                None,
                ServerResponse(
                    type="game_over",
                    payload={
                        "winner": player_id,
                        "solution": self.deck.solution,
                    },
                ).model_dump(),
            ))
        else:
            player.eliminated = True
            responses.append((
                None,
                ServerResponse(
                    type="accusation_result",
                    payload={
                        "playerId": player_id,
                        "correct": False,
                    },
                ).model_dump(),
            ))
            active_players = [
                p for p in self.game_state.playerStates if not p.eliminated
            ]
            if len(active_players) == 1:
                self.game_state.phase = "ended"
                responses.append((
                    None,
                    ServerResponse(
                        type="game_over",
                        payload={
                            "winner": active_players[0].playerId,
                            "solution": self.deck.solution,
                        },
                    ).model_dump(),
                ))
        responses.append((None, self._game_update()))
        return responses

    # ---- helpers ----
    def _get_player(self, player_id: str) -> PlayerState | None:
        """Look up a player by ID."""
        return self.game_state._get_player(player_id)

    def _normalize(self, value: str) -> str:
        """Strip whitespace from input strings."""
        return value.strip()

    def _game_update(self) -> dict:
        """Build a game_update ServerResponse dict."""
        return ServerResponse(
            type="game_update",
            payload=self.game_state.model_dump(),
        ).model_dump()

    def _error(self, player_id: str, message: str) -> tuple[str | None, dict]:
        """Build a targeted error response tuple."""
        return (
            player_id,
            ServerResponse(
                type="error",
                payload={"message": message},
            ).model_dump(),
        )