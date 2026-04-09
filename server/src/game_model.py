"""
Model: game_model.py
Definition: This model creates all the classes that will be utlizied thoughout the game
"""
class PlayerState:
    """
    Represents the mutable state of one player in a game of Clue.

    Attributes:
        playerId (str):         Server-assigned UUID.
        displayName (str):      Lobby-chosen display name (e.g. "Player 1").
        character (str):        Selected Clue character.
        location (str):         Current board location ID.
        hand (list[str]):       Private card names held by this player.
        eliminated (bool):      True after a wrong accusation.
        is_host (bool):         True for the first player to join.
        moved_this_turn (bool): Reset to False at the start of each turn.
        must_suggest (bool):    True after the player enters a room.
        dragged_to_room (bool): True if the player was placed by a suggestion.
    """

    def __init__(self, playerId: str):
        if not playerId:
            raise ValueError("playerId is required and cannot be empty.")

        self.playerId = playerId
        self.displayName: str = ""
        self.character: str = ""
        self.location: str = ""
        self.hand: list[str] = []
        self.eliminated: bool = False
        self.is_host: bool = False
        self.moved_this_turn: bool = False
        self.must_suggest: bool = False
        self.dragged_to_room: bool = False

    #Verifies the location of where the player is in, if this is a room
    def _in_room(self) -> bool:
        return "-" not in self.location and self.location != ""

    #Operations for the gamestate

    #Checks if the player can move 
    def can_move(self) -> bool:
        return not self.eliminated and not self.moved_this_turn

    #Checks if a player can make a suggestion, based on the criteria
    def can_suggest(self) -> bool:
        return (
            self._in_room()
            and (self.must_suggest or self.dragged_to_room)
            and not self.eliminated
        )

    #Checks if the player is allowed to make an accusation based on if they are eliminated.
    def can_accuse(self) -> bool:
        return not self.eliminated

    #returns the set of cards in the players hand that matches a suggestion
    def matches_suggestion(self, suspect: str, weapon: str, room: str) -> list[str]:
        suggested = {suspect, weapon, room}
        return [card for card in self.hand if card in suggested]

    #resets the current turn after a player has moved.
    def reset_turn_flags(self) -> None:
        self.moved_this_turn = False
        self.must_suggest = False
        self.dragged_to_room = False

    def __repr__(self) -> str:
        return (
            f"PlayerState(playerId={self.playerId!r}, "
            f"displayName={self.displayName!r}, "
            f"character={self.character!r}, "
            f"location={self.location!r}, "
            f"eliminated={self.eliminated})"
        )
    



"""Defines BoardState that will enforce constraints for the different rooms and help with locations"""
class BoardState:
 def __init__(self):
        self.rooms: set[str] = {
            "Study", "Hall", "Lounge", "Library",
            "Billiard Room", "Dining Room",
            "Conservatory", "Ballroom", "Kitchen"
        }
 
        self.corridors: set[str] = {
            "study-hall", "study-library",
            "hall-lounge", "hall-billiard-room",
            "lounge-dining-room",
            "library-billiard-room", "library-conservatory",
            "billiard-room-dining-room", "billiard-room-ballroom",
            "dining-room-kitchen",
            "conservatory-ballroom",
            "ballroom-kitchen"
        }
 
        self.adjacency: dict[str, list[str]] = {
            # Rooms
            "Study":         ["study-hall", "study-library"],
            "Hall":          ["study-hall", "hall-lounge", "hall-billiard-room"],
            "Lounge":        ["hall-lounge", "lounge-dining-room"],
            "Library":       ["study-library", "library-billiard-room", "library-conservatory"],
            "Billiard Room": ["hall-billiard-room", "library-billiard-room",
                              "billiard-room-dining-room", "billiard-room-ballroom"],
            "Dining Room":   ["lounge-dining-room", "billiard-room-dining-room", "dining-room-kitchen"],
            "Conservatory":  ["library-conservatory", "conservatory-ballroom"],
            "Ballroom":      ["billiard-room-ballroom", "conservatory-ballroom", "ballroom-kitchen"],
            "Kitchen":       ["dining-room-kitchen", "ballroom-kitchen"],
            # Corridors
            "study-hall":               ["Study", "Hall"],
            "study-library":            ["Study", "Library"],
            "hall-lounge":              ["Hall", "Lounge"],
            "hall-billiard-room":       ["Hall", "Billiard Room"],
            "lounge-dining-room":       ["Lounge", "Dining Room"],
            "library-billiard-room":    ["Library", "Billiard Room"],
            "library-conservatory":     ["Library", "Conservatory"],
            "billiard-room-dining-room":["Billiard Room", "Dining Room"],
            "billiard-room-ballroom":   ["Billiard Room", "Ballroom"],
            "dining-room-kitchen":      ["Dining Room", "Kitchen"],
            "conservatory-ballroom":    ["Conservatory", "Ballroom"],
            "ballroom-kitchen":         ["Ballroom", "Kitchen"],
        }
 
        self.secret_passages: dict[str, str] = {
            "Study":        "Kitchen",
            "Kitchen":      "Study",
            "Lounge":       "Conservatory",
            "Conservatory": "Lounge",
        }
 
        # location_id -> character name or None
        self.occupants: dict[str, str | None] = {
            loc: None for loc in list(self.rooms) + list(self.corridors)
        }
 
        self.starting_positions: dict[str, str] = {
            "Professor Plum": "study-library",
            "Miss Scarlet":   "hall-lounge",
            "Colonel Mustard": "lounge-dining-room",
            "Mrs. White":     "ballroom-kitchen",
            "Mr. Green":      "conservatory-ballroom",
            "Mrs. Peacock":   "library-conservatory",
        }

        #TODO add card class and operations for BoardState

