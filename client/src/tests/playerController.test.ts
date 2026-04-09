import { describe, it, expect, vi, afterEach } from "vitest";
import { PlayerController } from "../playerController";
import { View } from "../view";

describe("PlayerController.start", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Handles welcome and game_update events, and updates the view", async () => {
    const fakeClient: any = {
      connectWebSocket: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn((handler: any) => {
        fakeClient._handler = handler;
        return () => { };
      }),
    };

    const fakeView: any = {
      SetDisplayMessage: vi.fn(),
      ShowScreen: vi.fn(),
      AddPlayer: vi.fn(),
      HasPlayer: vi.fn().mockReturnValue(true),
      SetPlayerText: vi.fn(),
    };

    const pc = new PlayerController(fakeClient as any, fakeView as any);
    pc.start();

    // allow microtask queue to settle (connectWebSocket mock resolves)
    await new Promise((r) => setTimeout(r, 0));

    // Simulate server welcome event
    fakeClient._handler({
      type: "welcome",
      payload: { playerId: "player1" },
    });

    expect(pc.playerId).toBe("player1");
    expect(fakeView.SetDisplayMessage).toHaveBeenCalledWith(
      `Welcome player: player1.`,
    );
    expect(fakeView.ShowScreen).toHaveBeenCalledWith("lobby-screen");
    // Simulate a game_update where the current player has clickCount 3
    fakeClient._handler({
      type: "game_update",
      payload: { playerStates: [{ playerId: "player1", clickCount: 3 }] },
    });

    expect(fakeView.SetDisplayMessage).toHaveBeenCalledWith(`You clicked x3`);
  });

  it("Connects websocket on join lobby button click", () => {
    const fakeClient: any = {
      connectWebSocket: vi.fn().mockResolvedValue(undefined),
      onMessage: vi.fn(),
    };

    // minimal DOM elements required by View
    document.body.innerHTML = `<div id="display-message"></div><button id="request"></button><button id="btn-join-lobby"></button><div id="players"></div>`;

    const view = new View();
    const pc = new PlayerController(fakeClient as any, view);

    // simulate user clicking the join-lobby button
    const btn = document.getElementById("btn-join-lobby")!;
    btn.click();

    expect(fakeClient.connectWebSocket).toHaveBeenCalled();
  });
})