import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { onAccuseButtonClick, onBoardClick, onEndTurnButtonClick, onJoinLobbyClick, onMoveButtonClick, onSuggestionButtonClick, View, } from "../view";

describe("View", () => {
  let lobbyScreen: HTMLElement;
  let gameBoardScreen: HTMLElement;
  let buttonEl: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    lobbyScreen = document.createElement("div");
    lobbyScreen.id = "lobby-screen";
    lobbyScreen.classList.add("screen");
    gameBoardScreen = document.createElement("div");
    gameBoardScreen.id = "game-board-screen";
    gameBoardScreen.classList.add("screen");
    buttonEl = document.createElement("button");
    buttonEl.id = "move";
    document.body.appendChild(lobbyScreen);
    document.body.appendChild(buttonEl);
    document.body.appendChild(gameBoardScreen);

  });

  afterEach(() => {
    document.body.innerHTML = "";
    // Restore callbacks
    onAccuseButtonClick(() => { });
    onSuggestionButtonClick(() => { });
    onMoveButtonClick(() => { });
    onJoinLobbyClick(() => { });
    onEndTurnButtonClick(() => { });
    vi.restoreAllMocks();
    lobbyScreen.classList = '';
    gameBoardScreen.classList = '';
  });

  it("ShowLobbyScreen updates the display element", () => {
    const v = new View();
    v.ShowLobbyScreen();
    expect(lobbyScreen.classList).toContain("active");
    expect(gameBoardScreen.classList).not.toContain("active");
  });
  it("ShowGameBoardScreen updates the display element", () => {
    const v = new View();
    v.ShowGameBoardScreen([]);
    expect(gameBoardScreen.classList).toContain("active");
    expect(lobbyScreen.classList).not.toContain("active");
  });

  it("clicking move button invokes the registered callback", () => {
    const spy = vi.fn();
    onMoveButtonClick(spy);
    const v = new View();
    // simulate click
    buttonEl.click();
    expect(spy).toHaveBeenCalled();
  });

  it("clicking join lobby button invokes callback", () => {
    const btn = document.createElement("button");
    btn.id = "btn-join-lobby";
    document.body.appendChild(btn);

    const spy = vi.fn();
    onJoinLobbyClick(spy);

    const v = new View();
    btn.click();

    expect(spy).toHaveBeenCalled();
  });

  it("clicking accuse button invokes callback", () => {
    const btn = document.createElement("button");
    btn.id = "accusation";
    document.body.appendChild(btn);

    const spy = vi.fn();
    onAccuseButtonClick(spy);

    new View();
    btn.click();

    expect(spy).toHaveBeenCalled();
  });

  it("clicking suggestion button invokes callback", () => {
    const btn = document.createElement("button");
    btn.id = "suggestion";
    document.body.appendChild(btn);

    const spy = vi.fn();
    onSuggestionButtonClick(spy);

    new View();
    btn.click();

    expect(spy).toHaveBeenCalled();
  });

  it("clicking end turn button invokes callback", () => {
    const btn = document.createElement("button");
    btn.id = "end-turn";
    document.body.appendChild(btn);

    const spy = vi.fn();
    onEndTurnButtonClick(spy);

    new View();
    btn.click();

    expect(spy).toHaveBeenCalled();
  });

  it("ShowGameBoardScreen populates notebook from template", () => {
    const notebookList = document.createElement("ul");
    notebookList.id = "notebook-list";

    const template = document.createElement("li");
    template.id = "notebook-item";

    const input = document.createElement("input");
    input.type = "checkbox";

    const label = document.createElement("label");

    template.appendChild(input);
    template.appendChild(label);

    document.body.appendChild(notebookList);
    document.body.appendChild(template);

    const screen = document.createElement("div");
    screen.id = "game-board-screen";
    screen.classList.add("screen");
    document.body.appendChild(screen);

    const v = new View();

    v.ShowGameBoardScreen([
      { item: "Knife" },
      { item: "Candlestick" },
    ]);

    expect(notebookList.children.length).toBe(2);
    expect(notebookList.textContent).toContain("Knife");
    expect(notebookList.textContent).toContain("Candlestick");
  });

  it("clicking map area triggers board callback with correct location", () => {
    const map = document.createElement("map");
    map.setAttribute("name", "image-map");

    const area = document.createElement("area");
    area.setAttribute("alt", "library");

    map.appendChild(area);
    document.body.appendChild(map);

    const spy = vi.fn();
    onBoardClick(spy);

    new View();

    area.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(spy).toHaveBeenCalledWith("Library");
  });
});
