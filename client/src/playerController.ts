import { Client } from "./client";
import type {
  MessageRequest,
  MessageResponse,
  JoinRequest,
  JoinResponse,
  PlayerState,
  GameRequest,
  GameResponse,
} from "./types";
import { View, onRequestButtonClick } from "./view";

export class PlayerController {
  client: Client;
  view: View;
  playerState: PlayerState | undefined;

  constructor(c: Client, v: View) {
    this.client = c;
    this.view = v;

    onRequestButtonClick(() => {
      console.log("request button clicked.");
      const msg: MessageRequest = {
        type: "message",
        requestId: crypto.randomUUID(),
        payload: {
          playerId: "",
          message: "Hello from client",
        },
      };
      this.client.sendMessage(msg).then((response: GameResponse) => {
        if (response.type == "message_response") {
          const msgResponse = response as MessageResponse;
          console.log("message received:", msgResponse?.payload.message);

          this.view.SetDisplayMessage(
            `message received: ${msgResponse?.payload.message}`,
          );
        }
      });
    });
  }

  public start() {
    const cmd: JoinRequest = {
      type: "join",
      requestId: crypto.randomUUID(),
      payload: {
        playerName: "player",
      },
    };
    this.client
      .sendMessage(cmd)
      .then((response: GameResponse) => {
        if (response.type === "join_response") {
          const joinResponse = response as JoinResponse;
          const playerState = joinResponse.payload.playerState;

          this.playerState = playerState;
          console.log("Player ID:", playerState.playerId);
        } else {
          console.error("unexpected response type:", response.type);
        }
      })
      .catch((error) => {
        console.error("send message failed:", error);
      });
  }
}
