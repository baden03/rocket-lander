// ui.js - UI functions and variables for Rocket Lander (Version 0.0.2)
// version 0.0.2

import { SAFE_VERTICAL_SPEED, SAFE_HORIZONTAL_DRIFT, SAFE_TILT } from "./constants.js";
import { TOTAL_TERRAIN_LENGTH } from "./terrain.js";

export const buttonMargin = 20;
export const thrustButtonWidth = 100;
export const thrustButtonHeight = 100;
export const pitchButtonWidth = 60;
export const pitchButtonHeight = 60;
export const buttonGap = 10;

// UI button objects – these will be updated on resize
export const thrustLeftButton = { x: 0, y: 0, width: thrustButtonWidth, height: thrustButtonHeight };
export const thrustRightButton = { x: 0, y: 0, width: thrustButtonWidth, height: thrustButtonHeight };
export const pitchLeftButton = { x: 0, y: 0, width: pitchButtonWidth, height: pitchButtonHeight };
export const pitchRightButton = { x: 0, y: 0, width: pitchButtonWidth, height: pitchButtonHeight };
export const restartButton = { x: 0, y: 0, width: 100, height: 40 };

export function updateUIButtons() {
  const SCREEN_WIDTH = window.SCREEN_WIDTH;
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  
  // Position thrust buttons at bottom left/right
  thrustLeftButton.x = buttonMargin;
  thrustLeftButton.y = SCREEN_HEIGHT - thrustButtonHeight - buttonMargin;

  thrustRightButton.x = SCREEN_WIDTH - thrustButtonWidth - buttonMargin;
  thrustRightButton.y = SCREEN_HEIGHT - thrustButtonHeight - buttonMargin;

  // Position pitch buttons above the corresponding thrust buttons
  pitchLeftButton.x = thrustLeftButton.x + (thrustButtonWidth - pitchButtonWidth) / 2;
  pitchLeftButton.y = thrustLeftButton.y - pitchButtonHeight - buttonGap;

  pitchRightButton.x = thrustRightButton.x + (thrustButtonWidth - pitchButtonWidth) / 2;
  pitchRightButton.y = thrustRightButton.y - pitchButtonHeight - buttonGap;

  // Center the restart button within the UI area (if game over)
  restartButton.x = SCREEN_WIDTH / 2 - restartButton.width / 2;
  restartButton.y = SCREEN_HEIGHT - 200;
}

// Expose updateUIButtons globally if needed.
window.updateUIButtons = updateUIButtons;

// Helper: Check if any active pointer is over the given button
function isPointerOver(button, game) {
  for (let id in game.activePointers) {
    const pos = game.activePointers[id];
    if (
      pos.x >= button.x &&
      pos.x <= button.x + button.width &&
      pos.y >= button.y &&
      pos.y <= button.y + button.height
    ) {
      return true;
    }
  }
  return false;
}

// Determine if specific button is active (pressed either by key or pointer)
function isThrustLeftActive(game) {
  return game.keys["ArrowLeft"] || game.keys["ShiftLeft"] || isPointerOver(thrustLeftButton, game);
}

function isThrustRightActive(game) {
  return game.keys["ArrowRight"] || game.keys["ShiftRight"] || isPointerOver(thrustRightButton, game);
}

function isPitchLeftActive(game) {
  return game.keys["KeyQ"] || isPointerOver(pitchLeftButton, game);
}

function isPitchRightActive(game) {
  return game.keys["KeyE"] || isPointerOver(pitchRightButton, game);
}

/**
 * drawDashboard draws the landing-mode dashboard (minimap).
 * The dashboard is a square minimap in the bottom UI area.
 * Within it, a circle (representing the planet) is drawn.
 * The circle rotates as the ship scrolls, and a yellow dot on its perimeter indicates the landing pad.
 * Telemetry info is drawn at the center of the circle.
 */
