import { Client } from "./client";
import type { CommandDTO } from "./types";
import { onRequestButtonClick } from "./view";

export class PlayerController {
  client: Client;

  constructor(c: Client) {
    this.client = c;

    onRequestButtonClick(() => {
      console.log("request button clicked.");
      const cmd: CommandDTO = {
        type: "message",
        payload: {
          playerId: "player 1",
          message: "Hello from client",
        },
      };
      this.client.sendMessage(cmd);
    });
  }
}
