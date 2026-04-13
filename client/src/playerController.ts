import { Client } from "./client";
import type { ServerEvent, PlayerState, Character, LobbyPlayer } from "./types"; // added modification — Character, LobbyPlayer
import {
  View,
  onJoinLobbyClick,
  onBoardClick,
  onAccuseButtonClick,
  onEndTurnButtonClick,
  onSuggestionButtonClick,
  onMoveButtonClick,
  onCharacterSelectClick, // added modification
  onReadyUpClick,         // added modification
  onStartGameClick,       // added modification
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

  // added modification — lobby-specific state tracked on the client
  private selectedCharacter: Character | null = null; // added modification
  private isReady: boolean = false;                   // added modification
  private lobbyPlayers: LobbyPlayer[] = [];           // added modification

  constructor(client: Client, view: View) {
    this.client = client;
    this.view = view;
    this.playerId = "";
    this.notebookItems = [];
    this.playerPhase = PLAYER_STATES.Lobby;

    onJoinLobbyClick(() => {
      console.log("join lobby clicked - connecting to server.");
      this.view.ShowLobbyScreen(); // added modification — switch to lobby immediately on button click
      this.client.connectWebSocket();
    });

    // added modification — send character_select command when a card is clicked
    onCharacterSelectClick((character: Character) => {           // added modification
      console.log(`Character selected: ${character}`);           // added modification
      this.selectedCharacter = character;                        // added modification
      // added modification — optimistic UI update before server confirms
      this.view.SetCharacterSelected(character);                 // added modification
      this.client.sendMessage({                                  // added modification
        type: "character_select",                               // added modification
        payload: { character },                                  // added modification
      });                                                        // added modification
    });                                                          // added modification

    // added modification — toggle ready state and send ready_up command
    onReadyUpClick(() => {                                       // added modification
      this.isReady = !this.isReady;                             // added modification
      console.log(`Ready state toggled: ${this.isReady}`);      // added modification
      this.client.sendMessage({                                  // added modification
        type: "ready_up",                                        // added modification
        payload: { ready: this.isReady },                       // added modification
      });                                                        // added modification
    });                                                          // added modification

    // added modification — send start_game command (host only; button hidden for others)
    onStartGameClick(() => {                                     // added modification
      console.log("Host starting game...");                      // added modification
      this.client.sendMessage({                                  // added modification
        type: "start_game",                                      // added modification
        payload: {},                                             // added modification
      });                                                        // added modification
    });                                                          // added modification
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

        break;
      }

      case "game_update": { // added modification — explicit case so TypeScript exhaustiveness is satisfied
        break;              // added modification
      }                     // added modification

      // added modification — lobby_update: full snapshot of lobby state; re-render both panes
      case "lobby_update": {                                                       // added modification
        this.lobbyPlayers = event.payload.players;                                // added modification
        this.view.UpdateLobbyPlayers(this.lobbyPlayers, this.playerId);           // added modification
        break;                                                                     // added modification
      }                                                                            // added modification

      // added modification — character_selected: one player claimed or released a character
      case "character_selected": {                                                  // added modification
        console.log(                                                               // added modification
          `Character ${event.payload.character} claimed by ${event.payload.playerId}` // added modification
        );                                                                         // added modification
        break;                                                                     // added modification
      }                                                                            // added modification

      // added modification — game_started: host started game; transition all clients to game board
      case "game_started": {                                                       // added modification
        console.log(`Game started. First player: ${event.payload.startingPlayerId}`); // added modification
        this.setPlayerPhase(PLAYER_STATES.Start);                                 // added modification
        break;                                                                     // added modification
      }                                                                            // added modification
    }
  }

  private handleGameBoardClicked(location: Locations): void {
    console.log(`Handle game board clicked: ${location}`);
  }
}
