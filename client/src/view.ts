import { type NotebookItem } from "./models/game.model";
import {
  type Location,
  Rooms,
  Corridors,
  SecretPassages,
  type Room,
  type Corridor,
  type Character,
  Characters,
  type Card,
} from "./types";
import imageMapResize from "image-map-resizer";


type BoardClickCallback = (location: Location) => void;
let boardClickCallback: BoardClickCallback | undefined;

type JoinLobbyCallback = () => void;
let joinLobbyCallback: JoinLobbyCallback | undefined;

type StartButtonClickedCallback = () => void;
let startButtonClickedCallback: StartButtonClickedCallback | undefined;

type MoveButtonClickCallback = () => void;
let moveButtonClickCallback: MoveButtonClickCallback | undefined;

type SuggestionButtonClickCallback = () => void;
let suggestionButtonClickCallback: SuggestionButtonClickCallback | undefined;

type AccuseButtonClickCallback = () => void;
let accuseButtonClickCallback: AccuseButtonClickCallback | undefined;

// type EndTurnButtonClickCallback = () => void;
// let endTurnButtonClickCallback: EndTurnButtonClickCallback | undefined;

type CardSelectionCallback = (card: Card) => void;
let cardSelectionCallback: CardSelectionCallback | undefined;

type CharacterSelectionCallback = (character: Character) => void;
let characterSelectionCallback: CharacterSelectionCallback | undefined;

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
// export function onEndTurnButtonClick(cb: EndTurnButtonClickCallback) {
//   endTurnButtonClickCallback = cb;
// }

export function onJoinLobbyClick(cb: JoinLobbyCallback) {
  joinLobbyCallback = cb;
}

export function onCardSelection(cb: CardSelectionCallback) {
  cardSelectionCallback = cb;
}

export function onCharacterSelection(cb: CharacterSelectionCallback) {
  characterSelectionCallback = cb;
}

export function onStartButtonClicked(cb: StartButtonClickedCallback) {
  startButtonClickedCallback = cb;
}

const SELECTION_ID_TO_CHARACTER: Record<string, Character> = {
  "colonel-mustard": "Col. Mustard",
  "ms-scarlet": "Miss Scarlet",
  "prof-plum": "Professor Plum",
  "mr-green": "Mr. Green",
  "mrs-white": "Mrs. White",
  "mrs-peacock": "Mrs. Peacock",
};
const CHARACTER_TO_PORTRAIT: Record<Character, string> = {
  "Col. Mustard": "portrait-col-mustard",
  "Miss Scarlet": "portrait-miss-scarlet",
  "Mr. Green": "portrait-mr-green",
  "Mrs. Peacock": "portrait-mrs-peacock",
  "Mrs. White": "portrait-mrs-white",
  "Professor Plum": "portrait-prof-plum",
};

const ID_TO_LOCATION: Record<string, Location> = {
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
  "Study-Kitchen": SecretPassages.StudyKitchen,
  "Kitchen-Study": SecretPassages.KitchenStudy,
  "Lounge-Conservatory": SecretPassages.LoungeConservatory,
  "Conservatory-Lounge": SecretPassages.ConservatoryLounge,
};

const LOCATION_TO_ID: Record<Location, string> = {
  [Rooms.Library]: "library",
  [Rooms.Study]: "study",
  [Rooms.Hall]: "hall",
  [Rooms.Lounge]: "lounge",
  [Rooms.DiningRoom]: "dining-room",
  [Rooms.Kitchen]: "kitchen",
  [Rooms.Ballroom]: "ballroom",
  [Rooms.Conservatory]: "conservatory",
  [Rooms.BilliardRoom]: "billiard-room",

  [Corridors.StudyHall]: "study-hall",
  [Corridors.HallLounge]: "hall-lounge",
  [Corridors.StudyLibrary]: "study-library",
  [Corridors.LibraryBilliardRoom]: "library-billiard-room",
  [Corridors.HallBilliardRoom]: "hall-billiard-room",
  [Corridors.BilliardDiningRoom]: "billiard-room-dining-room",
  [Corridors.LibraryConservatory]: "library-conservatory",
  [Corridors.BilliardBallRoom]: "billiard-room-ballroom",
  [Corridors.DiningRoomKitchen]: "dining-room-kitchen",
  [Corridors.ConservatoryBallroom]: "conservatory-ballroom",
  [Corridors.BallroomKitchen]: "ballroom-kitchen",
  [Corridors.LoungeDiningRoom]: "lounge-dining-room",

  [SecretPassages.StudyKitchen]: "Study-Kitchen",
  [SecretPassages.KitchenStudy]: "Kitchen-Study",
  [SecretPassages.LoungeConservatory]: "Lounge-Conservatory",
  [SecretPassages.ConservatoryLounge]: "Conservatory-Lounge",
};

