import { describe, it, expect, vi, afterEach } from "vitest";
import { PlayerController } from "../playerController";

describe("PlayerController.start", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls connectWebSocket, sets playerId and updates the view", async () => {
    const fakeUpdate = { type: "game_update", message: "welcome", from_player: "player1" };

    const fakeClient = {
      connectWebSocket: vi.fn().mockResolvedValue(fakeUpdate),
    };

    const fakeView = {
      SetDisplayMessage: vi.fn(),
    };

    const pc = new PlayerController(fakeClient as any, fakeView as any);
    pc.start();

    // wait for the promise in start() to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(fakeClient.connectWebSocket).toHaveBeenCalled();
    expect(pc.playerId).toBe("player1");
    expect(fakeView.SetDisplayMessage).toHaveBeenCalledWith(
      `Message received from server: ${fakeUpdate.message}`,
    );
  });
});