from pydantic import BaseModel

class ClientCommand(BaseModel):
    """Represents a command sent from the client to the server."""
    type: str = "message"
    message: str

class ServerResponse(BaseModel):
    """Represents a response sent from the server to the client."""
    type: str = "game_update"
    message: str
    from_player: str | None = None
    