export const LOCATION_POSITIONS: Record<Room | Corridor, { x: number; y: number }> = {
  "Library": { x: 221.5, y: 542.0 },
  "Study": { x: 226.0, y: 180.5 },
  "Hall": { x: 954.0, y: 163.0 },
  "Lounge": { x: 1684.0, y: 160.5 },
  "Dining Room": { x: 1699.5, y: 546.5 },
  "Kitchen": { x: 1702.5, y: 929.0 },
  "Ballroom": { x: 972.0, y: 928.0 },
  "Conservatory": { x: 214.0, y: 918.5 },
  "Billiard Room": { x: 963.5, y: 553.5 },
  "Study-Hall": { x: 589.5, y: 161.0 },
  "Hall-Lounge": { x: 1316.5, y: 160.5 },
  "Library-Billiard Room": { x: 594.0, y: 555.5 },
  "Study-Library": { x: 229.5, y: 360.0 },
  "Library-Conservatory": { x: 224.5, y: 722.0 },
  "Conservatory-Ballroom": { x: 595.5, y: 935.0 },
  "Ballroom-Kitchen": { x: 1341.0, y: 936.5 },
  "Dining Room-Kitchen": { x: 1701.5, y: 736.5 },
  "Billiard Room-Dining Room": { x: 1330.5, y: 553.5 },
  "Hall-Billiard Room": { x: 968.5, y: 352.5 },
  "Billiard Room-Ballroom": { x: 968.0, y: 736.5 },
  "Lounge-Dining Room": { x: 1702.0, y: 352.5 },
};

export class View {
  displayTxt: HTMLElement;
  button: HTMLElement;
  playerContainer: HTMLElement;
  playerElements: Map<string, HTMLParagraphElement>;
  popupTimeout: number | null = null;
  characterLocations: Record<string, string> = {};
  windowWidth: number = 1920;
  windowHeight: number = 1080;

  suggestionButtonHandler = (even: Event) => {
    if (suggestionButtonClickCallback) {
      suggestionButtonClickCallback();
    }
  }
  accuseButtonHandler = (even: Event) => {
    if (accuseButtonClickCallback) {
      accuseButtonClickCallback();
    }
  }
  moveButtonHandler = (even: Event) => {
    if (moveButtonClickCallback) {
      moveButtonClickCallback();
    }
  }
  gameBoardClickHandler = (event: MouseEvent) => {
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
  }

