export type PlayerState = {
  playerId: string;
  displayName: string;
  character: string;
  location: string;
  hand: string[];
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
export interface PlayerJoinedEvent {
  playerId: string;
}

export interface MovePayload {
  destination: string;
}
export interface SuggestionPayload {
  suspect: string;
  weapon: string;
}
export interface AccusationPayload {
  suspect: string;
  weapon: string;
  room: string;
}
export interface DisprovePayload {
  card: string;
}

export type ClientCommand =
  | { type: "move"; payload: MovePayload }
  | { type: "suggest"; payload: SuggestionPayload }
  | { type: "accuse"; payload: AccusationPayload }
  | { type: "disprove"; payload: DisprovePayload };

export type ServerEvent =
  | { type: "player_joined"; payload: PlayerJoinedEvent }
  | { type: "welcome"; payload: WelcomeResponse }
  | { type: "game_update"; payload: GameState }
  | {type: "error"; payload: {message: string}};

export type Message = ClientCommand | ServerEvent;
