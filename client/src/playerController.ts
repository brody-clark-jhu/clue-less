import { Client } from "./client";
import type {
  ServerEvent,
  PlayerState,
  ClientCommand,
  MessageCommand,
} from "./types";
import { View, onRequestButtonClick, onJoinLobbyClick } from "./view";

export class PlayerController {
  client: Client;
  view: View;
  playerId: string;
  playerState: PlayerState | undefined;

  constructor(client: Client, view: View) {
    this.client = client;
    this.view = view;
    this.playerId = "";

    onRequestButtonClick(() => {
      console.log("request button clicked.");
      const message: MessageCommand = { message: "Hello from client" };
      const cmd: ClientCommand = {
        type: "message",
        payload: message,
      };
      this.client.sendMessage(cmd);
    });

    onJoinLobbyClick(() => {
      console.log("join lobby clicked - connecting to server.");
      this.client.connectWebSocket();
    });
  }

  public start() {
    // Setup socket message handler
    this.client.onMessage((msg) => {
      this.handleServerEvent(msg);
    });
  }

  private handleServerEvent(event: ServerEvent) {
    console.log(`Received event ${JSON.stringify(event)}`);

    // Handle different server event types
    switch (event.type) {
      case "player_joined": {
        this.view.AddPlayer(event.payload.playerId, "Joined");
        break;
      }
      case "welcome": {
        this.playerId = event.payload?.playerId;
        this.view.SetDisplayMessage(`Welcome player: ${this.playerId}.`);

        // After receiving welcome from server, transition to lobby UI
        this.view.showScreen("lobby-screen");
        break;
      }
      case "game_update": {
        const playerStates = event.payload.playerStates;
        for (let index = 0; index < playerStates.length; index++) {
          const player = playerStates[index];
          if (player.playerId == this.playerId) {
            this.view.SetDisplayMessage(`You clicked x${player.clickCount}`);
          } else {
            // Make sure text exists for player
            if (!this.view.HasPlayer(player.playerId)) {
              this.view.AddPlayer(player.playerId, "");
            }

            // Update click counter
            this.view.SetPlayerText(
              player.playerId,
              `Clicked x${player.clickCount}`,
            );
          }
        }

        break;
      }
    }
  }
}