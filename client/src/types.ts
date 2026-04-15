export const Characters = {
  ColonelMustard: "Col. Mustard",
  MissScarlet: "Miss Scarlet",
  ProfessorPlum: "Professor Plum",
  MrGreen: "Mr. Green",
  MrsWhite: "Mrs. White",
  MrsPeacock: "Mrs. Peacock",
} as const;

export type Character = (typeof Characters)[keyof typeof Characters];

export const Weapons = {
  Rope: "Rope",
  LeadPipe: "Lead Pipe",
  Knife: "Knife",
  Wrench: "Wrench",
  Candlestick: "Candlestick",
  Revolver: "Revolver",
} as const;
export type Weapon = (typeof Weapons)[keyof typeof Weapons];

export const Rooms = {
  Study: "Study",
  Hall: "Hall",
  Lounge: "Lounge",
  Library: "Library",
  BilliardRoom: "Billiard Room",
  DiningRoom: "Dining Room",
  Conservatory: "Conservatory",
  Ballroom: "Ballroom",
  Kitchen: "Kitchen",
} as const;

export const Corridors = {
  StudyHall: "Study-Hall",
  HallLounge: "Hall-Lounge",
  StudyLibrary: "Study-Library",
  HallBilliardRoom: "Hall-Billiard Room",
  LoungeDiningRoom: "Lounge-Dining Room",
  LibraryBilliardRoom: "Library-Billiard Room",
  BilliardDiningRoom: "Billiard Room-Dining Room",
  LibraryConservatory: "Library-Conservatory",
  BilliardBallRoom: "Billiard Room-Ballroom",
  DiningRoomKitchen: "Dining Room-Kitchen",
  ConservatoryBallroom: "Conservatory-Ballroom",
  BallroomKitchen: "Ballroom-Kitchen",
} as const;

export const SecretPassages = {
  StudyKitchen: "Study-Kitchen",
  KitchenStudy: "Kitchen-Study",
  LoungeConservatory: "Lounge-Conservatory",
  ConservatoryLounge: "Conservatory-Lounge",
} as const;

export type Room = (typeof Rooms)[keyof typeof Rooms];
export type Corridor = (typeof Corridors)[keyof typeof Corridors];
export type SecretPassage =
  (typeof SecretPassages)[keyof typeof SecretPassages];

export type Location = Room | Corridor | SecretPassage;

export type Card = Weapon | Room | Character;

export type PlayerState = {
  playerId: string;
  displayName: string;
  character: Character;
  location: Location;
  hand: Card[];
  eliminated: boolean;
  is_host: boolean;
  moved_this_turn: boolean;
  must_suggest: boolean;
  dragged_to_room: boolean;
};

export interface GameState {
  playerStates: PlayerState[];
  turn_order: string[];
  current_turn_index: number;
  phase: string;
  suggestion_pending: boolean;
}

export interface WelcomeResponse {
  playerId: string;
}
export interface DealCardsEvent {
  cards: Card[]
}

export interface PlayerJoinedEvent {
  playerId: string;
}
export interface SuggestionMadeEvent {
  playerId: string;
  suspect: Character;
  weapon: Weapon;
  room: Room;
}

export interface SuggestionDisprovedEvent {
  disprovedBy: string;
}

export interface SuggestionUnchallengedEvent {
  playerId: string;
}
export interface DisproofCardEvent {
  playerId: string;
  card: Card;
}
export interface DisproveRequestEvent {
  suspect: Character;
  weapon: Weapon;
  room: Room;
}
export interface GameOverEvent {
  winner: string;
  solution: {
    suspect: Character,
    weapon: Weapon,
    room: Room
  }
}

export interface AccusationResultEvent {
  playerId: string;
  correct: boolean;
}

export interface MovePayload {
  destination: Location;
}
export interface SuggestionPayload {
  suspect: Character;
  weapon: Weapon;
}
export interface AccusationPayload {
  suspect: Character;
  weapon: Weapon;
  room: Room;
}
export interface DisprovePayload {
  card: Card;
}
export interface CharacterSelectPayload {
  character: Character;
}

export type ClientCommand =
  | { type: "move"; payload: MovePayload }
  | { type: "suggest"; payload: SuggestionPayload }
  | { type: "accuse"; payload: AccusationPayload }
  | { type: "cannot_disprove"; payload: {} }
  | { type: "select_character"; payload: CharacterSelectPayload }
  | { type: "start_game"; payload: {} }
  | { type: "disprove"; payload: DisprovePayload };

export type ServerEvent =
  | { type: "player_joined"; payload: PlayerJoinedEvent }
  | { type: "welcome"; payload: WelcomeResponse }
  | { type: "game_update"; payload: GameState }
  | { type: "suggestion_made"; payload: SuggestionMadeEvent }
  | { type: "disprove_request"; payload: DisproveRequestEvent }
  | { type: "accusation_result"; payload: AccusationResultEvent}
  | { type: "disprove_card"; payload: DisproofCardEvent }
  | { type: "suggestion_disproved"; payload: SuggestionDisprovedEvent }
  | { type: "suggestion_unchallenged"; payload: SuggestionUnchallengedEvent }
  | { type: "deal_cards"; payload: DealCardsEvent }
  | { type: "game_over"; payload: GameOverEvent}
  | { type: "error"; payload: { message: string } };

export type Message = ClientCommand | ServerEvent;
