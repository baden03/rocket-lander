// main.js - Entry point for Rocket Lander (Version 0.0.2)
// version 0.0.1

import { resizeCanvas } from "./utils.js";
import { Game } from "./game.js";

// Attach global SCREEN_WIDTH and SCREEN_HEIGHT variables to the window.
window.SCREEN_WIDTH = 0;
window.SCREEN_HEIGHT = 0;

const canvas = document.getElementById("gameCanvas");
resizeCanvas(canvas);
window.addEventListener("resize", () => {
  resizeCanvas(canvas);
});

// Create the game instance, passing the canvas.
const game = new Game(canvas);
game.run();

// Attach game to window for debugging and for UI access (e.g., drawTargetArrow)
window.game = game;