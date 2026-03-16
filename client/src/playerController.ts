import { Client } from "./client";
import type {
  MessageRequest,
  MessageResponse,
  GameUpdate,
  PlayerState,
  GameResponse,
} from "./types";
import { View, onRequestButtonClick } from "./view";

export class PlayerController {
  client: Client;
  view: View;
  playerId: string;
  playerState: PlayerState | undefined;

  constructor(c: Client, v: View) {
    this.client = c;
    this.view = v;
    this.playerId = "";

    onRequestButtonClick(() => {
      console.log("request button clicked.");
      const msg: MessageRequest = {
        type: "message",
        message: "Hello from client",
      };
      this.client.sendMessage(msg).then((response: GameUpdate) => {
        if (response.type == "game_update") {
          const msgResponse = response as GameUpdate;
          console.log("message received:", msgResponse?.message);

          this.view.SetDisplayMessage(
            `message received: ${msgResponse?.message}`,
          );
        }
      });
    });
  }

  public start() {
    this.client
      .connectWebSocket()
      .then((response: GameUpdate | null) => {
        if (response) {
          this.playerId = response.from_player;
          console.log("Message received:", response.message);
          this.view.SetDisplayMessage(
            `Message received from server: ${response?.message}`,
          );
        }
      })
      .catch((error) => {
        console.error("Failed to connect to server", error);
      });
  }
}
