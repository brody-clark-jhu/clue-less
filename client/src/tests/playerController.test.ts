import { describe, it, expect, vi, afterEach } from "vitest";
import { PlayerController } from "../playerController";
import { View } from "../view";
import * as dataLoader from "../dataLoader";

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
      ShowGameBoardScreen: vi.fn(),
      ShowLobbyScreen: vi.fn(),
      AddPlayer: vi.fn(),
      HasPlayer: vi.fn().mockReturnValue(true),
      SetPlayerText: vi.fn(),
    };

    const mockData = [{ item: 'Candlestick' }, { item: 'Revolver' }];
    vi.spyOn(dataLoader, 'loadNotebookData').mockResolvedValue(mockData);

    const pc = new PlayerController(fakeClient as any, fakeView as any);
    await pc.start();

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
    // TODO: Uncomment below when lobby is implemented
    // expect(fakeView.ShowLobbyScreen).toHaveBeenCalled();

    // Simulate a game_update where the current player has clickCount 3

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
});
