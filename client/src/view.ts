import {
  type NotebookItem,
  type Locations,
  Rooms,
  Corridors,
  SecretPassages
} from "./models/game.model";
import type { Character, LobbyPlayer } from "./types";

type BoardClickCallback = (location: Locations) => void;
let boardClickCallback: BoardClickCallback | undefined;

type JoinLobbyCallback = () => void;
let joinLobbyCallback: JoinLobbyCallback | undefined;

type MoveButtonClickCallback = () => void;
let moveButtonClickCallback: MoveButtonClickCallback | undefined;

type SuggestionButtonClickCallback = () => void;
let suggestionButtonClickCallback: SuggestionButtonClickCallback | undefined;

type AccuseButtonClickCallback = () => void;
let accuseButtonClickCallback: AccuseButtonClickCallback | undefined;

type EndTurnButtonClickCallback = () => void;
let endTurnButtonClickCallback: EndTurnButtonClickCallback | undefined;

type CharacterSelectCallback = (character: Character) => void; 
let characterSelectCallback: CharacterSelectCallback | undefined; 

type ReadyUpCallback = () => void;        
let readyUpCallback: ReadyUpCallback | undefined; 

type StartGameCallback = () => void;      
let startGameCallback: StartGameCallback | undefined; 

export function onBoardClick(cb: BoardClickCallback) {
  boardClickCallback = cb;
}

export function onMoveButtonClick(cb: MoveButtonClickCallback) {
  moveButtonClickCallback = cb;
}
export function onAccuseButtonClick(cb: AccuseButtonClickCallback) {
  accuseButtonClickCallback = cb;
}
export function onSuggestionButtonClick(cb: SuggestionButtonClickCallback) {
  suggestionButtonClickCallback = cb;
}
export function onEndTurnButtonClick(cb: EndTurnButtonClickCallback) {
  endTurnButtonClickCallback = cb;
}

export function onJoinLobbyClick(cb: JoinLobbyCallback) {
  joinLobbyCallback = cb;
}

export function onCharacterSelectClick(cb: CharacterSelectCallback) {
  characterSelectCallback = cb;                                      
}                                                                     

export function onReadyUpClick(cb: ReadyUpCallback) {
  readyUpCallback = cb;                               
}                                                     

export function onStartGameClick(cb: StartGameCallback) { 
  startGameCallback = cb;                                
}                                                      

const ID_TO_LOCATION: Record<string, Locations> = {
  library: Rooms.Library,
  study: Rooms.Study,
  hall: Rooms.Hall,
  lounge: Rooms.Lounge,
  "dining-room": Rooms.DiningRoom,
  kitchen: Rooms.Kitchen,
  ballroom: Rooms.Ballroom,
  conservatory: Rooms.Conservatory,
  "billiard-room": Rooms.BilliardRoom,
  "study-hall": Corridors.StudyHall,
  "hall-lounge": Corridors.HallLounge,
  "study-library": Corridors.StudyLibrary,
  "library-billiard-room": Corridors.LibraryBilliardRoom,
  "hall-billiard-room": Corridors.HallBilliardRoom,
  "billiard-room-dining-room": Corridors.BilliardDiningRoom,
  "library-conservatory": Corridors.LibraryConservatory,
  "billiard-room-ballroom": Corridors.BilliardBallRoom,
  "dining-room-kitchen": Corridors.DiningRoomKitchen,
  "conservatory-ballroom": Corridors.ConservatoryBallroom,
  "ballroom-kitchen": Corridors.BallroomKitchen,
  "lounge-dining-room": Corridors.LoungeDiningRoom,
};

export class View {
  displayTxt: HTMLElement;
  button: HTMLElement;
  playerContainer: HTMLElement;
  playerElements: Map<string, HTMLParagraphElement>;

