let requestCount = 0;   // count to make UI updates more dynamic
export function message(request, ws) {
    requestCount++;
  ws.send(
    JSON.stringify({
      type: "message_response",
      payload: { message: `Hello from server x${requestCount}` },
    }),
  );
}