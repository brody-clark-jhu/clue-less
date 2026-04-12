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
            "Study-Hall", "Study-Library",
            "Hall-Lounge", "Hall-Billiard Room",
            "Lounge-Dining Room",
            "Library-Billiard Room", "Library-Conservatory",
            "Billiard Room-Dining Room", "Billiard Room-Ballroom",
            "Dining Room-Kitchen",
            "Conservatory-Ballroom",
            "Ballroom-Kitchen",
        }
        self.adjacency: dict[str, list[str]] = {
            "Study":         ["Study-Hall", "Study-Library"],
            "Hall":          ["Study-Hall", "Hall-Lounge", "Hall-Billiard Room"],
            "Lounge":        ["Hall-Lounge", "Lounge-Dining Room"],
            "Library":       ["Study-Library", "Library-Billiard Room", "Library-Conservatory"],
            "Billiard Room": ["Hall-Billiard Room", "Library-Billiard Room",
                              "Billiard Room-Dining Room", "Billiard Room-Ballroom"],
            "Dining Room":   ["Lounge-Dining Room", "Billiard Room-Dining Room", "Dining Room-Kitchen"],
            "Conservatory":  ["Library-Conservatory", "Conservatory-Ballroom"],
            "Ballroom":      ["Billiard Room-Ballroom", "Conservatory-Ballroom", "Ballroom-Kitchen"],
            "Kitchen":       ["Dining Room-Kitchen", "Ballroom-Kitchen"],
            "Study-Hall":               ["Study", "Hall"],
            "Study-Library":            ["Study", "Library"],
            "Hall-Lounge":              ["Hall", "Lounge"],
            "Hall-Billiard Room":       ["Hall", "Billiard Room"],
            "Lounge-Dining Room":       ["Lounge", "Dining Room"],
            "Library-Billiard Room":    ["Library", "Billiard Room"],
            "Library-Conservatory":     ["Library", "Conservatory"],
            "Billiard Room-Dining Room": ["Billiard Room", "Dining Room"],
            "Billiard Room-Ballroom":   ["Billiard Room", "Ballroom"],
            "Dining Room-Kitchen":      ["Dining Room", "Kitchen"],
            "Conservatory-Ballroom":    ["Conservatory", "Ballroom"],
            "Ballroom-Kitchen":         ["Ballroom", "Kitchen"],
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
        # Used the classic clue game starting positions
        self.starting_positions: dict[str, str] = {
            "Professor Plum":  "Study-Library",
            "Miss Scarlet":    "Hall-Lounge",
            "Colonel Mustard": "Lounge-Dining Room",
            "Mrs. White":      "Ballroom-Kitchen",
            "Mr. Green":       "Conservatory-Ballroom",
            "Mrs. Peacock":    "Library-Conservatory",
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