  constructor() {
    this.displayTxt = document.getElementById("display-message")!;
    this.button = document.getElementById("request")!;
    this.playerContainer = document.getElementById("players")!;
    this.playerElements = new Map<string, HTMLParagraphElement>();

    const gameMap = document.querySelector(
      'map[name="image-map"]',
    ) as HTMLMapElement;
    if (gameMap) {
      gameMap.addEventListener("click", (event: MouseEvent) => {
        // Prevent the default "href" behavior (reloading the page)
        event.preventDefault();

        // The 'target' is the specific <area> that was clicked
        const clickedArea = event.target as HTMLAreaElement;

        // Ensure we actually clicked an <area> and not just the map background
        if (clickedArea.tagName === "AREA") {
          const locationId = clickedArea.getAttribute("alt")!;

          console.log(`clicked: ${locationId}`);
          const location = ID_TO_LOCATION[locationId];
          if (location && boardClickCallback) {
            boardClickCallback(location);
          }
        }
      });
    }

    const moveButton = document.getElementById("move") as HTMLButtonElement;
    if (moveButton) {
      moveButton.addEventListener("click", () => {
        if (moveButtonClickCallback) {
          moveButtonClickCallback();
        }
      });
    }

    const accuseButton = document.getElementById(
      "accusation",
    ) as HTMLButtonElement;
    if (accuseButton) {
      accuseButton.addEventListener("click", () => {
        if (accuseButtonClickCallback) {
          accuseButtonClickCallback();
        }
      });
    }

    const suggestionButton = document.getElementById(
      "suggestion",
    ) as HTMLButtonElement;
    if (suggestionButton) {
      suggestionButton.addEventListener("click", () => {
        if (suggestionButtonClickCallback) {
          suggestionButtonClickCallback();
        }
      });
    }
    const endTurnButton = document.getElementById(
      "end-turn",
    ) as HTMLButtonElement;
    if (endTurnButton) {
      endTurnButton.addEventListener("click", () => {
        if (endTurnButtonClickCallback) {
          endTurnButtonClickCallback();
        }
      });
    }

    //Changes the front page to the lobby page
    const joinLobbyBtn = document.getElementById("btn-join-lobby");
    if (joinLobbyBtn) {
      joinLobbyBtn.addEventListener("click", () => {
        if (joinLobbyCallback) {
          joinLobbyCallback();
        }
      });
    }

    const characterGrid = document.querySelector(".character-grid"); 
    if (characterGrid) {                                              
      characterGrid.addEventListener("click", (e: Event) => {        
        const card = (e.target as HTMLElement).closest(".character-card") as HTMLElement | null; 
        if (!card || card.classList.contains("taken")) return;        
        const character = card.dataset.character as Character;        
        if (character && characterSelectCallback) {                  
          characterSelectCallback(character);                        
        }                                                             
      });                                                           
    }                                                                 

    const readyBtn = document.getElementById("btn-ready-up"); 
    if (readyBtn) {                                            
      readyBtn.addEventListener("click", () => {             
        if (readyUpCallback) readyUpCallback();               
      });                                                      
    }                                                          

    const startBtn = document.getElementById("btn-start-game"); 
    if (startBtn) {                                              
      startBtn.addEventListener("click", () => {                
        if (startGameCallback) startGameCallback();             
      });                                                      
    }                                                       
  }

