// game.js - Core game logic for Rocket Lander (Version 0.0.2)
// version 0.0.1

import { drawUI, updateUIButtons, thrustLeftButton, thrustRightButton, pitchLeftButton, pitchRightButton, restartButton, drawTargetArrow, getBaseSurfaceY } from "./ui.js";
import { Terrain } from "./terrain.js";
import { Rocket } from "./ship.js";

export class Game {
  constructor(canvas) {
    this.canvas = canvas; // store canvas reference
    this.ctx = this.canvas.getContext("2d");
    this.reset();
    this.lastTime = 0;
    this.running = true;
    this.keys = {};
    this.endMessageStartTime = null;

    // Keyboard events (prevent default scrolling for arrow/shift keys)
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

    // Multi-touch: track active pointers by pointerId
    this.activePointers = {};
    this.canvas.addEventListener("pointerdown", this.handlePointerDown.bind(this));
    this.canvas.addEventListener("pointermove", this.handlePointerMove.bind(this));
    this.canvas.addEventListener("pointerup", this.handlePointerUp.bind(this));
    this.canvas.addEventListener("pointercancel", this.handlePointerUp.bind(this));

    // Start processing multi-touch input
    this.processMultiPointerInput();
  }

  reset() {
    this.rocket = new Rocket(window.SCREEN_WIDTH / 2, 100);
    this.terrain = new Terrain();
    this.keys = {};
    this.running = true;
    this.lastTime = 0;
    this.activePointers = {};
    this.endMessageStartTime = null;
  }

  updatePointerPosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
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

  checkCollision() {
    if (this.rocket.crashed || this.rocket.landed) return;
    const pts = this.rocket.getTransformedPoints();
    const bottomCenter = {
      x: (pts[1].x + pts[2].x) / 2,
      y: (pts[1].y + pts[2].y) / 2,
    };
    if (this.terrain.landingPad &&
        bottomCenter.x >= this.terrain.landingPad.start &&
        bottomCenter.x <= this.terrain.landingPad.end) {
      const padY = getBaseSurfaceY();
      if (Math.abs(bottomCenter.y - padY) < 5) {
        if (Math.abs(this.rocket.vel.y) < 50 &&
            Math.abs(this.rocket.vel.x) < 50 &&
            Math.abs(this.rocket.angle) < 20) {
          this.rocket.landed = true;
          console.log("Landed successfully!");
        } else {
          this.rocket.crashed = true;
          console.log("Crash landing!");
        }
      }
    } else {
      for (let i = 0; i < this.terrain.points.length - 1; i++) {
        let p1 = this.terrain.points[i];
        let p2 = this.terrain.points[i + 1];
        if (bottomCenter.x >= p1.x && bottomCenter.x <= p2.x) {
          let groundY = p1.y + ((p2.y - p1.y) / (p2.x - p1.x)) * (bottomCenter.x - p1.x);
          if (bottomCenter.y >= groundY) {
            this.rocket.crashed = true;
            console.log("Crashed on rough terrain!");
            break;
          }
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
      "This is just a prototype build with a super cool 7-year-old;",
      "levels and other features are coming...",
      "...maybe.",
      "So show a little kindness, mmkay?",
      "Forks and pull requests are welcome."
    ];
    if (!this.endMessageStartTime) {
      this.endMessageStartTime = performance.now();
    }
    const currentTime = performance.now();
    const fadeDuration = 2000; // 2 seconds per line
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
      ctx.fillText(messages[i], window.SCREEN_WIDTH / 2 - 200, 100 + i * 30);
      ctx.restore();
    }
  }

  update(deltaTime) {
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
    this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // Draw terrain and rocket (gameplay area)
    this.terrain.draw(this.ctx);
    this.rocket.draw(this.ctx);

    // Draw UI elements from ui.js
    drawUI(this.ctx, this);

    // If game over, display end messages and restart button
    if (this.rocket.landed || this.rocket.crashed) {
      this.ctx.font = "24px Arial";
      if (this.rocket.landed) {
        this.ctx.fillStyle = "green";
        this.ctx.fillText("LANDED SUCCESSFULLY! 🚀", SCREEN_WIDTH / 2 - 100, 50);
      } else if (this.rocket.crashed) {
        this.ctx.fillStyle = "red";
        this.ctx.fillText("CRASHED! 💥", SCREEN_WIDTH / 2 - 50, 50);
      }
      this.ctx.fillStyle = "white";
      this.ctx.fillText("Press R, Enter, or tap Restart.", SCREEN_WIDTH / 2 - 150, 80);

      // Draw the restart button
      this.ctx.fillStyle = "gray";
      this.ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      this.ctx.strokeStyle = "white";
      this.ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      this.ctx.fillStyle = "white";
      this.ctx.font = "20px Arial";
      this.ctx.fillText("Restart", restartButton.x + 17, restartButton.y + 28);

      // Display end messages
      this.displayEndMessage(this.ctx);
    }

    // In scroll mode, always draw a target arrow pointing to the landing pad.
    if (this.terrain.landingPad) {
      drawTargetArrow(this.ctx, this.terrain.landingPad);
    }
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