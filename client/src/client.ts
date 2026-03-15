import type { GameState, GameRequest, GameResponse } from "./types";

export class Client {
  private socket: WebSocket | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 10;
  private readonly BASE_DELAY_MILLISECONDS = 500;

  constructor() {}

  public sendMessage(message: GameRequest): Promise<GameResponse> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("socket not open"));
    }

    return new Promise((resolve, reject) => {
      const listener = (event: MessageEvent) => {
        this.socket!.removeEventListener("message", listener);
        try {
          const response: GameResponse = JSON.parse(event.data);
          resolve(response);
        } catch (error) {
          reject(new Error("Failed to parse response"));
        }
      };

      const onClose = () => {
        this.socket?.removeEventListener("message", listener);
        reject(new Error("socket closed before response"));
      };

      this.socket!.addEventListener("message", listener);
      this.socket!.addEventListener("close", onClose, { once: true });
      this.socket!.addEventListener("error", onClose, { once: true });

      this.socket!.send(JSON.stringify(message));
    });
  }

  public connectWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.socket = new WebSocket(wsUrl);
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.scheduleReconnect();
      return;
    }

    this.socket.onopen = () => {
      console.log("Connected to the game server.");
      this.retryCount = 0;
      this.socket!.send(JSON.stringify({ message: "Hello on open" }));
    };

    this.socket.onmessage = (event) => {
      console.log("Server says:", event.data);
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    this.socket.onclose = () => {
      console.warn("WebSocket connection closed");
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.retryCount >= this.MAX_RETRIES) {
      console.error("Max retries reached. Could not connect to server.");
      return;
    }

    const delay = this.BASE_DELAY_MILLISECONDS * Math.pow(2, this.retryCount);
    console.log(
      `Retrying connection in ${delay}ms (attempt ${this.retryCount + 1}/${this.MAX_RETRIES})`,
    );
    this.retryCount++;
    setTimeout(() => this.connectWebSocket(), delay);
  }
}
