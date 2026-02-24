"""
_summary_
"""

import uuid
from enum import Enum
from typing import List, Literal, Union
from dataclasses import dataclass, asdict
import logging
from pydantic import BaseModel, ValidationError
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from game_state_manager import GameManager
from models import GameRequest

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
            # try:
            #     request = GameRequest.parse_obj(msg)
            # except ValidationError as e:
            #     await socket.send_json({"error": e.errors()})
            #     continue
            # await game_manager.handle(request)
    except WebSocketDisconnect:
        del connections[player_id]
