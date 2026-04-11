import "./styles/board.css";
import "./styles/style.css";
import { Client } from "./client";
import { PlayerController } from "./playerController";
import { View } from "./view";
import imageMapResize from "image-map-resizer";


const client = new Client();
const view = new View();
const player = new PlayerController(client, view);
(async () => {
    player.start();
})();
imageMapResize();
