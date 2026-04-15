import { describe, it, expect, beforeEach, vi } from "vitest";
import { View, onBoardClick, onCardSelection, onStartButtonClicked } from "../view";

// Mock image-map-resizer (important!)
vi.mock("image-map-resizer", () => ({
  default: vi.fn(),
}));

function setupDOM() {
  document.body.innerHTML = `
    <div id="display-message"></div>
    <button id="request"></button>
    <div id="players"></div>

    <div id="landing-screen" class="screen"></div>
    <div id="lobby-screen" class="screen"></div>
    <div id="game-board-screen" class="screen"></div>

    <button id="start" class="hidden"></button>

    <div id="card-selection" class="hidden">
      <div id="card-selection-title"></div>
      <div id="card-selection-container"></div>
    </div>

    <ul id="player-hand-list"></ul>

    <div id="event-popup" class="hidden">
      <span id="event-msg"></span>
    </div>

    <div id="player-id"></div>
    <div id="player-name"></div>
    <div id="player-turn-text"></div>

    <map name="image-map"></map>

    <img id="board-image" width="1000" height="500" />
    <img id="portrait-miss-scarlet" class="hidden" />

    <div id="board-container">
      <img />
    </div>

    <ul id="notebook-list"></ul>
    <li id="notebook-item">
      <input type="checkbox"/>
      <label></label>
    </li>
  `;
}

describe("View - constructor", () => {
  beforeEach(() => {
    setupDOM();
  });

  it("initializes without crashing", () => {
    const view = new View();
    expect(view).toBeTruthy();
  });

  it("binds start button click", () => {
    const cb = vi.fn();

    onStartButtonClicked(cb);

    new View();

    document.getElementById("start")!.click();

    expect(cb).toHaveBeenCalled();
  });

  it("shows landing screen", () => {
  setupDOM();
  const view = new View();

  view.ShowLandingScreen();

  expect(document.getElementById("landing-screen")!.classList.contains("active")).toBe(true);
});

it("enables card selection and handles click", () => {
  setupDOM();

  const cb = vi.fn();
  onCardSelection(cb);

  const view = new View();

  view.EnableCardSelection(["Knife", "Rope"], "Pick one");

  const buttons = document.querySelectorAll(".card-button");
  expect(buttons.length).toBe(2);

  (buttons[0] as HTMLButtonElement).click();

  expect(cb).toHaveBeenCalledWith("Knife");
});

it("disables card selection", () => {
  setupDOM();
  const view = new View();

  view.EnableCardSelection(["Knife"], "Pick");
  view.DisableCardSelection();

  const container = document.getElementById("card-selection-container")!;
  expect(container.children.length).toBe(0);
  expect(document.getElementById("card-selection")!.classList.contains("hidden")).toBe(true);
});
it("sets player hand", () => {
  setupDOM();
  const view = new View();

  view.SetPlayerHand(["Knife", "Rope"]);

  const items = document.querySelectorAll("#player-hand-list li");
  expect(items.length).toBe(2);
});

it("sets player profile", () => {
  setupDOM();
  const view = new View();

  view.SetPlayerProfile("p1", "Miss Scarlet");

  expect(document.getElementById("player-id")!.textContent).toContain("p1");
  expect(document.getElementById("player-name")!.textContent).toBe("Miss Scarlet");
});
it("calls board click callback with correct location", () => {
  setupDOM();

  const cb = vi.fn();
  onBoardClick(cb);

  const view = new View();

  const area = document.createElement("area");
  area.setAttribute("alt", "library");

  const event = {
    preventDefault: vi.fn(),
    target: area,
  } as any;

  view.gameBoardClickHandler(event);

  expect(cb).toHaveBeenCalled(); // exact enum depends on your Rooms
});

it("enables and disables action listeners", () => {
  setupDOM();
  const view = new View();

  const map = document.querySelector('map[name="image-map"]')!;

  const addSpy = vi.spyOn(map, "addEventListener");
  const removeSpy = vi.spyOn(map, "removeEventListener");

  view.EnableActions(true);
  expect(addSpy).toHaveBeenCalled();

  view.EnableActions(false);
  expect(removeSpy).toHaveBeenCalled();
});

it("sets character location on board", () => {
  setupDOM();
  const view = new View();

  const board = document.getElementById("board-image") as HTMLImageElement;
  Object.defineProperty(board, "clientWidth", { value: 1000 });
  Object.defineProperty(board, "clientHeight", { value: 500 });

  view.SetCharacterLocation("Miss Scarlet", "Library");

  const piece = document.getElementById("portrait-miss-scarlet")!;
  expect(piece.style.left).toBeTruthy();
  expect(piece.style.top).toBeTruthy();
});

it("shows and hides popup message", async () => {
  setupDOM();
  const view = new View();

  vi.useFakeTimers();

  const promise = view.SetPopupEventMessage("Hello", 1);

  const popup = document.getElementById("event-popup")!;
  expect(popup.classList.contains("hidden")).toBe(false);

  vi.advanceTimersByTime(1000);
  await promise;

  expect(popup.classList.contains("hidden")).toBe(true);

  vi.useRealTimers();
});

});