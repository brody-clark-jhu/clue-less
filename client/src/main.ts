import "./styles/board.css";
import "./styles/style.css";
import "./styles/shared.css";
import "./styles/lobby.css";
import "./styles/winner.css";
import { Client } from "./client";
import { PlayerController } from "./playerController";
import { View } from "./view";

const client = new Client();
const view = new View();
const player = new PlayerController(client, view);
(async () => {
  player.start();
})();