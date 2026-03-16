import WebSocket, { WebSocketServer } from "ws";
import { handlers } from "./handlers/index.js";

const wss = new WebSocketServer({ port: 5000 });

// mock ws messages
wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    let request;
    try {
      console.log(data.toString());
      request = JSON.parse(data.toString());
    } catch {
      return ws.send(JSON.stringify({ type: "error", payload: { message: "invalid json" } }));
    }

    // Handle client's initial connection message
    if (!request.type) {
      console.log("Client connected.");
      ws.send(JSON.stringify({ type: "game_update", message: "connected to mock server", from_player: "123"}));
      return;
    }

    const handler = handlers[request.type];
    console.log(`handler: ${handler}`);
    if (!handler) {
      return ws.send(
        JSON.stringify({
          type: "error",
          payload: { message: `unknown request type: ${request.type}` },
        }),
      );
    }

    // Use modular handlers for responses
    handler(request, ws);
  });
});

console.log("mock ws server running on ws://localhost:5000");
