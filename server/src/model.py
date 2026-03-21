from pydantic import BaseModel

class PlayerState(BaseModel):
    """Represents the state of a single player."""
    playerId: str
    clickCount: int
    
class GameState(BaseModel):
    """Represents the entire game state."""
    playerStates: list[PlayerState]
     
class ClientCommand(BaseModel):
    """Represents a command sent from the client to the server."""
    type: str = "message"
    payload: dict

class ServerResponse(BaseModel):
    """Represents a response sent from the server to the client."""
    type: str = "game_update"
    payload: dict
    
    
class WelcomeResponse(BaseModel):
    """Response to a new player connecting for the first time. Provides player id."""
    playerId: str
    
class PlayerJoinedEvent(BaseModel):
    """Event to notify players of a newly connected player."""
    playerId: str