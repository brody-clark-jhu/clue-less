import { describe, it, expect, vi, afterEach } from "vitest";
import { PlayerController } from "../playerController";

describe("PlayerController.start", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls connectWebSocket, handles welcome and game_update events, and updates the view", async () => {
    const fakeClient: any = {
      connectWebSocket: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn((handler: any) => {
        fakeClient._handler = handler;
        return () => {};
      }),
    };

    const fakeView: any = {
      SetDisplayMessage: vi.fn(),
      AddPlayer: vi.fn(),
      HasPlayer: vi.fn().mockReturnValue(true),
      SetPlayerText: vi.fn(),
    };

    const pc = new PlayerController(fakeClient as any, fakeView as any);
    pc.start();

    // allow microtask queue to settle (connectWebSocket mock resolves)
    await new Promise((r) => setTimeout(r, 0));

    expect(fakeClient.connectWebSocket).toHaveBeenCalled();

    // Simulate server welcome event
    fakeClient._handler({
      type: "welcome",
      payload: { playerId: "player1" },
    });

    expect(pc.playerId).toBe("player1");
    expect(fakeView.SetDisplayMessage).toHaveBeenCalledWith(
      `Welcome player: player1.`,
    );

    // Simulate a game_update where the current player has clickCount 3
    fakeClient._handler({
      type: "game_update",
      payload: { playerStates: [{ playerId: "player1", clickCount: 3 }] },
    });

    expect(fakeView.SetDisplayMessage).toHaveBeenCalledWith(`You clicked x3.`);
  });
});