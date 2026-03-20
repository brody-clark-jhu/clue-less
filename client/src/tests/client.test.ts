import { describe, it, expect, afterEach, vi } from "vitest";
import { Client } from "../client";
import type { ServerEvent, ClientCommand, GameState } from "../types";

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
    await expect(
      c.sendMessage({ type: "message", payload: { message: "hi"} } as ClientCommand),
    ).rejects.toThrow("socket not open");
  });

  it("sendMessage sends and subscribers receive server events", async () => {
    class FakeWS {
      static OPEN = 1;
      readyState = FakeWS.OPEN;
      lastSent: string | null = null;
      onmessage: ((ev: any) => void) | null = null;
      send(data: string) {
        this.lastSent = data;
      }
      dispatchMessage(data: string) {
        const ev = { data };
        if (this.onmessage) this.onmessage(ev);
      }
    }

    (globalThis as any).WebSocket = FakeWS;

    const c = new Client();
    (c as any).socket = new FakeWS();

    // forward incoming socket messages to client's handlers
    (c as any).socket.onmessage = (ev: any) => {
    const parsed = JSON.parse(ev.data);
    (c as any).messageHandlers.forEach((h: any) => {
        try { h(parsed); } catch (e) { /* noop */ }
    });
    };

    const received = new Promise<ServerEvent>((resolve) => {
      c.onMessage((msg) => resolve(msg));
    });

    await c.sendMessage({
      type: "message",
      payload: { message: "hello" },
    } as ClientCommand);

    // simulate server reply
    (c as any).socket.dispatchMessage(
      JSON.stringify({
        type: "welcome",
        payload: { playerId: "123" },
      } as ServerEvent),
    );

    const res = await received;
    expect(res).toEqual({
      type: "welcome",
      payload: { playerId: "123" },
    });
  });

   it("connectWebSocket installs onmessage and subscribers receive server events", async () => {
    class MockWS {
      static OPEN = 1;
      onopen: ((ev?: any) => void) | null = null;
      onmessage: ((ev: any) => void) | null = null;
      url: string;
      constructor(url: string) {
        this.url = url;
        (MockWS as any).lastInstance = this;
        setTimeout(() => this.onopen && this.onopen());
      }
      send() {}
      close() {}
    }

    (globalThis as any).WebSocket = MockWS;

    const c = new Client();
    const msgPromise = new Promise<ServerEvent>((resolve) => {
      c.onMessage((m) => resolve(m));
    });

    // start connection (we don't need to await the promise)
    c.connectWebSocket();

    // wait a tick for constructor/onopen wiring
    await new Promise((r) => setTimeout(r, 0));

    const inst = (MockWS as any).lastInstance as MockWS;

    inst.onmessage &&
      inst.onmessage({
        data: JSON.stringify({
          type: "game_update",
          payload: { playerStates: [{ playerId: "p1", clickCount: 0 }] },
        }),
      });

    const ev = await msgPromise;
    expect(ev.type).toBe("game_update");
    if (ev.type == "game_update"){
        const gs: GameState = ev.payload;
        expect(gs!.playerStates[0].playerId).toBe("p1");
    } 
  });
});
