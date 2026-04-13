from pydantic import ValidationError
from src.model import (
    ClientCommand,
    ServerResponse,
    WelcomeResponse,
    PlayerJoinedEvent,
    GameState,
    PlayerState,
    LobbyPlayer,
    LobbyUpdateEvent,
    CharacterSelectedEvent,
    GameStartedEvent,
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


        player_number = len(cur_players) + 1


        is_host = player_number == 1

        self.game_state.playerStates.append(
            PlayerState(
                playerId=player_id,
                clickCount=0,
                player_number=player_number,
                is_host=is_host,
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



        response.append(
            (
                None,
                ServerResponse(
                    type="lobby_update",
                    payload=self._build_lobby_update().model_dump()
                ).model_dump(),
            )
        )

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


        if validated.type == "character_select":
            return self._handle_character_select(
                player_id, validated.payload.get("character")
            )


        if validated.type == "ready_up":
            return self._handle_ready_up(
                player_id, validated.payload.get("ready", False)
            )


        if validated.type == "start_game":
            return self._handle_start_game(player_id)
        
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


    def _handle_character_select(
        self, player_id: str, character: str | None
    ) -> list[tuple[str | None, dict]]:
        """Assigns a character to a player if it is not already taken."""
        player = self._get_player_state(player_id)
        if player is None:
            _logger.error("character_select: player not found: %s", player_id)
            return [(player_id, ServerResponse(
                type="error",
                payload={"message": "player session not found"}
            ).model_dump())]

        if character is None:
            return [(player_id, ServerResponse(
                type="error",
                payload={"message": "no character provided"}
            ).model_dump())]


        already_taken = any(
            p.character == character and p.playerId != player_id
            for p in self.game_state.playerStates
        )
        if already_taken:
            _logger.warning("Character %s already taken", character)
            return [(player_id, ServerResponse(
                type="error",
                payload={"message": f"{character} is already taken"}
            ).model_dump())]

        player.character = character
        self._set_player_state(player, player_id)
        _logger.info("Player %s selected character %s", player_id, character)

        response: list[tuple[str | None, dict]] = []


        char_event = CharacterSelectedEvent(
            playerId=player_id, character=character
        )
        response.append((None, ServerResponse(
            type="character_selected",
            payload=char_event.model_dump()
        ).model_dump()))


        response.append((None, ServerResponse(
            type="lobby_update",
            payload=self._build_lobby_update().model_dump()
        ).model_dump()))

        return response


    def _handle_ready_up(
        self, player_id: str, ready: bool
    ) -> list[tuple[str | None, dict]]:
        """Sets a player's ready state and broadcasts lobby_update."""
        player = self._get_player_state(player_id)
        if player is None:
            _logger.error("ready_up: player not found: %s", player_id)
            return [(player_id, ServerResponse(
                type="error",
                payload={"message": "player session not found"}
            ).model_dump())]

        player.is_ready = ready
        self._set_player_state(player, player_id)
        _logger.info("Player %s ready state: %s", player_id, ready)

        return [(None, ServerResponse(
            type="lobby_update",
            payload=self._build_lobby_update().model_dump()
        ).model_dump())]


    def _handle_start_game(
        self, player_id: str
    ) -> list[tuple[str | None, dict]]:
        """Starts the game if the requesting player is the host."""
        player = self._get_player_state(player_id)
        if player is None or not player.is_host:
            _logger.warning("start_game rejected: %s is not host", player_id)
            return [(player_id, ServerResponse(
                type="error",
                payload={"message": "only the host can start the game"}
            ).model_dump())]


        self.game_state.turn_order = [
            p.playerId for p in self.game_state.playerStates
        ]
        self.game_state.current_turn_index = 0
        self.game_state.phase = "active"
        _logger.info("Game started by host %s", player_id)

        starting_player = self.game_state.active_player_id()


        game_started = GameStartedEvent(startingPlayerId=starting_player)
        return [(None, ServerResponse(
            type="game_started",
            payload=game_started.model_dump()
        ).model_dump())]


    def _build_lobby_update(self) -> LobbyUpdateEvent:
        """Constructs a LobbyUpdateEvent from the current playerStates."""
        players = [
            LobbyPlayer(
                playerId=p.playerId,
                playerNumber=p.player_number,
                character=p.character if p.character else None,
                isReady=p.is_ready,
                isHost=p.is_host,
            )
            for p in self.game_state.playerStates
        ]
        return LobbyUpdateEvent(players=players)

    def _get_player_state(self, player_id: str) -> PlayerState | None:
        for p in self.game_state.playerStates:
            if player_id == p.playerId:
                return p
        return None

    def _set_player_state(self, player_state: PlayerState, player_id: str):
        for index, p in enumerate(self.game_state.playerStates):
            if player_id == p.playerId:
                self.game_state.playerStates[index] = player_state
