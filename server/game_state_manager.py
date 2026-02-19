from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uuid
from enum import Enum
from typing import List
from dataclasses import dataclass, asdict

app = FastAPI()
connections: dict[str, WebSocket] = {}

class GameBoardNode:
    name: str
    teleport_location: "GameBoardNode" = None
    
class GameBoard:
    def __init__(self):
        study = GameBoardNode()
        study.name = "Study"
        
        kitchen = GameBoardNode()
        kitchen.name = "Kitchen"
        kitchen.teleport_location = study
        study.teleport_location = kitchen
        
        hall = GameBoardNode()
        hall.name = "Hall"
        
        billiard_room = GameBoardNode()
        billiard_room.name = "Billiard Room"
        
        ball_room = GameBoardNode()
        ball_room.name = "Ball Room"
        
        library = GameBoardNode()
        library.name = "Library"
        
        dining_room = GameBoardNode()
        dining_room.name = "Dining Room"
        
        conservatory = GameBoardNode()
        conservatory.name = "Conservatory"
        
        lounge = GameBoardNode()
        lounge.name = "Lounge"
        lounge.teleport_location = conservatory
        conservatory.teleport_location = lounge
        
        self.board_map:dict[GameBoardNode, List[GameBoardNode]] = {
            study : [hall, library],
            hall : [study, lounge, billiard_room],
            lounge: [hall, dining_room],
            dining_room: [lounge, billiard_room, kitchen],
            kitchen: [dining_room, ball_room],
            ball_room: [kitchen, billiard_room, conservatory],
            conservatory: [ball_room, library],
            library: [conservatory, billiard_room, study],
            billiard_room: [hall, dining_room, ball_room, library]
        }

class UserAction(Enum):
    ACCUSE = "accuse"
    SUGGEST = "suggest"
    MOVE = "other"
    NONE = "none"
    #TODO

class Characters(Enum):
    BLUE = 1
    PURPLE = 2
    WHITE = 3
    #TODO
    
@dataclass
class PlayerMoveModel:
    player_id:int
    start_location:int
    end_location:int
    
    
@dataclass
class PlayerAccusationModel:
    player_id:int
    
@dataclass
class PlayerSuggestionModel:
    player_id:int    
  
@dataclass    
class PlayerState:
    def __init__(self):
        self.character_id:str = ""
        
class GameState:
    def __init__(self):
        active_player_id:int = 0
        player_states : dict[int, str] = {}
        murder_room:str
        murder_weapon:str
        murderer_id:int
    
    
@app.websocket("/ws")
async def setup_connection(socket: WebSocket):
    await socket.accept()
    
    player_id = str(uuid.uuid4())
    connections[player_id] = socket
    
    # send response
    await socket.send_json({
        "type": "welcome",
        "player_id": player_id
    })    
    try:
        while True:
            msg = await socket.receive_json()
            await handle_message(player_id, msg)
    except WebSocketDisconnect:
        del connections[player_id]
        
        
async def handle_message(player_id:str, msg: dict):
    match msg["type"]:
        case "move":
            handle_move(player_id, msg["to"])
        case "suggest":
            handle_suggest(player_id, msg)
        case "accuse":
            handle_accuse(player_id, msg)
    
    
    
async def broadcast_state(game_state):
    for pid, ws in connections.items():
        view = build_state_view(game_state, pid)
        await ws.send_json({
            "type": "state_update",
            **view
        })
