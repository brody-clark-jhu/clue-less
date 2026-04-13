from pydantic import ValidationError
from src.model import (
    ClientCommand,
    ServerResponse,
    WelcomeResponse,
    PlayerJoinedEvent,
    GameState,
    PlayerState,
    LobbyPlayer,           # added modification
    LobbyUpdateEvent,      # added modification
    CharacterSelectedEvent, # added modification
    GameStartedEvent,      # added modification
)
import logging

_logger = logging.getLogger(__name__)


class GameManager:
    """Game Subsystem. Processes client commands and produces responses
    for the Networking Subsystem to deliver."""

    def __init__(self):
        self.game_state: GameState = GameState(playerStates=[])

    def add_player(self, player_id: str) -> list[tuple[str | None, dict]]:
        """Registers a new player and notifies of new game state."""
        cur_players = self.game_state.playerStates.copy()
        _logger.info("New player joined: %s", player_id)

        # added modification — assign player_number based on join order (1-indexed)
        player_number = len(cur_players) + 1  # added modification

        # added modification — first player to join is the host
        is_host = player_number == 1  # added modification

        self.game_state.playerStates.append(
            PlayerState(
                playerId=player_id,
                clickCount=0,
                player_number=player_number,  # added modification
                is_host=is_host,              # added modification
            )
        )
        _logger.info("Current player count: %i", len(cur_players) + 1)

        response: list[tuple[str | None, dict]] = []

        # Welcome new player and give player id
        welcome = WelcomeResponse(playerId=player_id)
        response.append(
            (
                player_id,
                ServerResponse(
                    type="welcome", payload=welcome.model_dump()
                ).model_dump(),
            )
        )

        # Notify existing players of new player
        player_joined = PlayerJoinedEvent(playerId=player_id)
        for p in cur_players:
            response.append(
                (
                    p.playerId,
                    ServerResponse(
                        type="player_joined", payload=player_joined.model_dump()
                    ).model_dump(),
                )
            )

        # Give new player current game state
        response.append(
            (
                player_id,
                ServerResponse(
                    type="game_update", payload=self.game_state.model_dump()
                ).model_dump(),
            )
        )

        # added modification — broadcast lobby_update to all players so every client
        # added modification — re-renders the lobby with the new player in the slots
        response.append(                                                    # added modification
            (                                                               # added modification
                None,                                                       # added modification
                ServerResponse(                                             # added modification
                    type="lobby_update",                                    # added modification
                    payload=self._build_lobby_update().model_dump()        # added modification
                ).model_dump(),                                             # added modification
            )                                                               # added modification
        )                                                                   # added modification

        return response

    def remove_player(self, player_id: str):
        """Unregister a player on disconnect."""
        self.game_state.playerStates = [
            x for x in self.game_state.playerStates if x.playerId != player_id
        ]

    def handle_command(
        self, player_id: str, command: dict
    ) -> list[tuple[str | None, dict]]:
        """Validate and process a client command. Returns a list of
        (target, response) tuples where target is a player_id for
        targeted sends or None for broadcast."""
        
        try:
            validated = ClientCommand(**command)
        except ValidationError as e:
            _logger.warning("Invalid client command from %s: %s", player_id, e)
            return [
                (
                    player_id,
                    ServerResponse(
                        type="error", 
                        payload={"message": "invalid command format", "details": e.errors()}
                    ).model_dump()
                )
            ]

        if validated.type == "message":
            # Update player state
            player_state = self._get_player_state(player_id=player_id)
            if player_state is None:
                _logger.error("Unable to find player with id: %s", player_id)
                return [
                    (
                        player_id,
                        ServerResponse(
                            type="error", 
                            payload={"message": "player session not found"}
                        ).model_dump()
                    )
                ]

            player_state.clickCount += 1
            self._set_player_state(player_state=player_state, player_id=player_id)

            # Broadcast new game state
            return [
                (
                    None,
                    ServerResponse(
                        type="game_update", payload=self.game_state.model_dump()
                    ).model_dump(),
                )
            ]

        # added modification — handle character_select command
        if validated.type == "character_select":                            # added modification
            return self._handle_character_select(                           # added modification
                player_id, validated.payload.get("character")              # added modification
            )                                                               # added modification

        # added modification — handle ready_up command
        if validated.type == "ready_up":                                    # added modification
            return self._handle_ready_up(                                   # added modification
                player_id, validated.payload.get("ready", False)           # added modification
            )                                                               # added modification

        # added modification — handle start_game command
        if validated.type == "start_game":                                  # added modification
            return self._handle_start_game(player_id)                      # added modification
        
        # graceful error return
        _logger.warning("Unsupported command type received: %s", validated.type)
        return [
            (
                player_id,
                ServerResponse(
                    type="error", 
                    payload={"message": f"unsupported command: {validated.type}"}
                ).model_dump()
            )
        ]

    # added modification — handle character selection: assign character and broadcast
    def _handle_character_select(                                           # added modification
        self, player_id: str, character: str | None                        # added modification
    ) -> list[tuple[str | None, dict]]:                                    # added modification
        """Assigns a character to a player if it is not already taken."""  # added modification
        player = self._get_player_state(player_id)                         # added modification
        if player is None:                                                  # added modification
            _logger.error("character_select: player not found: %s", player_id)  # added modification
            return [(player_id, ServerResponse(                             # added modification
                type="error",                                               # added modification
                payload={"message": "player session not found"}            # added modification
            ).model_dump())]                                                # added modification

        if character is None:                                               # added modification
            return [(player_id, ServerResponse(                             # added modification
                type="error",                                               # added modification
                payload={"message": "no character provided"}               # added modification
            ).model_dump())]                                                # added modification

        # added modification — check if character is already taken by another player
        already_taken = any(                                                # added modification
            p.character == character and p.playerId != player_id           # added modification
            for p in self.game_state.playerStates                          # added modification
        )                                                                   # added modification
        if already_taken:                                                   # added modification
            _logger.warning("Character %s already taken", character)       # added modification
            return [(player_id, ServerResponse(                             # added modification
                type="error",                                               # added modification
                payload={"message": f"{character} is already taken"}       # added modification
            ).model_dump())]                                                # added modification

        player.character = character                                        # added modification
        self._set_player_state(player, player_id)                          # added modification
        _logger.info("Player %s selected character %s", player_id, character)  # added modification

        response: list[tuple[str | None, dict]] = []                       # added modification

        # added modification — broadcast character_selected event
        char_event = CharacterSelectedEvent(                                # added modification
            playerId=player_id, character=character                        # added modification
        )                                                                   # added modification
        response.append((None, ServerResponse(                              # added modification
            type="character_selected",                                      # added modification
            payload=char_event.model_dump()                                # added modification
        ).model_dump()))                                                    # added modification

        # added modification — broadcast full lobby_update so all clients re-render
        response.append((None, ServerResponse(                              # added modification
            type="lobby_update",                                            # added modification
            payload=self._build_lobby_update().model_dump()               # added modification
        ).model_dump()))                                                    # added modification

        return response                                                     # added modification

    # added modification — handle ready_up: toggle ready state and broadcast
    def _handle_ready_up(                                                   # added modification
        self, player_id: str, ready: bool                                  # added modification
    ) -> list[tuple[str | None, dict]]:                                    # added modification
        """Sets a player's ready state and broadcasts lobby_update."""     # added modification
        player = self._get_player_state(player_id)                         # added modification
        if player is None:                                                  # added modification
            _logger.error("ready_up: player not found: %s", player_id)    # added modification
            return [(player_id, ServerResponse(                             # added modification
                type="error",                                               # added modification
                payload={"message": "player session not found"}            # added modification
            ).model_dump())]                                                # added modification

        player.is_ready = ready                                             # added modification
        self._set_player_state(player, player_id)                          # added modification
        _logger.info("Player %s ready state: %s", player_id, ready)       # added modification

        return [(None, ServerResponse(                                      # added modification
            type="lobby_update",                                            # added modification
            payload=self._build_lobby_update().model_dump()               # added modification
        ).model_dump())]                                                    # added modification

    # added modification — handle start_game: host only, transitions phase and broadcasts
    def _handle_start_game(                                                 # added modification
        self, player_id: str                                               # added modification
    ) -> list[tuple[str | None, dict]]:                                    # added modification
        """Starts the game if the requesting player is the host."""        # added modification
        player = self._get_player_state(player_id)                         # added modification
        if player is None or not player.is_host:                           # added modification
            _logger.warning("start_game rejected: %s is not host", player_id)  # added modification
            return [(player_id, ServerResponse(                             # added modification
                type="error",                                               # added modification
                payload={"message": "only the host can start the game"}   # added modification
            ).model_dump())]                                                # added modification

        # added modification — set turn order and transition phase to active
        self.game_state.turn_order = [                                      # added modification
            p.playerId for p in self.game_state.playerStates               # added modification
        ]                                                                   # added modification
        self.game_state.current_turn_index = 0                             # added modification
        self.game_state.phase = "active"                                   # added modification
        _logger.info("Game started by host %s", player_id)                 # added modification

        starting_player = self.game_state.active_player_id()               # added modification

        # added modification — broadcast game_started to all clients
        game_started = GameStartedEvent(startingPlayerId=starting_player)  # added modification
        return [(None, ServerResponse(                                      # added modification
            type="game_started",                                            # added modification
            payload=game_started.model_dump()                              # added modification
        ).model_dump())]                                                    # added modification

    # added modification — build a LobbyUpdateEvent from current game state
    def _build_lobby_update(self) -> LobbyUpdateEvent:                     # added modification
        """Constructs a LobbyUpdateEvent from the current playerStates.""" # added modification
        players = [                                                         # added modification
            LobbyPlayer(                                                    # added modification
                playerId=p.playerId,                                        # added modification
                playerNumber=p.player_number,                              # added modification
                character=p.character if p.character else None,            # added modification
                isReady=p.is_ready,                                        # added modification
                isHost=p.is_host,                                          # added modification
            )                                                               # added modification
            for p in self.game_state.playerStates                          # added modification
        ]                                                                   # added modification
        return LobbyUpdateEvent(players=players)                            # added modification

    def _get_player_state(self, player_id: str) -> PlayerState | None:
        for p in self.game_state.playerStates:
            if player_id == p.playerId:
                return p
        return None

    def _set_player_state(self, player_state: PlayerState, player_id: str):
        for index, p in enumerate(self.game_state.playerStates):
            if player_id == p.playerId:
                self.game_state.playerStates[index] = player_state
