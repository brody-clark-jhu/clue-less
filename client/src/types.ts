export interface GameUpdate {
  type: "game_update";
  message: string;
  from_player: string;
}

export interface MessageRequest {
  type: "message";
  message: string;
}

export interface MessageResponse {
  type: "message_response";
  payload: {
    message: string;
  };
}

export interface PlayerState {
  playerId: string;
}

// Union type for all requests/responses
export type GameRequest = MessageRequest;
export type GameResponse = GameUpdate | MessageResponse;
