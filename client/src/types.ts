export interface GameState {}

export interface JoinRequest {
  type: "join";
  requestId: string;
  payload: {
    playerName: string;
  };
}

export interface JoinResponse {
  type: "join_response";
  payload: {
    playerState: PlayerState;
    gameState: GameState;
  };
}

export interface MessageRequest {
  type: "message";
  requestId: string;
  payload: {
    playerId: string;
    message: string;
  };
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
export type GameRequest = JoinRequest | MessageRequest;
export type GameResponse = JoinResponse | MessageResponse;
