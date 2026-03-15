import uuid
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from src.game_manager import GameManager
logger = logging.getLogger(__name__)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connections: dict[str, WebSocket] = {}
game_manager = GameManager()

async def send_to(target: str | None, response: dict):
    """Send a response to a specific player or broadcast to all.
    If target is None, broadcasts to all connections.
    If target is a player_id, sends only to that player."""
    if target is None:
        dead = []
        for pid, conn in connections.items():
            try:
                await conn.send_json(response)
            except Exception as e:
                logger.warning(f"Error sending to {pid}: {e}")
                dead.append(pid)
        
        for pid in dead:
            del connections[pid]
            game_manager.remove_player(pid)
    
    else:
        if target in connections:
            await connections[target].send_json(response)

@app.websocket("/ws")
async def setup_connection(socket: WebSocket):
    """Handle a new WebSocket connection. Registers the player,
    delegates incoming commands to the GameManager, and dispatches
    responses via send_to()."""
    await socket.accept()

    player_id = str(uuid.uuid4())
    connections[player_id] = socket
    responses = game_manager.add_player(player_id)

    #game manager returns a list of (target, response) tuples
    for tgt, resp in responses:
        await send_to(tgt, resp)

    try:
        while True:
            msg = await socket.receive_json()
            logger.info(f'Message received from {player_id}: {msg}')

            #delegate to game manager
            responses = game_manager.handle_command(player_id, msg)
            for tgt, resp in responses:
                await send_to(tgt, resp)

    except WebSocketDisconnect:
        game_manager.remove_player(player_id)
        del connections[player_id]
    