export function drawDashboard(ctx, game) {
  const SCREEN_WIDTH = window.SCREEN_WIDTH;
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  
  // Define the UI area (bottom 20% of the screen)
  const uiHeight = SCREEN_HEIGHT * 0.2;
  // The dashboard is a square taking up 80% of the UI height.
  const dashboardSize = uiHeight * 0.8;
  // Center the dashboard horizontally in the UI area.
  const dashboardX = (SCREEN_WIDTH - dashboardSize) / 2;
  // Vertically, center it within the UI area.
  const dashboardY = SCREEN_HEIGHT - uiHeight + (uiHeight - dashboardSize) / 2;

  ctx.save();
  // Draw the dashboard background and border.
  ctx.fillStyle = "#111";
  ctx.fillRect(dashboardX, dashboardY, dashboardSize, dashboardSize);
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.strokeRect(dashboardX, dashboardY, dashboardSize, dashboardSize);

  // Define the circle (planet) within the dashboard.
  const margin = 5; // Inner margin.
  const circleCenterX = dashboardX + dashboardSize / 2;
  const circleCenterY = dashboardY + dashboardSize / 2;
  const circleRadius = (dashboardSize / 2) - margin;

  // Draw the circle (planet) border.
  ctx.beginPath();
  ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = "#0f0";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Landing pad indicator.
  if (game.terrain.landingPad) {
    // Calculate landing pad center (global x).
    const padCenter = (game.terrain.landingPad.start + game.terrain.landingPad.end) / 2;
    const shipX = game.rocket.pos.x;

    // Compute horizontal difference, adjusted for wrapping.
    let dx = padCenter - shipX;
    const halfTerrain = TOTAL_TERRAIN_LENGTH / 2;
    if (dx > halfTerrain) {
      dx -= TOTAL_TERRAIN_LENGTH;
    } else if (dx < -halfTerrain) {
      dx += TOTAL_TERRAIN_LENGTH;
    }
    // Map dx to an angle in degrees.
    let relativeAngleDeg = (dx / TOTAL_TERRAIN_LENGTH) * 360;
    // Adjust so that when the ship is directly over the pad, the dot is at 12 o'clock.
    const dotAngleDeg = relativeAngleDeg - 90;
    const dotAngleRad = dotAngleDeg * (Math.PI / 180);

    // Compute the dot's position on the circle perimeter.
    const dotX = circleCenterX + circleRadius * Math.cos(dotAngleRad);
    const dotY = circleCenterY + circleRadius * Math.sin(dotAngleRad);

    // Draw the landing pad dot.
    ctx.beginPath();
    ctx.arc(dotX, dotY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = "#FFDD00";
    ctx.fill();
  }

  // Draw telemetry info in the center of the circle.
  ctx.font = "12px Helvetica";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // Example telemetry: Vertical Speed, Horizontal Drift, Tilt Angle.
  /*
  const telemetryText = 
    `V:${game.rocket.vel.y.toFixed(1)} m/s\n` +
    `H:${game.rocket.vel.x.toFixed(1)} m/s\n` +
    `T:${game.rocket.angle.toFixed(0)}°`;
  const lines = telemetryText.split("\n");
  const lineHeight = 14;
  lines.forEach((line, i) => {
    ctx.fillText(line, circleCenterX, circleCenterY + (i - (lines.length - 1) / 2) * lineHeight);
  });
  */


  const vs = game.rocket.vel.y;
  const hs = game.rocket.vel.x;
  const tilt = game.rocket.angle;

  // Choose color based on tolerance.
  const vsColor = Math.abs(vs) <= SAFE_VERTICAL_SPEED ? "green" : "red";
  const hsColor = Math.abs(hs) <= SAFE_HORIZONTAL_DRIFT ? "green" : "red";
  const tiltColor = Math.abs(tilt) <= SAFE_TILT ? "green" : "red";

  // Define vertical spacing.
  const lineHeight = 14;
  ctx.fillStyle = vsColor;
  ctx.fillText(`V:${vs.toFixed(1)} m/s`, circleCenterX, circleCenterY - lineHeight);
  ctx.fillStyle = hsColor;
  ctx.fillText(`H:${hs.toFixed(1)} m/s`, circleCenterX, circleCenterY);
  ctx.fillStyle = tiltColor;
  ctx.fillText(`T:${tilt.toFixed(0)}°`, circleCenterX, circleCenterY + lineHeight);

  ctx.restore();
}

/**
 * drawUI draws the overall UI.
 * It updates button positions, then renders the UI background, buttons, restart button (if needed),
 * and the dashboard (minimap) with telemetry.
 */
export function drawUI(ctx, game) {
  // Update button positions to current screen dimensions.
  updateUIButtons();

  const SCREEN_WIDTH = window.SCREEN_WIDTH;
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  const uiHeight = SCREEN_HEIGHT * 0.2; // Bottom 20% for UI

  ctx.save();
  // Draw the UI background for the bottom area.
  ctx.fillStyle = "#222";
  ctx.fillRect(0, SCREEN_HEIGHT - uiHeight, SCREEN_WIDTH, uiHeight);
  ctx.strokeStyle = "#777";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, SCREEN_HEIGHT - uiHeight, SCREEN_WIDTH, uiHeight);
  ctx.restore();

  // Draw thrust and pitch buttons.
  ctx.save();
  ctx.fillStyle = isThrustLeftActive(game) ? "#FFA200" : "#777";
  ctx.fillRect(thrustLeftButton.x, thrustLeftButton.y, thrustLeftButton.width, thrustLeftButton.height);

  ctx.fillStyle = isThrustRightActive(game) ? "#FFA200" : "#777";
  ctx.fillRect(thrustRightButton.x, thrustRightButton.y, thrustRightButton.width, thrustRightButton.height);

  ctx.fillStyle = isPitchLeftActive(game) ? "#FFA200" : "#777";
  ctx.fillRect(pitchLeftButton.x, pitchLeftButton.y, pitchLeftButton.width, pitchLeftButton.height);

  ctx.fillStyle = isPitchRightActive(game) ? "#FFA200" : "#777";
  ctx.fillRect(pitchRightButton.x, pitchRightButton.y, pitchRightButton.width, pitchRightButton.height);
  ctx.restore();

  // Draw restart button if game over.
  if (game.rocket.landed || game.rocket.crashed) {
    ctx.save();
    ctx.fillStyle = "gray";
    ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.strokeStyle = "white";
    ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Restart", restartButton.x + 17, restartButton.y + 28);
    ctx.restore();
  }

  // Draw the dashboard (minimap with telemetry) in landing mode.
  drawDashboard(ctx, game);
}

// Returns the base surface y-coordinate (used by collision checks and terrain calculations)
export function getBaseSurfaceY() {
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  return SCREEN_HEIGHT * 0.7;
}