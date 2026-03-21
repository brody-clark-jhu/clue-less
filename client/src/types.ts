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

export interface MessageCommand {
  message: string;
}

export type ClientCommand = { type: "message"; payload: MessageCommand };

export type ServerEvent =
  | { type: "player_joined"; payload: PlayerJoinedEvent }
  | { type: "welcome"; payload: WelcomeResponse }
  | { type: "game_update"; payload: GameState };

export type Message = ClientCommand | ServerEvent;
