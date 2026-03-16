let requestCount = 0;   // count to make UI updates more dynamic
export function message(request, ws) {
    requestCount++;
  ws.send(
    JSON.stringify({
      type: "game_update",
      message: `Hello from server x${requestCount}`,
      from_player: "123"
    }),
  );
}