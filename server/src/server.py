"""
_summary_
"""

import uuid
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

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

@app.websocket("/ws")
async def setup_connection(socket: WebSocket):
    await socket.accept()

    player_id = str(uuid.uuid4())
    connections[player_id] = socket

    await socket.send_json({"type": "welcome", "player_id": player_id})
    try:
        while True:
            msg = await socket.receive_json()
            logger.info("Message received: %s", msg)
            print("Message received: %s", msg)
            await socket.send_json({"message": "hello from server"})
    except WebSocketDisconnect:
        del connections[player_id]
