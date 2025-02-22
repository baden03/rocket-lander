// ui.js - UI functions and variables for Rocket Lander (Version 0.0.2)

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

// Draw the UI area and landing info (minimap dashboard for landing mode)
export function drawUI(ctx, game) {
    const SCREEN_WIDTH = window.SCREEN_WIDTH;
    const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
    const uiHeight = SCREEN_HEIGHT * 0.2;
  
    // Draw UI background
    ctx.save();
    ctx.fillStyle = "#222";
    ctx.fillRect(0, SCREEN_HEIGHT - uiHeight, SCREEN_WIDTH, uiHeight);
    // Debug: draw border around UI area
    ctx.strokeStyle = "#777";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, SCREEN_HEIGHT - uiHeight, SCREEN_WIDTH, uiHeight);
    ctx.restore();
  
    // For debugging: draw the thruster/pitch buttons with a fixed yellow background.
    ctx.save();
    ctx.fillStyle = "#777";
    ctx.fillRect(thrustLeftButton.x, thrustLeftButton.y, thrustLeftButton.width, thrustLeftButton.height);
    ctx.fillRect(thrustRightButton.x, thrustRightButton.y, thrustRightButton.width, thrustRightButton.height);
    ctx.fillRect(pitchLeftButton.x, pitchLeftButton.y, pitchLeftButton.width, pitchLeftButton.height);
    ctx.fillRect(pitchRightButton.x, pitchRightButton.y, pitchRightButton.width, pitchRightButton.height);
    ctx.restore();
  
    // Get landing info from game.rocket
    const verticalSpeed = game.rocket.vel.y;
    const horizontalDrift = game.rocket.vel.x;
    const tiltAngle = game.rocket.angle;
  
    // Define safe thresholds (could be imported constants)
    const safeVerticalSpeed = 50;
    const safeHorizontalDrift = 50;
    const safeTilt = 20;
  
    const vsColor = Math.abs(verticalSpeed) <= safeVerticalSpeed ? "green" : "red";
    const hdColor = Math.abs(horizontalDrift) <= safeHorizontalDrift ? "green" : "red";
    const tiltColor = Math.abs(tiltAngle) <= safeTilt ? "green" : "red";
  
    const startY = SCREEN_HEIGHT - uiHeight + 30;
    ctx.save();
    ctx.font = "18px Helvetica";
  
    ctx.fillStyle = vsColor;
    ctx.fillText(`Vertical Speed: ${verticalSpeed.toFixed(1)} m/s`, 20, startY);
  
    ctx.fillStyle = hdColor;
    ctx.fillText(`Horizontal Drift: ${horizontalDrift.toFixed(1)} m/s`, 20, startY + 25);
  
    ctx.fillStyle = tiltColor;
    ctx.fillText(`Tilt Angle: ${tiltAngle.toFixed(1)}°`, 20, startY + 50);
  
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
  // The ship's world position is game.rocket.pos, so offset the landing pad:
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

// Define getBaseSurfaceY here for consistency
export function getBaseSurfaceY() {
  const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
  return SCREEN_HEIGHT * 0.7;
}