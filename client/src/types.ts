export interface CommandDTO {
  type: "message"; // "move" | "suggestion" | etc...
  requestId: string,
  payload: {
    playerId: string;
    message?: string;
  };
};

export interface GameStateDTO {
  type: "message"; 
  payload: {
    message?: string;
  };
};

export interface ServerResponseDTO{
    status: string,
    reason: string,
    requestId: string,
    gameState: GameStateDTO,
};

