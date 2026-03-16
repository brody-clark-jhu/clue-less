from src.model import ClientCommand, ServerResponse

class GameManager:
    """Game Subsystem. Processes client commands and produces responses
    for the Networking Subsystem to deliver."""

    def __init__(self):
        self.players: set[str] = set()

    def add_player(self, player_id: str) -> list[tuple[str | None, dict]]:
        """Register a new player and return a targeted welcome response."""
        self.players.add(player_id)
        response = ServerResponse(
            type="game_update",
            message=f"Welcome to the game, {player_id}!",
            from_player=player_id
        )
        return [(player_id, response.model_dump())]

    def remove_player(self, player_id: str):
        """Unregister a player on disconnect."""
        self.players.discard(player_id)

    def handle_command(self, player_id: str, command: dict) -> list[tuple[str | None, dict]]:
        """Validate and process a client command. Returns a list of
        (target, response) tuples where target is a player_id for
        targeted sends or None for broadcast."""
        validated = ClientCommand(**command)

        response = ServerResponse(
            type="game_update",
            message=f"Server received command: {validated.message}",
            from_player=player_id
        )
        return [(None, response.model_dump())]