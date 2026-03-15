import "./style.css";
import { Client } from "./client";
import { PlayerController } from "./playerController";
import { View } from "./view";

let client = new Client();
client.connectWebSocket();

let view = new View();
let player = new PlayerController(client, view);
player.start();
