import { describe, it, expect, afterEach, vi } from "vitest";
import { Client } from "../client";
import type { GameRequest, GameUpdate } from "../types";

describe("Client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // cleanup any stubbed global
    try {
      delete (globalThis as any).WebSocket;
    } catch {}
  });

  it("sendMessage rejects when socket is not open", async () => {
    const c = new Client();
    await expect(c.sendMessage({ type: "message", message: "hi" } as GameRequest)).rejects.toThrow(
      "socket not open",
    );
  });

  it("sendMessage resolves with parsed GameUpdate when socket is open and responds", async () => {
    class FakeWS {
      static OPEN = 1;
      readyState = FakeWS.OPEN;
      listeners: Record<string, Function[]> = {};
      lastSent: string | null = null;
      addEventListener(type: string, cb: Function) {
        (this.listeners[type] ||= []).push(cb);
      }
      removeEventListener(type: string, cb: Function) {
        this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== cb);
      }
      send(data: string) {
        this.lastSent = data;
      }
      dispatchMessage(data: string) {
        const ev = { data };
        (this.listeners["message"] || []).slice().forEach((f) => f(ev));
      }
    }

    (globalThis as any).WebSocket = FakeWS;

    const c = new Client();
    (c as any).socket = new FakeWS();

    const p = c.sendMessage({ type: "message", message: "hello" } as GameRequest);

    // simulate server reply
    (c as any).socket.dispatchMessage(
      JSON.stringify({ type: "game_update", message: "ok", from_player: "p1" } as GameUpdate),
    );

    const res = await p;
    expect(res).toEqual({ type: "game_update", message: "ok", from_player: "p1" });
  });

  it("connectWebSocket returns null if WebSocket constructor throws", async () => {

    (globalThis as any).WebSocket = function () {
      throw new Error("fail create");
    };
    const c = new Client();
    const res = await c.connectWebSocket();
    expect(res).toBeNull();
  });

  it("connectWebSocket resolves with GameUpdate when server sends a game_update", async () => {
    // Mock WebSocket that exposes instance to the test
    class MockWS {
      static OPEN = 1;
      onopen: ((ev?: any) => void) | null = null;
      onmessage: ((ev: any) => void) | null = null;
      onerror: ((ev?: any) => void) | null = null;
      onclose: ((ev?: any) => void) | null = null;
      url: string;
      constructor(url: string) {
        this.url = url;
        // allow tests to access the created instance
        (MockWS as any).lastInstance = this;

        setTimeout(() => this.onopen && this.onopen());
      }
      send() {}
      close() {}
    }

    // stub global WebSocket
    (globalThis as any).WebSocket = MockWS;

    const c = new Client();
    const p = c.connectWebSocket();

    // wait a tick for constructor/onopen
    await new Promise((r) => setTimeout(r, 0));

    const inst = (MockWS as any).lastInstance as MockWS;
    // simulate server message
    inst.onmessage &&
      inst.onmessage({
        data: JSON.stringify({ type: "game_update", message: "joined", from_player: "playerA" }),
      });

    const res = await p;
    expect(res).toEqual({ type: "game_update", message: "joined", from_player: "playerA" });
  });
});