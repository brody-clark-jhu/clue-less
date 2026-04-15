import { describe, it, expect, vi, afterEach } from "vitest";
import { PlayerController, PLAYER_STATES } from "../playerController";
import { View } from "../view";
import * as dataLoader from "../dataLoader";


// Mock dependencies
const mockClient = () => ({
  onMessage: vi.fn(),
  sendMessage: vi.fn(),
  connectWebSocket: vi.fn(),
});

const mockView = () => ({
  ShowLandingScreen: vi.fn(),
  ShowLobbyScreen: vi.fn(),
  ShowGameBoardScreen: vi.fn(),
  SetPlayerHand: vi.fn(),
  SetPlayerProfile: vi.fn(),
  SetPlayerTurn: vi.fn(),
  SetPopupEventMessage: vi.fn().mockResolvedValue(undefined),
  EnableActions: vi.fn(),
  EnableCardSelection: vi.fn().mockResolvedValue(undefined),
  DisableCardSelection: vi.fn(),
  SetCharacterLocation: vi.fn(),
});

describe("PlayerController - initialization", () => {
  it("registers socket handler on start", async () => {
    const client = mockClient();
    const view = mockView();

    const controller = new PlayerController(client as any, view as any);

    await controller.start();

    expect(client.onMessage).toHaveBeenCalled();
  });

  it("sets playerId on welcome event", async () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    controller.onServerEvent({
      type: "welcome",
      payload: { playerId: "p1" },
    } as any);

    // allow queue to process
    await Promise.resolve();

    expect((controller as any).playerId).toBe("p1");
  });

  it("handles deal_cards event", async () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    // set required state
    (controller as any).playerState = { character: "Miss Scarlet" };

    controller.onServerEvent({
      type: "deal_cards",
      payload: { cards: ["Knife"] },
    } as any);

    await Promise.resolve();

    expect(view.ShowGameBoardScreen).toHaveBeenCalled();
    expect(view.SetPlayerHand).toHaveBeenCalledWith(["Knife"]);
    expect(view.SetPlayerProfile).toHaveBeenCalled();
  });

  it("sets Active phase when it's player's turn", async () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    (controller as any).playerId = "p1";

    controller.onServerEvent({
      type: "game_update",
      payload: {
        phase: "active",
        current_turn_index: 0,
        turn_order: ["p1"],
        playerStates: [
          {
            playerId: "p1",
            character: "Miss Scarlet",
            location: "Kitchen",
            must_suggest: false,
            eliminated: false,
          },
        ],
      },
    } as any);

    await Promise.resolve();

    expect(view.EnableActions).toHaveBeenCalledWith(true);
  });

  it("sends suggestion after selecting suspect and weapon", async () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    // force into suggestion mode
    (controller as any).selectionContext = "suggestion";
    (controller as any).selectionStep = "suspect";

    // pick suspect
    (controller as any).handleCardSelection("Miss Scarlet");
    (controller as any).playerState = {
      must_suggest: false,
    };
    expect(view.EnableCardSelection).toHaveBeenCalled(); // weapon step

    // pick weapon
    (controller as any).handleCardSelection("Knife");

    expect(client.sendMessage).toHaveBeenCalledWith({
      type: "suggest",
      payload: {
        suspect: "Miss Scarlet",
        weapon: "Knife",
      },
    });
  });

  it("sends accusation after full selection", async () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    (controller as any).selectionContext = "accusation";
    (controller as any).selectionStep = "suspect";
    (controller as any).playerState = {
      must_suggest: false,
    };
    (controller as any).handleCardSelection("Miss Scarlet");
    (controller as any).handleCardSelection("Knife");
    (controller as any).handleCardSelection("Kitchen");

    expect(client.sendMessage).toHaveBeenCalledWith({
      type: "accuse",
      payload: {
        suspect: "Miss Scarlet",
        weapon: "Knife",
        room: "Kitchen",
      },
    });
  });

  it("enters Disprove phase when player can disprove", async () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    (controller as any).hand = ["Knife"];

    await (controller as any).handleDisproveRequest({
      suspect: "Miss Scarlet",
      weapon: "Knife",
      room: "Kitchen",
    });

    expect(view.EnableCardSelection).toHaveBeenCalled();
  });

  it("sends cannot_disprove if no valid cards", async () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    (controller as any).hand = ["Rope"];

    await (controller as any).handleDisproveRequest({
      suspect: "Miss Scarlet",
      weapon: "Knife",
      room: "Kitchen",
    });

    expect(client.sendMessage).toHaveBeenCalledWith({
      type: "cannot_disprove",
      payload: {},
    });
  });
  it("disables card selection when leaving selecting/disprove", () => {
    const client = mockClient();
    const view = mockView();
    const controller = new PlayerController(client as any, view as any);

    (controller as any).setPhase(PLAYER_STATES.Disprove);
    (controller as any).setPhase(PLAYER_STATES.Idle);

    expect(view.DisableCardSelection).toHaveBeenCalled();
  });



});
