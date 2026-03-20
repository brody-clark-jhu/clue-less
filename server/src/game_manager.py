from src.model import (
    ClientCommand,
    ServerResponse,
    WelcomeResponse,
    PlayerJoinedEvent,
    GameState,
    PlayerState,
)
import logging

_logger = logging.getLogger(__name__)


class GameManager:
    """Game Subsystem. Processes client commands and produces responses
    for the Networking Subsystem to deliver."""

    def __init__(self):
        self.players: set[str] = set()
        self.game_state: GameState = GameState(playerStates=[])

    def add_player(self, player_id: str) -> list[tuple[str | None, dict]]:
        """Registers a new player and notifies of new game state."""
        cur_players = self.game_state.playerStates.copy()
        _logger.info("New player joined: %s", player_id)
        self.game_state.playerStates.append(
            PlayerState(playerId=player_id, clickCount=0)
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
        validated = ClientCommand(**command)
        if validated.type == "message":
            # Update player state
            player_state = self._get_player_state(player_id=player_id)
            if player_state is None:
                _logger.error("Unable to find player with id: %s", player_id)
                return [(player_id, self.game_state.model_dump())]
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

    def _get_player_state(self, player_id: str) -> PlayerState | None:
        for p in self.game_state.playerStates:
            if player_id == p.playerId:
                return p
        return None

    def _set_player_state(self, player_state: PlayerState, player_id: str):
        for index, p in enumerate(self.game_state.playerStates):
            if player_id == p:
                self.game_state.playerStates[index] = player_state
