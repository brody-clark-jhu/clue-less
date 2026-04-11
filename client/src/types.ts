export type PlayerState = { playerId: string; clickCount: number };

export interface WelcomeResponse {
  playerId: string;
}
export interface PlayerJoinedEvent {
  playerId: string;
}
export interface GameState {
  playerStates: PlayerState[];
}

export interface MovePayload {
  destination: string;
}
export interface SuggestionPayload {
  suspect: string;
  weapon: string
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
  | { type: "suggest"; payload: MovePayload }
  | { type: "accuse"; payload: MovePayload }
  | { type: "disprove"; payload: MovePayload }

export type ServerEvent =
  | { type: "player_joined"; payload: PlayerJoinedEvent }
  | { type: "welcome"; payload: WelcomeResponse }
  | { type: "game_update"; payload: GameState };

export type Message = ClientCommand | ServerEvent;