  constructor() {
    this.displayTxt = document.getElementById("display-message")!;
    this.button = document.getElementById("request")!;
    this.playerContainer = document.getElementById("players")!;
    this.playerElements = new Map<string, HTMLParagraphElement>();

    window.addEventListener("resize", () => {
      imageMapResize();
      this.updateAllPiecePositions();
    });

    const boardImage = document.querySelector("#board-container img");

    boardImage?.addEventListener("load", () => {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      console.log(`Dimensions ${this.windowWidth} x ${this.windowHeight}`);
    });

    // const endTurnButton = document.getElementById(
    //   "end-turn",
    // ) as HTMLButtonElement;
    // if (endTurnButton) {
    //   endTurnButton.addEventListener("click", () => {
    //     if (endTurnButtonClickCallback) {
    //       endTurnButtonClickCallback();
    //     }
    //   });
    // }

    //Changes the front page to the lobby page
    const joinLobbyBtn = document.getElementById("btn-join-lobby");
    if (joinLobbyBtn) {
      joinLobbyBtn.addEventListener("click", () => {
        if (joinLobbyCallback) {
          joinLobbyCallback();
        }
      });
    }

    const characterSelections =
      document.getElementsByClassName("character-select");
    if (characterSelections) {
      for (const ch of characterSelections) {
        ch.addEventListener("click", () => {
          if (characterSelectionCallback) {
            if (!(ch.id in SELECTION_ID_TO_CHARACTER)) {
              console.error(`Invalid character id: ${ch.id}`);
              return;
            }

            const id = SELECTION_ID_TO_CHARACTER[ch.id];
            characterSelectionCallback(id);
          }
        });
      }
    }


    const startBtn = document.getElementById("start")!;
    startBtn.addEventListener("click", () => {
      if (startButtonClickedCallback) {
        startButtonClickedCallback();
      }
    });
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

  private handleCardSelection(button: HTMLButtonElement): void {
    const card = button.textContent;
    if (cardSelectionCallback) {
      cardSelectionCallback(card as Card);
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

  public SetStartButtonVisibility(isVisible: boolean): void {
    const btn = document.getElementById("start")!;
    console.log(btn);
    if (isVisible) {
      btn.classList.remove("hidden");
    }
    else {
      btn.classList.add("hidden");
    }
  }

  public ShowGameBoardScreen(notebookItems: NotebookItem[]): void {
    this.ShowScreen("game-board-screen");
    this.populateNotebook(notebookItems);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        imageMapResize();
      });
    });
  }

  public DisableCardSelection(): void {
    const cardSelection = document.getElementById("card-selection")!;
    const cardSelectionContainer = document.getElementById(
      "card-selection-container",
    )!;

    cardSelectionContainer.replaceChildren();
    cardSelection.classList.add("hidden");
  }

  public EnableCardSelection(cards: Card[], title: string): void {
    const cardSelection = document.getElementById("card-selection")!;
    const cardSelectionContainer = document.getElementById(
      "card-selection-container",
    )!;

    cardSelectionContainer.replaceChildren();

    // Update title
    const msg: HTMLElement = document.getElementById("card-selection-title")!;
    msg.textContent = title;

    // Add cards to container
    for (const card of cards) {
      let btn: HTMLButtonElement = document.createElement("button");
      btn.textContent = card;
      btn.classList.add("card-button");

      btn.addEventListener("click", (e: MouseEvent) => {
        this.handleCardSelection(btn);
      });

      cardSelectionContainer.appendChild(btn);
    }

    // Lastly display card selection
    cardSelection.classList.remove("hidden");
  }

  public SetPlayerHand(cards: Card[]) {
    const playerHandList = document.getElementById("player-hand-list")!;
    playerHandList.replaceChildren();
    for (const card of cards) {
      let c = document.createElement("li");
      c.innerText = card;
      playerHandList.appendChild(c);
    }
  }

  public SetPlayerProfile(playerId: string, character: Character) {
    const playerIdElement = document.getElementById("player-id")!;
    const playerName = document.getElementById("player-name")!;

    playerIdElement.innerText = `Player ${playerId}`
    playerName.innerText = character;
  }

  public ShowLandingScreen(): void {
    this.ShowScreen("landing-screen");
  }
  public ShowLobbyScreen(): void {
    this.ShowScreen("lobby-screen");
  }

  private updateAllPiecePositions() {
    Object.entries(this.characterLocations).forEach(([character, location]) => {
      this.SetCharacterLocation(character as Character, location as Location);
    });
  }

  public SetCharacterLocation(character: Character, location: Location) {
    const board = document.getElementById("board-image") as HTMLImageElement;
    const piece = document.getElementById(
      CHARACTER_TO_PORTRAIT[character]
    ) as HTMLImageElement;

    if (!board || !piece) return;

    piece.classList.remove("hidden");

    const pos = LOCATION_POSITIONS[location as Room | Corridor];

    const x = board.clientWidth * pos.x / this.windowWidth;
    const y = board.clientHeight * pos.y / this.windowHeight;

    piece.style.left = `${x}px`;
    piece.style.top = `${y}px`;

    this.characterLocations[character] = location;
  }

  public EnableActions(enabled: boolean) {
    if (enabled) {
      this.doEnableActions();
    }
    else {
      this.doDisableActions();
    }
  }

  private doDisableActions() {
    const gameMap = document.querySelector(
      'map[name="image-map"]',
    ) as HTMLMapElement;
    if (gameMap) {
      gameMap.removeEventListener("click", this.gameBoardClickHandler);
    }

    const moveButton = document.getElementById("move") as HTMLButtonElement;
    if (moveButton) {
      moveButton.removeEventListener("click", this.moveButtonHandler);
    }
    const accuseButton = document.getElementById(
      "accusation",
    ) as HTMLButtonElement;
    if (accuseButton) {
      accuseButton.removeEventListener("click", this.accuseButtonHandler);
    }

    const suggestionButton = document.getElementById(
      "suggestion",
    ) as HTMLButtonElement;
    if (suggestionButton) {
      suggestionButton.removeEventListener("click", this.suggestionButtonHandler);
    }
  }

  private doEnableActions() {
    const gameMap = document.querySelector(
      'map[name="image-map"]',
    ) as HTMLMapElement;
    if (gameMap) {
      gameMap.addEventListener("click", this.gameBoardClickHandler);
    }

    const moveButton = document.getElementById("move") as HTMLButtonElement;
    if (moveButton) {
      moveButton.addEventListener("click", this.moveButtonHandler);
    }
    const accuseButton = document.getElementById(
      "accusation",
    ) as HTMLButtonElement;
    if (accuseButton) {
      accuseButton.addEventListener("click", this.accuseButtonHandler);
    }

    const suggestionButton = document.getElementById(
      "suggestion",
    ) as HTMLButtonElement;
    if (suggestionButton) {
      suggestionButton.addEventListener("click", this.suggestionButtonHandler);
    }

  }
  public async SetPopupEventMessage(message: string, durationSeconds: number = 5): Promise<void> {
    const popup = document.getElementById("event-popup");
    const msg = document.getElementById("event-msg");

    if (!popup || !msg) return;

    msg.textContent = message;
    popup.classList.remove("hidden");

    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
    }

    await new Promise<void>((resolve) => {
      this.popupTimeout = setTimeout(() => {
        popup.classList.add("hidden");
        resolve(); // This "completes" the function call for the caller
      }, durationSeconds * 1000);
    });
  }

  public SetPlayerTurn(playerTurnMsg: string) {
    const playerTurnText = document.getElementById("player-turn-text")!;
    playerTurnText.textContent = playerTurnMsg;
  }
  public SetPlayerText(playerId: string, text: string) {
    // Find player in map and update text
    const player: HTMLParagraphElement | undefined =
      this.playerElements.get(playerId);
    if (player) {
      player.textContent = `Player ${playerId}: ${text}`;
    }
  }
}
