from pydantic import BaseModel

class PlayerState(BaseModel):
    """Represents the state of a single player."""
    playerId: str
    displayName: str = ""
    character: str = ""
    location: str = ""
    hand: list[str] = []
    eliminated: bool = False
    is_host: bool = False
    moved_this_turn: bool = False
    must_suggest: bool = False
    dragged_to_room: bool = False

    def _in_room(self) -> bool:
        return self.location != "" and "-" not in self.location
    
    def can_move(self) -> bool:
        return not self.eliminated and not self.moved_this_turn

    def can_suggest(self) -> bool:
        return (
            self._in_room()
            and (self.must_suggest or self.dragged_to_room)
            and not self.eliminated
        )

    def can_accuse(self) -> bool:
        return not self.eliminated

    def matches_suggestion(self, suspect: str, weapon: str, room: str) -> list[str]:
        suggested = {suspect, weapon, room}
        return [card for card in self.hand if card in suggested]

    def reset_turn_flags(self) -> None:
        self.moved_this_turn = False
        self.must_suggest = False
        self.dragged_to_room = False
        
    
class GameState(BaseModel):
    """Represents the entire game state."""
    playerStates: list[PlayerState] = []
    turn_order: list[str] = []
    current_turn_index: int = 0
    phase: str = "lobby"
    suggestion_pending: bool = False

    def active_player_id(self) -> str:
        if not self.turn_order:
            return ""
        return self.turn_order[self.current_turn_index]
    
    def advance_turn(self) -> None:
        if not self.turn_order:
            return
        count = len(self.turn_order)
        for _ in range(count):
            self.current_turn_index = (self.current_turn_index + 1) % count
            player = self._get_player(self.active_player_id())
            if player and not player.eliminated:
                player.reset_turn_flags()
                return

    def _get_player(self, player_id: str) -> PlayerState | None:
        for p in self.playerStates:
            if p.playerId == player_id:
                return p
        return None     

    
class ClientCommand(BaseModel):
    """Represents a command sent from the client to the server."""
    type: str = "message"
    payload: dict = {}

class ServerResponse(BaseModel):
    """Represents a response sent from the server to the client."""
    type: str = "game_update"
    payload: dict = {}
    
    
class WelcomeResponse(BaseModel):
    """Response to a new player connecting for the first time. Provides player id."""
    playerId: str
    
class PlayerJoinedEvent(BaseModel):
    """Event to notify players of a newly connected player."""
    playerId: str