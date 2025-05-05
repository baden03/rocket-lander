// game.js - Core game logic for Rocket Lander (Version 0.0.2)
// version 0.0.3

import { drawUI, thrustLeftButton, thrustRightButton, pitchLeftButton, pitchRightButton, restartButton, getBaseSurfaceY } from "./ui.js";
import { Terrain, TOTAL_TERRAIN_LENGTH } from "./terrain.js";
import { Rocket } from "./ship.js";
import { SAFE_VERTICAL_SPEED, SAFE_HORIZONTAL_DRIFT, SAFE_TILT, KARMIN_LINE } from "./constants.js";

// Helper function to check if two line segments intersect
function linesIntersect(p1, p2, p3, p4) {
  const denominator = ((p4.y - p3.y) * (p2.x - p1.x)) - ((p4.x - p3.x) * (p2.y - p1.y));
  if (denominator === 0) return false;

  const ua = (((p4.x - p3.x) * (p1.y - p3.y)) - ((p4.y - p3.y) * (p1.x - p3.x))) / denominator;
  const ub = (((p2.x - p1.x) * (p1.y - p3.y)) - ((p2.y - p1.y) * (p1.x - p3.x))) / denominator;

  return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
}

// Helper function to check if a line segment intersects with a box
function lineIntersectsBox(p1, p2, box) {
  // Check if either point is inside the box
  if ((p1.x >= box.left && p1.x <= box.right && p1.y >= box.top && p1.y <= box.bottom) ||
      (p2.x >= box.left && p2.x <= box.right && p2.y >= box.top && p2.y <= box.bottom)) {
    return true;
  }

  // Check each edge of the box against the line segment
  const edges = [
    [{x: box.left, y: box.top}, {x: box.right, y: box.top}],      // Top
    [{x: box.right, y: box.top}, {x: box.right, y: box.bottom}],  // Right
    [{x: box.right, y: box.bottom}, {x: box.left, y: box.bottom}],// Bottom
    [{x: box.left, y: box.bottom}, {x: box.left, y: box.top}]     // Left
  ];

  for (const [e1, e2] of edges) {
    if (linesIntersect(p1, p2, e1, e2)) {
      return true;
    }
  }
  return false;
}

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = this.canvas.getContext("2d");
    this.reset();
    this.lastTime = 0;
    this.running = true;
    this.keys = {};
    this.activePointers = {};
    this.endMessageStartTime = null;
    // Camera horizontal offset for scrolling mode
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;

    this.cameraPannedUp = false;

    // Keyboard events
    window.addEventListener("keydown", (e) => {
      if (["ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) {
        e.preventDefault();
      }
      if ((e.code === "KeyR" || e.code === "Enter") && (this.rocket.landed || this.rocket.crashed)) {
        this.reset();
      }
      this.keys[e.code] = true;
    });
    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    // Multi-touch events on the canvas
    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this));
    this.canvas.addEventListener("pointermove", this.handlePointerMove.bind(this));
    this.canvas.addEventListener("pointerup", this.handlePointerUp.bind(this));
    this.canvas.addEventListener("pointercancel", this.handlePointerUp.bind(this));

    this.processMultiPointerInput();
  }

  reset() {
    // Create new instances of Rocket and Terrain.
    this.rocket = new Rocket(window.SCREEN_WIDTH / 2, 100);
    this.terrain = new Terrain();
    this.keys = {};
    this.running = true;
    this.lastTime = 0;
    this.activePointers = {};
    this.endMessageStartTime = null;
    this.cameraOffsetX = 0;
    this.cameraOffsetY = 0;
    this.absoluteCameraOffsetX = 0;
  }

  updatePointerPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  handlePointerDown(e) {
    e.preventDefault();
    this.activePointers[e.pointerId] = this.updatePointerPosition(e);
  }

  handlePointerMove(e) {
    if (this.activePointers[e.pointerId] !== undefined) {
      this.activePointers[e.pointerId] = this.updatePointerPosition(e);
    }
  }

  handlePointerUp(e) {
    e.preventDefault();
    delete this.activePointers[e.pointerId];
  }

  processMultiPointerInput() {
    for (let id in this.activePointers) {
      const pos = this.activePointers[id];
      const x = pos.x;
      const y = pos.y;
      if ((this.rocket.crashed || this.rocket.landed) &&
          x >= restartButton.x && x <= restartButton.x + restartButton.width &&
          y >= restartButton.y && y <= restartButton.y + restartButton.height) {
        this.reset();
        break;
      } else {
        if (x >= thrustLeftButton.x && x <= thrustLeftButton.x + thrustLeftButton.width &&
            y >= thrustLeftButton.y && y <= thrustLeftButton.y + thrustLeftButton.height) {
          this.rocket.applyThrust(-1);
          this.rocket.emitParticles(-1);
        } else if (x >= thrustRightButton.x && x <= thrustRightButton.x + thrustRightButton.width &&
                   y >= thrustRightButton.y && y <= thrustRightButton.y + thrustRightButton.height) {
          this.rocket.applyThrust(1);
          this.rocket.emitParticles(1);
        } else if (x >= pitchLeftButton.x && x <= pitchLeftButton.x + pitchLeftButton.width &&
                   y >= pitchLeftButton.y && y <= pitchLeftButton.y + pitchLeftButton.height) {
          this.rocket.applyPitchThrust(-1);
          this.rocket.emitTopParticles(-1);
        } else if (x >= pitchRightButton.x && x <= pitchRightButton.x + pitchRightButton.width &&
                   y >= pitchRightButton.y && y <= pitchRightButton.y + pitchRightButton.height) {
          this.rocket.applyPitchThrust(1);
          this.rocket.emitTopParticles(1);
        }
      }
    }
    requestAnimationFrame(this.processMultiPointerInput.bind(this));
  }

  // Update camera offset when the rocket nears the left/right boundaries (20% from the edge)
  updateCamera() {
    const SCREEN_WIDTH = window.SCREEN_WIDTH;
    const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
    const leftThreshold = 0.2 * SCREEN_WIDTH;
    const rightThreshold = 0.8 * SCREEN_WIDTH;
    const topThreshold = 0.1 * SCREEN_HEIGHT;
  
    // Calculate ship's screen coordinates
    let rocketScreenX = this.rocket.pos.x - this.absoluteCameraOffsetX;
    let rocketScreenY = this.rocket.pos.y - this.cameraOffsetY;

    // Horizontal adjustments (unchanged)
    if (rocketScreenX < leftThreshold) {
      this.absoluteCameraOffsetX -= (leftThreshold - rocketScreenX) * 0.1;
    } else if (rocketScreenX > rightThreshold) {
      this.absoluteCameraOffsetX += (rocketScreenX - rightThreshold) * 0.1;
    }
  
    // Vertical adjustments
    this.cameraOffsetY += (this.rocket.pos.y - this.cameraOffsetY) * 0.1;
    if (rocketScreenY < topThreshold) {
      // Rocket is too high: adjust offset so that it stays at the topThreshold.
      this.cameraOffsetY += (this.rocket.pos.y - topThreshold - this.cameraOffsetY) * 0.1;
      this.cameraPannedUp = true;
    }

    if(this.cameraOffsetY > 0){
      this.cameraOffsetY = 0;
      this.cameraPannedUp = false;
    }

    // Normalize horizontal offset for terrain rendering.
    this.cameraOffsetX = ((this.absoluteCameraOffsetX % TOTAL_TERRAIN_LENGTH) + TOTAL_TERRAIN_LENGTH) % TOTAL_TERRAIN_LENGTH;
  }

  checkCollision() {
    if (this.rocket.crashed || this.rocket.landed) return;
  
    const pts = this.rocket.getTransformedPoints();
    const bottomCenter = {
      x: (pts[1].x + pts[2].x) / 2,
      y: (pts[1].y + pts[2].y) / 2
    };
  
    // Wrap the rocket's x coordinate so it falls within [0, TOTAL_TERRAIN_LENGTH)
    let modShipX = ((this.rocket.pos.x % TOTAL_TERRAIN_LENGTH) + TOTAL_TERRAIN_LENGTH) % TOTAL_TERRAIN_LENGTH;
  
    // First, check if the ship is over the landing pad.
    if (this.terrain.landingPad &&
        modShipX >= this.terrain.landingPad.start &&
        modShipX <= this.terrain.landingPad.end) {
      const padY = getBaseSurfaceY();
      if (Math.abs(bottomCenter.y - padY) < 5) {
        if (Math.abs(this.rocket.vel.y) < SAFE_VERTICAL_SPEED &&
            Math.abs(this.rocket.vel.x) < SAFE_HORIZONTAL_DRIFT &&
            Math.abs(this.rocket.angle) < SAFE_TILT) {
          this.rocket.landed = true;
          console.log("Landed successfully!");
        } else {
          this.rocket.crashed = true;
          console.log("Crash landing!");
        }
        return;
      }
    }

    // Check collision with orange buildings only
    for (const building of this.terrain.buildings) {
      // Skip blue buildings
      if (building.isBlue) continue;

      // Need to check all three copies of the building due to terrain wrapping
      for (let i = -1; i <= 1; i++) {
        const buildingX = building.x + i * TOTAL_TERRAIN_LENGTH;
        
        // Create building hitbox (slightly smaller than visual for better gameplay)
        const hitboxMargin = 2;
        const hitbox = {
          left: buildingX + hitboxMargin,
          right: buildingX + building.width - hitboxMargin,
          top: building.y - building.height + hitboxMargin,
          bottom: building.y - hitboxMargin
        };

        // Check if any point of the rocket is inside the building
        for (const point of pts) {
          if (point.x >= hitbox.left && 
              point.x <= hitbox.right && 
              point.y >= hitbox.top && 
              point.y <= hitbox.bottom) {
            this.rocket.crashed = true;
            console.log("Crashed into an orange building!");
            return;
          }
        }

        // Also check the lines between rocket points for better collision
        for (let j = 0; j < pts.length; j++) {
          const p1 = pts[j];
          const p2 = pts[(j + 1) % pts.length];
          
          // Simple line-box intersection test
          if (lineIntersectsBox(p1, p2, hitbox)) {
            this.rocket.crashed = true;
            console.log("Crashed into an orange building!");
            return;
          }
        }
      }
    }
  
    // Otherwise, check collision with the terrain segments.
    for (let i = 0; i < this.terrain.points.length - 1; i++) {
      const p1 = this.terrain.points[i];
      const p2 = this.terrain.points[i + 1];
      if (modShipX >= p1.x && modShipX <= p2.x) {
        const t = (modShipX - p1.x) / (p2.x - p1.x);
        const groundY = p1.y + t * (p2.y - p1.y);
        if (bottomCenter.y >= groundY) {
          this.rocket.crashed = true;
          console.log("Crashed on rough terrain!");
          break;
        }
      }
    }
  }

  displayEndMessage(ctx) {
    const messages = [
      "By the way, in case you did not know:",
      "Left Shift and Right Shift control the rocket's thrust...",
      "...as do the left/right arrow keys.",
      "Q and E control the rocket's pitch.",
      /*
      "This is just a prototype build with a super cool 7-year-old;",
      "levels and other features are coming...",
      "...maybe.",
      "So show a little kindness, mmkay?",
      "Forks and pull requests are welcome."
      */
    ];
    if (!this.endMessageStartTime) {
      this.endMessageStartTime = performance.now();
    }
    const currentTime = performance.now();
    const fadeDuration = 2000;
    for (let i = 0; i < messages.length; i++) {
      const lineStart = this.endMessageStartTime + i * fadeDuration;
      const elapsed = currentTime - lineStart;
      let alpha = 0;
      if (elapsed > 0) {
        alpha = Math.min(1, elapsed / fadeDuration);
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.fillText(messages[i], window.SCREEN_WIDTH / 2 - 200, 200 + i * 30);
      ctx.restore();
    }
  }

  update(deltaTime) {
    this.updateCamera();
    if (!this.rocket.crashed && !this.rocket.landed) {
      if (this.keys["ArrowLeft"] || this.keys["ShiftLeft"]) {
        this.rocket.applyThrust(-1);
        this.rocket.emitParticles(-1);
      }
      if (this.keys["ArrowRight"] || this.keys["ShiftRight"]) {
        this.rocket.applyThrust(1);
        this.rocket.emitParticles(1);
      }
      if (this.keys["KeyQ"]) {
        this.rocket.applyPitchThrust(-1);
        this.rocket.emitTopParticles(-1);
      }
      if (this.keys["KeyE"]) {
        this.rocket.applyPitchThrust(1);
        this.rocket.emitTopParticles(1);
      }
      this.rocket.update();
      this.checkCollision();
    }
  }

  render() {
    const SCREEN_WIDTH = window.SCREEN_WIDTH;
    const SCREEN_HEIGHT = window.SCREEN_HEIGHT;
    // Clear the entire canvas.
    this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
  
    // First draw the background elements
    this.terrain.drawSecondary(this.ctx, this.cameraOffsetX, this.cameraOffsetY, this.rocket.pos.y);

    // Draw the atmosphere boundary (Karman line)
    this.ctx.save();
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeStyle = 'white';
    this.ctx.beginPath();
    const karminLineWorldY = getBaseSurfaceY() - KARMIN_LINE;
    const karminLineScreenY = karminLineWorldY - this.cameraOffsetY;
    this.ctx.moveTo(0, karminLineScreenY);
    this.ctx.lineTo(SCREEN_WIDTH, karminLineScreenY);
    this.ctx.stroke();

    // Draw the animated speed line below Karman line
    const speedLineOffset = 50; // Distance below Karman line
    const dashSpeed = this.cameraOffsetX * 0.5; // Use camera offset for animation
    this.ctx.setLineDash([20, 20]);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.beginPath();
    this.ctx.moveTo(-dashSpeed % 40, karminLineScreenY + speedLineOffset);
    this.ctx.lineTo(SCREEN_WIDTH, karminLineScreenY + speedLineOffset);
    this.ctx.stroke();
    this.ctx.restore();

    // Then draw the foreground terrain and buildings
    this.terrain.draw(this.ctx, this.cameraOffsetX, this.cameraOffsetY);
  
    // Compute the effective x position for the rocket.
    const effectiveShipX =
      ((this.rocket.pos.x - this.absoluteCameraOffsetX) % TOTAL_TERRAIN_LENGTH +
        TOTAL_TERRAIN_LENGTH) %
      TOTAL_TERRAIN_LENGTH;
  
    // Draw the rocket at its effective x position.
    this.ctx.save();
    this.rocket.drawAt(this.ctx, effectiveShipX, this.rocket.pos.y - this.cameraOffsetY);
    this.ctx.restore();
  
    // Draw UI elements (which remain in fixed screen coordinates).
    drawUI(this.ctx, this);
  
    // If the game is over, display messages and a restart button.
    if (this.rocket.landed || this.rocket.crashed) {
      this.ctx.font = "24px Helvetica";
      if (this.rocket.landed) {
        this.ctx.fillStyle = "green";
        this.ctx.fillText("LANDED SUCCESSFULLY! 🚀", SCREEN_WIDTH / 2 - 100, 50);
      } else if (this.rocket.crashed) {
        this.ctx.fillStyle = "red";
        this.ctx.fillText("CRASHED! 💥", SCREEN_WIDTH / 2 - 50, 50);
      }
      this.ctx.fillStyle = "white";
      this.ctx.fillText("Press R, Enter, or tap Restart.", SCREEN_WIDTH / 2 - 150, 80);
  
      // Draw the restart button.
      this.ctx.fillStyle = "gray";
      this.ctx.fillRect(
        restartButton.x,
        restartButton.y,
        restartButton.width,
        restartButton.height
      );
      this.ctx.strokeStyle = "white";
      this.ctx.strokeRect(
        restartButton.x,
        restartButton.y,
        restartButton.width,
        restartButton.height
      );
      this.ctx.fillStyle = "white";
      this.ctx.font = "20px Helvetica";
      this.ctx.fillText(
        "Restart",
        restartButton.x + 19,
        restartButton.y + 27
      );

      // Display end messages (fading in one line at a time)
      this.displayEndMessage(this.ctx);
    }
  
    // Always draw a target arrow pointing to the landing pad.
    /*
    if (this.terrain.landingPad) {
      drawTargetArrow(this.ctx, this.terrain.landingPad);
    }
    */

  }

  loop(timestamp) {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    this.update(deltaTime);
    this.render();
    if (this.running) {
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  run() {
    requestAnimationFrame(this.loop.bind(this));
  }
}