import { Client } from "./client";
import type { ServerEvent, PlayerState } from "./types";
import {
  View,
  onJoinLobbyClick,
  onBoardClick,
  onAccuseButtonClick,
  onEndTurnButtonClick,
  onSuggestionButtonClick,
  onMoveButtonClick,
} from "./view";
import type { Locations, NotebookItem } from "./models/game.model";
import { loadNotebookData } from "./dataLoader";

// Player states for Finite State Machine (FSM)
export const PLAYER_STATES = {
  Lobby: 1, // in lobby
  Idle: 2, // waiting for their turn
  Active: 3, // active player turn
  Move: 4, // move selection active
  Suggest: 5, // suggestion active
  Accuse: 6, // accusation active
  Disprove: 7, // disprove active
  Eliminated: 8, // eliminated/inactive
  Start: 9, // setup game
} as const;

export type PlayerPhase = (typeof PLAYER_STATES)[keyof typeof PLAYER_STATES];

export class PlayerController {
  client: Client;
  view: View;
  playerId: string;
  playerState: PlayerState | undefined;
  playerPhase: PlayerPhase;
  notebookItems: NotebookItem[];

  constructor(client: Client, view: View) {
    this.client = client;
    this.view = view;
    this.playerId = "";
    this.notebookItems = [];
    this.playerPhase = PLAYER_STATES.Lobby;

    onJoinLobbyClick(() => {
      console.log("join lobby clicked - connecting to server.");
      this.client.connectWebSocket();
    });
  }

  public async start() {
    console.log("Starting player controller...");
    try {
      const defaults = await loadNotebookData();
      const items: NotebookItem[] = defaults.map((d, i) => ({
        item: d.item,
      }));
      this.notebookItems = items;
      console.log(`loaded ${items.length} items from local storage.`);
    } catch (error) {
      console.error("Failed to load notebook data.");
    }

    // Setup socket message handler
    this.client.onMessage((msg) => {
      this.handleServerEvent(msg);
    });
  }

  // FSM state enter
  private enterState(state: PlayerPhase) {
    console.log(`Entering state: ${state}`);
    switch (state) {
      case PLAYER_STATES.Start:
        this.view.ShowGameBoardScreen(this.notebookItems);
        this.setPlayerPhase(PLAYER_STATES.Idle);

        // TODO: this is for testing. Game board clicks should be
        // handled within necessary player states and removed on exit
        onBoardClick((location: Locations) => {
          console.log(`Player clicked on: ${location}`);
          this.handleGameBoardClicked(location);
        });
        break;
      case PLAYER_STATES.Active:
        break;
    }
  }

  // FMS state exit
  private exitState(state: PlayerPhase) {
    console.log(`Exiting state: ${state}`);
    switch (state) {
      case PLAYER_STATES.Lobby:
        break;
      case PLAYER_STATES.Start:
        break;
      case PLAYER_STATES.Active:
        onBoardClick((location: Locations) => {
          console.log(`Player clicked on: ${location}`);
          this.handleGameBoardClicked(location);
        });
        break;
    }
  }

  // set FSM state
  private setPlayerPhase(state: PlayerPhase) {
    if (this.playerPhase === state) return;
    this.exitState(this.playerPhase);
    this.playerPhase = state;
    this.enterState(this.playerPhase);
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
        // this.view.ShowScreen("lobby-screen");

        // TODO: This should be lobby state once that is implemented
        this.setPlayerPhase(PLAYER_STATES.Start);
        break;
      }
      case "game_update":{
        console.log("Received game update from server");
        break;
      }
      case "error": {
        console.error(`Error: ${event.payload.message}`);
      }


    }
  }

  private handleGameBoardClicked(location: Locations): void {
    console.log(`Handle game board clicked: ${location}`);
  }
}
