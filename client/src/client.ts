import type { ServerEvent, ClientCommand } from "./types";

export class Client {
  private socket: WebSocket | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 10;
  private readonly BASE_DELAY_MILLISECONDS = 500;

  private messageHandlers = new Set<(msg: ServerEvent) => void>();

  constructor() {}

  // WebSocket message callback for decoupled message handling
  public onMessage(handler: (msg: ServerEvent) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public sendMessage(command: ClientCommand){
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        console.error("Socket connection not open.");
      return;
    }
    try {
      // Fire and forget messages. Server updates are handled by onMessage callback.
      this.socket.send(JSON.stringify(command));
      return;
    } catch (err) {
      console.error("Failed to send message: ", err)
    }
  }

  public connectWebSocket() {
    console.info("Connecting to server...");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        this.socket = new WebSocket(wsUrl);
        console.info("Successfully connected.");
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        this.scheduleReconnect();
        return;
      }

      this.socket.onopen = () => {
        console.log("Connected to the game server.");
        this.retryCount = 0;
      };

      // Notify subscribers on message
      this.socket.onmessage = (event) => {
        try {
          const parsed: ServerEvent = JSON.parse(event.data);
          // notify all subscribers
          this.messageHandlers.forEach((h) => {
            try {
              h(parsed);
            } catch (e) {
              console.error("handler error", e);
            }
          });
          // resolves connectWebSocket promise if needed
        } catch (err) {
          console.error("Failed to parse server message:", err);
        }
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
