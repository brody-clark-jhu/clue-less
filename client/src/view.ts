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
  }

  public SetDisplayMessage(msg: string) {
    this.displayTxt.textContent = msg;
  }
}
