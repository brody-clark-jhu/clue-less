type RequestButtonCallback = () => void;
let requestButtonCallback: RequestButtonCallback | undefined;

export function onRequestButtonClick(cb: RequestButtonCallback) {
  requestButtonCallback = cb;
}

const button = document.getElementById("request")!;
button.onclick = () => {
  if (requestButtonCallback) {
    requestButtonCallback();
  }
};
