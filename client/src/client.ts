import type { ServerEvent, ClientCommand, Envelope } from "./types";

export class Client {
  private socket: WebSocket | null = null;
  private retryCount = 0;
  private readonly MAX_RETRIES = 10;
  private readonly BASE_DELAY_MILLISECONDS = 500;

  private messageHandlers = new Set<(msg: ServerEvent) => void>();

  constructor() {}

  public onMessage(handler: (msg: ServerEvent) => void): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  public sendMessage(message: ClientCommand): Promise<void> {
    console.log("Sending message");
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error("socket not open"));
    }

    return new Promise((resolve, reject) => {
      const listener = (event: MessageEvent) => {
        this.socket!.removeEventListener("message", listener);
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

  public connectWebSocket(): Promise<void> {
    console.info("Connecting to server...");
    return new Promise((resolve, reject) => {
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
    });
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
