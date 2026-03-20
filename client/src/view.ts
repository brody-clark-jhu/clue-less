type RequestButtonCallback = () => void;
let requestButtonCallback: RequestButtonCallback | undefined;

export function onRequestButtonClick(cb: RequestButtonCallback) {
  requestButtonCallback = cb;
}

export class View {
  displayTxt: HTMLElement;
  button: HTMLElement;

  constructor() {
    this.displayTxt = document.getElementById("display-message")!;
    this.button = document.getElementById("request")!;

    this.button.onclick = () => {
      if (requestButtonCallback) {
        requestButtonCallback();
      }
    };

    //Changes the front page to the lobby page
    const joinLobbyBtn = document.getElementById("btn-join-lobby");
    if (joinLobbyBtn) {
      joinLobbyBtn.addEventListener("click", () => {
        this.showScreen("lobby-screen");
      });
    }
  }

 //Switch screens using the ID
  public showScreen(screenId: string): void {
    document.querySelectorAll(".screen").forEach((s) => {
      s.classList.remove("active");
    });
    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add("active");
    }
  }

  public SetDisplayMessage(msg: string) {
    this.displayTxt.textContent = msg;
  }
}