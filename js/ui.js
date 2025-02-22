// ui.js - UI functions and variables for Rocket Lander (Version 0.0.2)
// version 0.0.1

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
  
  thrustLeftButton.x = buttonMargin;
  thrustLeftButton.y = SCREEN_HEIGHT - thrustButtonHeight - buttonMargin;

  thrustRightButton.x = SCREEN_WIDTH - thrustButtonWidth - buttonMargin;
  thrustRightButton.y = SCREEN_HEIGHT - thrustButtonHeight - buttonMargin;

  pitchLeftButton.x = thrustLeftButton.x + (thrustButtonWidth - pitchButtonWidth) / 2;
  pitchLeftButton.y = thrustLeftButton.y - pitchButtonHeight - buttonGap;

  pitchRightButton.x = thrustRightButton.x + (thrustButtonWidth - pitchButtonWidth) / 2;
  pitchRightButton.y = thrustRightButton.y - pitchButtonHeight - buttonGap;

  restartButton.x = SCREEN_WIDTH / 2 - 50;
  restartButton.y = SCREEN_HEIGHT - 200;
}

// Attach to window so that utils.js can find it
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
// For thrust left: keys "ArrowLeft" or "ShiftLeft"
// For thrust right: keys "ArrowRight" or "ShiftRight"
// For pitch left: key "KeyQ"
// For pitch right: key "KeyE"
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

// Draw the UI area and landing info (minimap dashboard for landing mode)
export function drawUI(ctx, game) {
  const SCREEN_WIDTH = window.SCREEN_WIDTH;
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  const uiHeight = SCREEN_HEIGHT * 0.2; // UI occupies the bottom 20% of the screen
  
  // Draw UI background area
  ctx.save();
  ctx.fillStyle = "#222";
  ctx.fillRect(0, SCREEN_HEIGHT - uiHeight, SCREEN_WIDTH, uiHeight);
  ctx.strokeStyle = "#777";
  ctx.lineWidth = 2;
  ctx.strokeRect(0, SCREEN_HEIGHT - uiHeight, SCREEN_WIDTH, uiHeight);
  ctx.restore();

  // Draw thruster and pitch buttons
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

  // Get telemetry values from the rocket
  const verticalSpeed = game.rocket.vel.y;
  const horizontalDrift = game.rocket.vel.x;
  const tiltAngle = game.rocket.angle;

  // Define safe thresholds
  const safeVerticalSpeed = 50;
  const safeHorizontalDrift = 50;
  const safeTilt = 20;

  // Determine colors based on safe thresholds
  const vsColor = Math.abs(verticalSpeed) <= safeVerticalSpeed ? "green" : "red";
  const hdColor = Math.abs(horizontalDrift) <= safeHorizontalDrift ? "green" : "red";
  const tiltColor = Math.abs(tiltAngle) <= safeTilt ? "green" : "red";

  // Center the telemetry text within the bottom UI area
  ctx.save();
  ctx.font = "18px Helvetica";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT - uiHeight / 2;
  const lineSpacing = 25; // spacing between lines

  ctx.fillStyle = vsColor;
  ctx.fillText(`Vertical Speed: ${verticalSpeed.toFixed(1)} m/s`, centerX, centerY - lineSpacing);
  
  ctx.fillStyle = hdColor;
  ctx.fillText(`Horizontal Drift: ${horizontalDrift.toFixed(1)} m/s`, centerX, centerY);
  
  ctx.fillStyle = tiltColor;
  ctx.fillText(`Tilt Angle: ${tiltAngle.toFixed(1)}°`, centerX, centerY + lineSpacing);
  ctx.restore();
}

// Draw a target arrow (for scroll mode) pointing toward the landing pad.
// The landingPad is an object with properties 'start' and 'end'; its center is computed.
export function drawTargetArrow(ctx, landingPad) {
  const SCREEN_WIDTH = window.SCREEN_WIDTH;
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  
  // Calculate landing pad center in world coordinates
  const padX = (landingPad.start + landingPad.end) / 2;
  const padY = getBaseSurfaceY();
  
  // In scroll mode, assume the ship is centered. The landing pad's screen position is:
  const cx = SCREEN_WIDTH / 2;
  const cy = SCREEN_HEIGHT / 2;
  // Calculate direction from the ship (center) to the landing pad's world position
  // The ship's world position is window.game.rocket.pos (attached in main.js)
  const dx = padX - window.game.rocket.pos.x;
  const dy = padY - window.game.rocket.pos.y;
  const angle = Math.atan2(dy, dx);
  
  const halfWidth = SCREEN_WIDTH / 2;
  const halfHeight = SCREEN_HEIGHT / 2;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const scaleX = halfWidth / Math.abs(cosA);
  const scaleY = halfHeight / Math.abs(sinA);
  const scale = Math.min(scaleX, scaleY);
  const arrowX = cx + cosA * scale * 0.9;
  const arrowY = cy + sinA * scale * 0.9;
  
  ctx.save();
  ctx.translate(arrowX, arrowY);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-20, -10);
  ctx.lineTo(-20, 10);
  ctx.closePath();
  ctx.fillStyle = 'red';
  ctx.fill();
  ctx.restore();
}

// Define getBaseSurfaceY for consistency
export function getBaseSurfaceY() {
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  return SCREEN_HEIGHT * 0.7;
}