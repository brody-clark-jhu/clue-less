export type Envelope<T extends string, P> = {
  type: T;
  payload: P;
};
export type PlayerState = { playerId: string; clickCount: number };
export type ClientCommand =
  | { type: "player_join"; payload: { name: string } }
  | { type: "message"; payload: { message: string } };

export type ServerEvent =
  | { type: "player_joined"; payload: { playerId: string; name: string } }
  | { type: "welcome"; payload: { playerId: string } }
  | { type: "message_received"; payload: { playerId: string; message: string } }
  | { type: "game_update"; payload: { playerStates: PlayerState[] } };

export type Message = ClientCommand | ServerEvent;

export interface GameUpdate {
  type: "game_update";
  message: string;
  from_player: string;
}

export interface MessageRequest {
  message: string;
}

export interface MessageResponse {
  message: string;
}
