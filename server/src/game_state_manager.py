# """
# _summary_
# """
# from typing import List
# import logging
# from models import (
#     GameBoardNode,
#     GameRequest,
#     GameState,
#     PlayerState,
#     MoveCommand,
#     MoveRequest,
#     AccusationCommand,
#     AccusationRequest,
#     SuggestionCommand,
#     SuggestionRequest
# )

# logger = logging.getLogger(__name__)


# class GameBoard:
#     def __init__(self):
#         study = GameBoardNode()
#         study.name = "Study"

#         kitchen = GameBoardNode()
#         kitchen.name = "Kitchen"
#         kitchen.teleport_location = study
#         study.teleport_location = kitchen

#         hall = GameBoardNode()
#         hall.name = "Hall"

#         billiard_room = GameBoardNode()
#         billiard_room.name = "Billiard Room"

#         ball_room = GameBoardNode()
#         ball_room.name = "Ball Room"

#         library = GameBoardNode()
#         library.name = "Library"

#         dining_room = GameBoardNode()
#         dining_room.name = "Dining Room"

#         conservatory = GameBoardNode()
#         conservatory.name = "Conservatory"

#         lounge = GameBoardNode()
#         lounge.name = "Lounge"
#         lounge.teleport_location = conservatory
#         conservatory.teleport_location = lounge

#         self.board_map: dict[GameBoardNode, List[GameBoardNode]] = {
#             study: [hall, library],
#             hall: [study, lounge, billiard_room],
#             lounge: [hall, dining_room],
#             dining_room: [lounge, billiard_room, kitchen],
#             kitchen: [dining_room, ball_room],
#             ball_room: [kitchen, billiard_room, conservatory],
#             conservatory: [ball_room, library],
#             library: [conservatory, billiard_room, study],
#             billiard_room: [hall, dining_room, ball_room, library],
#         }


# class GameManager:
#     def __init__(self):
#         self.game_state = GameState()
#         self.players: dict[str, PlayerState] = {}

#     async def handle(self, request: GameRequest):
#         match request:
#             case MoveRequest():
#                 await self.handle_move(request.payload)
#             case SuggestionRequest():
#                 await self.handle_suggestion(request.payload)
#             case AccusationRequest():
#                 await self.handle_accusation(request.payload)

#     async def handle_move(self, move_command: MoveCommand):
#         pass

#     async def handle_suggestion(self, suggest_command: SuggestionCommand):
#         pass

#     async def handle_accusation(self, accuse_command: AccusationCommand):
#         pass
