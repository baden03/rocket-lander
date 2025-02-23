// main.js - Entry point for Rocket Lander (Version 0.0.2)
// version 0.0.1

import { resizeCanvas } from "./utils.js";
import { Game } from "./game.js";

window.SCREEN_WIDTH = 0;
window.SCREEN_HEIGHT = 0;

const canvas = document.getElementById("gameCanvas");
resizeCanvas(canvas);
window.addEventListener("resize", () => {
  resizeCanvas(canvas);
});

const game = new Game(canvas);
game.run();

// Attach the game instance to window (for debugging and for use in UI functions)
window.game = game;