  //Switch screens using the ID
  private ShowScreen(screenId: string): void {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.remove("active");
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
    }
  }

  private populateNotebook(notebookItems: NotebookItem[]): void {
    const notebookContainer = document.getElementById("notebook-list");
    if (!notebookContainer) return;
    // Use the existing DOM item with id `notebook-item` as a template.
    const template = document.getElementById(
      "notebook-item",
    ) as HTMLLIElement | null;
    // Clear any existing generated items (keep template out of the list)
    notebookContainer.innerHTML = "";

    if (template) {
      notebookItems.forEach((nb, idx) => {
        const clone = template.cloneNode(true) as HTMLLIElement;
        // Remove id from clone so we don't duplicate ids
        clone.removeAttribute("id");

        // Find input and label inside clone and populate
        const input = clone.querySelector(
          "input[type=checkbox]",
        ) as HTMLInputElement | null;
        const label = clone.querySelector("label") as HTMLLabelElement | null;
        if (input) input.id = `nb-${idx + 1}`;
        if (label && input) {
          label.htmlFor = input.id;
          label.textContent = nb.item;
        } else if (label) {
          label.textContent = nb.item;
        }

        notebookContainer.appendChild(clone);
      });
    } else {
      // Fallback: create simple list items
      notebookItems.forEach((nb, idx) => {
        const li = document.createElement("li");
        li.className = "notebook-item";
        li.textContent = nb.item;
        notebookContainer.appendChild(li);
      });
    }
  }
  public ShowGameBoardScreen(notebookItems: NotebookItem[]): void {
    this.ShowScreen("game-board-screen");
    this.populateNotebook(notebookItems);
  }

  public ShowLobbyScreen(): void {
    this.ShowScreen("lobby-screen");
  }

  public SetDisplayMessage(msg: string) {
    this.displayTxt.textContent = msg;
  }

  public AddPlayer(id: string, text: string): string {
    // Add new player element to HTML with default text
    const newPlayer: HTMLParagraphElement = document.createElement("p");
    newPlayer.textContent = `Player ${id}: ${text}`;

    // Add this element to internal map for later lookup
    this.playerContainer.appendChild(newPlayer);
    this.playerElements.set(id, newPlayer);

    // Return key so caller can lookup players
    return id;
  }

  public HasPlayer(playerId: string): boolean {
    return this.playerElements.get(playerId) != undefined;
  }

  public SetPlayerText(playerId: string, text: string) {
    // Find player in map and update text
    const player: HTMLParagraphElement | undefined =
      this.playerElements.get(playerId);
    if (player) {
      player.textContent = `Player ${playerId}: ${text}`;
    }
  }

  public UpdateLobbyPlayers(players: LobbyPlayer[], myPlayerId: string): void { 
    const countEl = document.getElementById("lobby-player-count");          
    if (countEl) countEl.textContent = `(${players.length}/6)`;                

    //6 player slots in the right pane
    for (let i = 1; i <= 6; i++) {                                              
      const slot = document.getElementById(`slot-${i}`);                        
      if (!slot) continue;                                                      

      const player = players.find((p) => p.playerNumber === i);                 
      const labelEl = slot.querySelector(".slot-label") as HTMLElement;        
      const charEl = slot.querySelector(".slot-character") as HTMLElement;      
      const badgeEl = slot.querySelector(".slot-badge") as HTMLElement;      

      slot.classList.remove("occupied", "ready", "is-me", "is-host");        

      if (player) {                                                             
        slot.classList.add("occupied");                                        
        labelEl.textContent = `Player ${player.playerNumber}`;                 
        charEl.textContent = player.character ?? "No character selected";       

        if (player.playerId === myPlayerId) slot.classList.add("is-me");        
        if (player.isHost) {                                                    
          slot.classList.add("is-host");                                  
          badgeEl.textContent = "HOST";                                         
        } else {                                                                  
          badgeEl.textContent = "";                                           
        }                                                                        
        if (player.isReady) {                                                     
          slot.classList.add("ready");                                          
          if (!player.isHost) badgeEl.textContent = "READY";                     
        }                                                                         
      } else {                                                                    
        // adds an empty slot for new players
        labelEl.textContent = "Waiting...";                                     
        charEl.textContent = "";                                                  
        badgeEl.textContent = "";                                                 
      }                                                                           
    }                                                                             

    //update character card availability in the left pane
    const myPlayer = players.find((p) => p.playerId === myPlayerId);            
    const myCharacter = myPlayer?.character ?? null;                             

    document.querySelectorAll<HTMLElement>(".character-card").forEach((card) => { 
      const char = card.dataset.character as Character;                      
      const takenBy = players.find((p) => p.character === char);               
      const statusEl = card.querySelector(".character-status") as HTMLElement;   

      card.classList.remove("selected", "taken", "taken-by-me");                 

      if (takenBy) {                                                              
        if (takenBy.playerId === myPlayerId) {                                  
          card.classList.add("taken-by-me");                                    
          statusEl.textContent = "Selected (you)";                               
        } else {                                                               
          card.classList.add("taken");                                            
          statusEl.textContent = `Taken by Player ${takenBy.playerNumber}`;     
        }                                                                         
      } else {                                                                    
        statusEl.textContent = "Available";                                      
      }                                                                           
    });                                                                           

    //enable Ready Up only after this player selects a character
    const readyBtn = document.getElementById("btn-ready-up") as HTMLButtonElement | null; 
    if (readyBtn) {                                                               
      const hasCharacter = myCharacter !== null;                                
      readyBtn.disabled = !hasCharacter;                                         
      if (myPlayer?.isReady) {                                                
        readyBtn.textContent = "Unready";                                        
        readyBtn.classList.add("is-ready");                                    
      } else {                                                                   
        readyBtn.textContent = "Ready Up";                                       
        readyBtn.classList.remove("is-ready");                                 
      }                                                                        
    }                                                                            

    //Start game only available for the Host to see
    const startBtn = document.getElementById("btn-start-game") as HTMLButtonElement | null; 
    if (startBtn) {                                                               
      const isHost = myPlayer?.isHost ?? false;                          
      startBtn.style.display = isHost ? "block" : "none";                   
    }                                                                           
  }                                                                              

  public SetCharacterSelected(character: Character | null): void {               
    document.querySelectorAll<HTMLElement>(".character-card").forEach((card) => { 
      card.classList.remove("selected");                                          
      if (character && card.dataset.character === character) {                   
        card.classList.add("selected");                                           
      }                                                                           
    });                                                                         
  }                                                                              
}
