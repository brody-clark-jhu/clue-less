import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { View, onRequestButtonClick } from "../view";

describe("View", () => {
  let displayEl: HTMLElement;
  let buttonEl: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = "";
    displayEl = document.createElement("div");
    displayEl.id = "display-message";
    buttonEl = document.createElement("button");
    buttonEl.id = "request";
    document.body.appendChild(displayEl);
    document.body.appendChild(buttonEl);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    // Restore callbacks
    onRequestButtonClick(() => {});
    vi.restoreAllMocks();
  });

  it("SetDisplayMessage updates the display element text", () => {
    const v = new View();
    v.SetDisplayMessage("Hello world");
    expect(displayEl.textContent).toBe("Hello world");
  });

  it("clicking request button invokes the registered callback", () => {
    const spy = vi.fn();
    onRequestButtonClick(spy);
    const v = new View();
    // simulate click
    buttonEl.click();
    expect(spy).toHaveBeenCalled();
  });
});
