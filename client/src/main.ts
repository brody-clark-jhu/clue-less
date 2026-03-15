import "./style.css";
import { Client } from "./client";
import { PlayerController } from "./playerController";

let client = new Client();
let player = new PlayerController(client);
