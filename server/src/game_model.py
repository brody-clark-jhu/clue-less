"""
Model: game_model.py
Definition: This model creates all the classes that will be utlizied thoughout the game
"""

import random

class BoardState:
    """Board topology, occupancy tracking, and move validation."""
    def __init__(self):
        self.rooms: set[str] = {
            "Study", "Hall", "Lounge", "Library",
            "Billiard Room", "Dining Room",
            "Conservatory", "Ballroom", "Kitchen",
        }
        self.corridors: set[str] = {
            "study-hall", "study-library",
            "hall-lounge", "hall-billiard-room",
            "lounge-dining-room",
            "library-billiard-room", "library-conservatory",
            "billiard-room-dining-room", "billiard-room-ballroom",
            "dining-room-kitchen",
            "conservatory-ballroom",
            "ballroom-kitchen",
        }
        self.adjacency: dict[str, list[str]] = {
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
            "study-hall":               ["Study", "Hall"],
            "study-library":            ["Study", "Library"],
            "hall-lounge":              ["Hall", "Lounge"],
            "hall-billiard-room":       ["Hall", "Billiard Room"],
            "lounge-dining-room":       ["Lounge", "Dining Room"],
            "library-billiard-room":    ["Library", "Billiard Room"],
            "library-conservatory":     ["Library", "Conservatory"],
            "billiard-room-dining-room": ["Billiard Room", "Dining Room"],
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
        self.occupants: dict[str, str | None] = {
            loc: None for loc in list(self.rooms) + list(self.corridors)
        }
        self.starting_positions: dict[str, str] = {
            "Professor Plum":  "study-library",
            "Miss Scarlet":    "hall-lounge",
            "Colonel Mustard": "lounge-dining-room",
            "Mrs. White":      "ballroom-kitchen",
            "Mr. Green":       "conservatory-ballroom",
            "Mrs. Peacock":    "library-conservatory",
        }

    def validate_move(self, current_location: str, destination: str) -> None:
        """Raise ValueError if the move is not legal."""
        neighbors = self.adjacency.get(current_location, [])
        secret_dest = self.secret_passages.get(current_location)

        if destination not in neighbors and destination != secret_dest:
            raise ValueError(f"Invalid move from {current_location} to {destination}")
        
        if destination in self.corridors and self.occupants.get(destination) is not None:
            raise ValueError(f"Corridor {destination} is already occupied")
        
    def move(self, character: str, old_location: str, destination: str) -> None:
        """Update occupants map for a player move."""
        self.occupants[old_location] = None
        self.occupants[destination] = character

    def move_suspect(self, character: str, room: str) -> None:
        """Teleport a character to a room for a suggestion."""
        for loc, occ in self.occupants.items():
            if occ == character:
                self.occupants[loc] = None
                break
        self.occupants[room] = character

    def available_moves(self, current_location: str) -> list[str]:
        """Return list of legal destinations from a location."""
        moves = []
        for dest in self.adjacency.get(current_location, []):
            if dest in self.corridors and self.occupants.get(dest) is not None:
                continue
            moves.append(dest)
        
        secret_dest = self.secret_passages.get(current_location)
        if secret_dest:
            moves.append(secret_dest)

        return moves

    def place_starting_positions(self, players) -> None:
        """Place each player's character on their starting corridor."""
        for player in players:
            corridor = self.starting_positions.get(player.character)
            if corridor:
                self.occupants[corridor] = player.character
                player.location = corridor
        

class CardDeck: 
    """Holds all 21 CLue cards, seals the solution enveloppe, and deals cards to players."""
    
    SUSPECTS = [
        "Colonel Mustard", "Miss Scarlet", "Professor Plum",
        "Mr. Green", "Mrs. White", "Mrs. Peacock",
    ]
    WEAPONS = [
        "Rope", "Lead Pipe", "Knife",
        "Wrench", "Candlestick", "Revolver",
    ]
    ROOMS = [
        "Study", "Hall", "Lounge", "Library",
        "Billiard Room", "Dining Room",
        "Conservatory", "Ballroom", "Kitchen",
    ]

    def __init__(self):
        self.solution : dict[str, str] = {}
        self.sealed: bool = False

    def seal_solution(self) -> None:
        """Randomly select one suspect, weapon, and room as the winning answer."""
        self.solution = {
            "suspect": random.choice(self.SUSPECTS),
            "weapon": random.choice(self.WEAPONS),
            "room": random.choice(self.ROOMS),
        }
        self.sealed = True

    def deal(self, players) -> None:
        """Shuffle the 18 remaining cards and distribute round-robin to players."""
        remaining = (
            [s for s in self.SUSPECTS if s != self.solution["suspect"]]
            + [w for w in self.WEAPONS if w != self.solution["weapon"]]
            + [r for r in self.ROOMS if r != self.solution["room"]]
        )
        random.shuffle(remaining)
        for i, card in enumerate(remaining):
            players[i % len(players)].hand.append(card)
    
    def check_solution(self, suspect: str, weapon: str, room: str) -> bool:
        """Return True if the accusation matches the sealed solution."""
        return (
            self.solution.get("suspect") == suspect
            and self.solution.get("weapon") == weapon
            and self.solution.get("room") == room
        )

class SuggestionManager:
    """Manages one disproof cycle. Created on suggestion, destroyed on resolution."""

    def __init__(
        self,
        suggesting_player_id: str,
        suspect: str,
        weapon: str,
        room: str,
        turn_order: list[str],
    ):
        self.suggesting_player_id = suggesting_player_id
        self.suspect = suspect
        self.weapon = weapon
        self.room = room
        self.disproof_queue: list[str] = []
        self.current_index: int = 0
        self.resolved: bool = False
        self._build_queue(turn_order)

    def _build_queue(self, turn_order: list[str]) -> None:
        """Build clockwise disproof order starting after the suggester."""
        idx = turn_order.index(self.suggesting_player_id)
        n = len(turn_order)
        self.disproof_queue = [
            turn_order[(idx + i) % n]
            for i in range(1, n)
        ]

    def current_disproving_player(self) -> str | None:
        """Return the player ID who must respond next, or None if exhausted."""
        if self.current_index < len(self.disproof_queue):
            return self.disproof_queue[self.current_index]
        return None

    def advance(self) -> str | None:
        """Move to the next candidate and return their ID, or None if exhausted."""
        self.current_index += 1
        return self.current_disproving_player()

    def is_exhausted(self) -> bool:
        """Return True if all candidates have been asked."""
        return self.current_index >= len(self.disproof_queue)