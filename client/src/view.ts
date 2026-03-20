type RequestButtonCallback = () => void;
let requestButtonCallback: RequestButtonCallback | undefined;

export function onRequestButtonClick(cb: RequestButtonCallback) {
  requestButtonCallback = cb;
}

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

    this.button.onclick = () => {
      if (requestButtonCallback) {
        requestButtonCallback();
      }
    };
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
}
