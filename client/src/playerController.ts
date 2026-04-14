import { Client } from "./client";
import {
  type ServerEvent,
  type PlayerState,
  type Weapon,
  type Room,
  type ClientCommand,
  type MovePayload,
  type GameState,
  type SuggestionPayload,
  type DisprovePayload,
  type Character,
  Characters,
  Weapons,
  Rooms,
} from "./types";
import {
  View,
  onJoinLobbyClick,
  onBoardClick,
  onAccuseButtonClick,
  onSuggestionButtonClick,
  onMoveButtonClick,
  onCardSelection,
  onCharacterSelection,
  onStartButtonClicked,
} from "./view";
import type { NotebookItem } from "./models/game.model";
import type {
  Location,
  Card,
  AccusationPayload,
  CharacterSelectPayload,
  DisproveRequestEvent,
} from "./types";
import { loadNotebookData } from "./dataLoader";


export const PLAYER_STATES = {
  Default: 0,
  Lobby: 1,
  Idle: 2,
  Active: 3,
  Selecting: 4,
  Disprove: 5,
  Eliminated: 6,
} as const;

type PlayerPhase = (typeof PLAYER_STATES)[keyof typeof PLAYER_STATES];

export class PlayerController {
  private client: Client;
  private view: View;

  private playerId = "";
  private gameState?: GameState;
  private playerState?: PlayerState;
  private playerPhase: PlayerPhase = PLAYER_STATES.Default;

  private notebookItems: NotebookItem[] = [];
  private hand: Card[] = [];

  // Selection context
  private selectionContext: "suggestion" | "accusation" | "disprove" | null = null;
  private selectionStep: "suspect" | "weapon" | "room" | null = null;

  private suggestion = { suspect: undefined as Character | undefined, weapon: undefined as Weapon | undefined };
  private accusation = { suspect: undefined as Character | undefined, weapon: undefined as Weapon | undefined, room: undefined as Room | undefined };

  private eventQueue: ServerEvent[] = [];
  private isProcessing = false;

  constructor(client: Client, view: View) {
    this.client = client;
    this.view = view;

    this.registerUIHandlers();
  }

