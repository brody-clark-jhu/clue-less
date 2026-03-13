# from pydantic import BaseModel
# from typing import List, Literal, Union
# from dataclasses import dataclass

# @dataclass
# class PlayerState:
#     def __init__(self):
#         self.character_id: str = ""

# class GameBoardNode:
#     name: str
#     teleport_location: "GameBoardNode" = None

# class GameState:
#     def __init__(self):
#         active_player_id: int = 0
#         player_states: dict[int, str] = {}
#         murder_room: str
#         murder_weapon: str
#         murderer_id: int


# class MoveCommand(BaseModel):
#     direction: str


# class SuggestionCommand(BaseModel):
#     suspect: str
#     weapon: str
#     room: str


# class AccusationCommand(BaseModel):
#     suspect: str
#     weapon: str
#     room: str


# class MoveRequest(BaseModel):
#     type: Literal["move"]
#     payload: MoveCommand


# class SuggestionRequest(BaseModel):
#     type: Literal["suggestion"]
#     payload: SuggestionCommand


# class AccusationRequest(BaseModel):
#     type: Literal["accusation"]
#     payload: AccusationCommand


# GameRequest = Union[MoveRequest, SuggestionRequest, AccusationRequest]

    