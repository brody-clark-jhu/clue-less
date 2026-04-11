import "./styles/board.css";
import "./styles/style.css";
import { Client } from "./client";
import { PlayerController } from "./playerController";
import { View } from "./view";
import type { NotebookItem } from "./models/game.model";
import imageMapResize from "image-map-resizer";

const STORAGE_KEY = "clueless-notebook";

async function loadDefaults(): Promise<{ item: string }[]> {
  console.log("loading notebook data...");
  const url = `${location.origin}/data/notebook.json`;
  console.log(`fetching ${url}`);
  const res = await fetch(url);
  console.log(`fetch status: ${res.status}`);
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const body = await res.json();
  console.log("fetched notebook body:", body);
  return body.items ? body.items.map((it: string) => ({ item: it })) : body;
}
function loadSaved(): Record<string, boolean> {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}

function saveSaved(map: Record<string, boolean>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

(async () => {
  try {
    const defaults = await loadDefaults();
    const items: NotebookItem[] = defaults.map((d, i) => ({
      item: d.item,
    }));
    console.log(`loaded ${items.length} items from local storage.`);
  } catch (error) {
    console.error("Failed to load notebook data.");
  }
  const client = new Client();
  const view = new View();
  const player = new PlayerController(client, view);
  player.start();
})();
imageMapResize();