  async start() {
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
      this.onServerEvent(msg);
    });
  }

  private registerUIHandlers() {
    onJoinLobbyClick(() => {
      this.client.connectWebSocket();
    });

    onCharacterSelection((character: Character) => {
      const payload: CharacterSelectPayload = {
        character: character,
      };
      const command: ClientCommand = {
        type: "select_character",
        payload: payload,
      };
      this.client.sendMessage(command);
    });

    onStartButtonClicked(() => {
      console.log("Starting Game.");
      this.client.sendMessage({ type: "start_game", payload: {} });
    });

    onMoveButtonClick(() => {
      if (this.playerPhase !== PLAYER_STATES.Active) return;
      this.view.SetPopupEventMessage("Select a location to move to", 2);
      this.setPhase(PLAYER_STATES.Selecting);
      this.selectionContext = "suggestion";
    });

    onSuggestionButtonClick(() => {
      if (this.playerPhase !== PLAYER_STATES.Active) return;
      this.startSuggestion();
    });

    onAccuseButtonClick(() => {
      if (this.playerPhase !== PLAYER_STATES.Active) return;
      this.startAccusation();
    });

    onBoardClick((location: Location) => {
      if (this.playerPhase !== PLAYER_STATES.Selecting) return;

      this.client.sendMessage({
        type: "move",
        payload: { destination: location },
      });
    });

    onCardSelection((card) => {
      this.handleCardSelection(card);
    });
  }

  public onServerEvent(event: ServerEvent) {
    this.eventQueue.push(event);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) await this.handleServerEvent(event);
    }

    this.isProcessing = false;
  }

  private async handleServerEvent(event: ServerEvent) {
    switch (event.type) {
      case "welcome":
        this.playerId = event.payload.playerId;
        break;

      case "deal_cards":
        this.view.ShowGameBoardScreen(this.notebookItems);
        
        
        this.hand = event.payload.cards;
        this.view.SetPlayerHand(this.hand);

        this.view.SetPlayerProfile(this.playerId, this.playerState!.character);
        this.setPhase(PLAYER_STATES.Idle);
        break;

      case "game_update":
        this.gameState = event.payload;
        this.updatePlayerState();
        await this.handleGameStateChange();
        break;

      case "disprove_request":
        this.handleDisproveRequest(event.payload);
        break;

      case "suggestion_made":
        const player = this.gameState!.playerStates.find(
          (p) => p.playerId === event.payload.playerId
        );
        const location = player?.location
        await this.view.SetPopupEventMessage(
          `Player ${event.payload.playerId} suggested ${event.payload.suspect} with ${event.payload.weapon} in ${location}.`
        );
        break;

      case "suggestion_unchallenged": {
        const suggestionPlayer = event.payload.playerId;
        await this.view.SetPopupEventMessage(
          `Suggestion by Player ${suggestionPlayer} has not been disproven.`,
          5,
        );
        break;
      }
      case "suggestion_disproved": {
        await this.view.SetPopupEventMessage(
          `Player ${event.payload.disprovedBy} has disproven the suggestion.`,
          5,
        );
        break;
      }
      case "accusation_result": {
        await this.view.SetPopupEventMessage(
          `Player ${event.payload.playerId} has been eliminated.`,
          3,
        );
        break;
      }
      case "game_over": {
        await this.view.SetPopupEventMessage(
          `Player ${event.payload.winner} has won. The solution was ${JSON.stringify(event.payload.solution)} Game over.`,
          5,
        );
        break;
      }
      case "disprove_card": {
        const disprovedBy = event.payload.playerId;
        const disproofCard = event.payload.card;
        await this.view.SetPopupEventMessage(
          `Player ${disprovedBy} reveals card: ${disproofCard}`,
          4,
        );
        break;
      }
      case "error":
        await this.view.SetPopupEventMessage(event.payload.message, 3);
        break;
    }
  }

  private updatePlayerState() {
    this.playerState = this.gameState?.playerStates.find(
      (p) => p.playerId === this.playerId
    );
  }

  private async handleGameStateChange() {
    if (!this.gameState || !this.playerState) return;

    console.log(`Game State: ${JSON.stringify(this.gameState)}`);

    const activeId =
      this.gameState.turn_order[this.gameState.current_turn_index];
    console.log(`Active player id: ${activeId}`);

    if (this.gameState!.phase == "lobby") {
        this.setPhase(PLAYER_STATES.Lobby);
    }
    else if (this.gameState.phase == "active") {
      // update board
      this.gameState.playerStates.forEach((p) => {
        this.view.SetCharacterLocation(p.character, p.location);
      });
      if (activeId === this.playerId) {
        this.view.SetPlayerTurn("Your Turn");
        console.log("This player's turn");

        if (this.playerState!.must_suggest){
          await this.startSuggestion();
        }
        else{
        this.setPhase(PLAYER_STATES.Active);
        }
      } else {
        console.log(`Player ${activeId}'s Turn`);
        this.view.SetPlayerTurn(`Player ${activeId}'s Turn`);
        this.setPhase(PLAYER_STATES.Idle);
      }
      
    }
    else{
      this.setPhase(PLAYER_STATES.Default);
    }

    if (this.playerState.eliminated) {
      this.setPhase(PLAYER_STATES.Eliminated);
      return;
    }

    
  }

  // FSM
  private setPhase(newPhase: PlayerPhase) {
    if (this.playerPhase === newPhase) return;

    this.exitState(this.playerPhase);
    this.playerPhase = newPhase;
    this.enterState(newPhase);
  }

  private enterState(state: PlayerPhase) {
    switch (state) {
      case PLAYER_STATES.Default:
        this.view.ShowLandingScreen();
        break;
      case PLAYER_STATES.Lobby:
        this.view.ShowLobbyScreen(this.playerState!.is_host);
        break;
      case PLAYER_STATES.Active:
        this.view.EnableActions(true);
        break;

      case PLAYER_STATES.Idle:
        this.view.EnableActions(false);
        break;

      case PLAYER_STATES.Selecting:
        break;

      case PLAYER_STATES.Disprove:
        console.log("Disprove state");
        this.selectionContext = "disprove";
        this.view.EnableCardSelection(this.hand, "Select a card to disprove");
        break;
    }
  }

  private exitState(state: PlayerPhase) {
    if (state === PLAYER_STATES.Disprove || state === PLAYER_STATES.Selecting) {
      this.view.DisableCardSelection();
    }
  }

  private async startSuggestion() {
    this.selectionContext = "suggestion";
    this.selectionStep = "suspect";

    await this.view.SetPopupEventMessage("Select cards for suggestion", 2);
    await this.view.EnableCardSelection(Object.values(Characters), "Select suspect");
    this.setPhase(PLAYER_STATES.Selecting);
  }

  private async startAccusation() {
    this.selectionContext = "accusation";
    this.selectionStep = "suspect";
    await this.view.SetPopupEventMessage("Select cards for accusation", 2);

    this.view.EnableCardSelection(Object.values(Characters), "Select suspect");
    this.setPhase(PLAYER_STATES.Selecting);
  }

  private handleCardSelection(card: Card) {
    if (!this.selectionContext) return;

    if (this.selectionContext === "suggestion") {
      this.handleSuggestionSelection(card);
    } else if (this.selectionContext === "accusation"){
      this.handleAccusationSelection(card);
    }
    else{
      this.handleDisproofSelection(card);
    }
  }

  private handleDisproofSelection(card: Card){
    const payload: DisprovePayload = {
        card: card,
      };
      const command: ClientCommand = {
        type: "disprove",
        payload: payload,
      };
      this.client.sendMessage(command);
      this.setPhase(PLAYER_STATES.Idle);
  }

  private handleSuggestionSelection(card: Card) {
    if (this.selectionStep === "suspect") {
      this.suggestion.suspect = card as Character;
      this.selectionStep = "weapon";
      this.view.EnableCardSelection(Object.values(Weapons), "Select weapon");
    } else {
      this.suggestion.weapon = card as Weapon;
      const suggestionPayload: SuggestionPayload = {
        suspect: this.suggestion.suspect!,
        weapon: this.suggestion.weapon!,
      };
      const suggestionCommand: ClientCommand = {
        type: "suggest",
        payload: suggestionPayload,
      };
      this.client.sendMessage(suggestionCommand);

      this.resetSelection();
    }
  }

  private handleAccusationSelection(card: Card) {
    if (this.selectionStep === "suspect") {
      this.accusation.suspect = card as Character;
      this.selectionStep = "weapon";
      this.view.EnableCardSelection(Object.values(Weapons), "Select weapon");
    } else if (this.selectionStep === "weapon") {
      this.accusation.weapon = card as Weapon;
      this.selectionStep = "room";
      this.view.EnableCardSelection(Object.values(Rooms), "Select room");
    } else {
      this.accusation.room = card as Room;

      const accusationPayload: AccusationPayload = {
        suspect: this.accusation.suspect!,
        weapon: this.accusation.weapon!,
        room: this.accusation.room!,
      };
      const accuseCommand: ClientCommand = {
        type: "accuse",
        payload: accusationPayload,
      };
      this.client.sendMessage(accuseCommand);

      this.resetSelection();
    }
  }

  private resetSelection() {
    this.selectionContext = null;
    this.selectionStep = null;
    if(this.playerState!.must_suggest){
      this.setPhase(PLAYER_STATES.Idle);
    }
    else{
      this.setPhase(PLAYER_STATES.Active);
    }
  }


  private async handleDisproveRequest(event: DisproveRequestEvent) {
    const suggestion = new Set([
      event.room,
      event.suspect,
      event.weapon,
    ]);

    const valid = this.hand.filter((c) => suggestion.has(c));

    if (valid.length > 0) {
      await this.view.SetPopupEventMessage("Select a card to disprove with", 3);
      this.setPhase(PLAYER_STATES.Disprove);
    } else {
      console.log("Cannot disprove");
      this.client.sendMessage({ type: "cannot_disprove", payload: {} });
    }
  }
}
