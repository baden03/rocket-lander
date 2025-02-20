// version 0.0.10

// ----------------------
// UI Button Definitions
// ----------------------
const buttonMargin = 20;
const thrustButtonWidth = 100;
const thrustButtonHeight = 100;
const pitchButtonWidth = 60;
const pitchButtonHeight = 60;
const buttonGap = 10;

// Define UI button objects with initial dummy values (will be updated on resize)
const thrustLeftButton = { x: 0, y: 0, width: thrustButtonWidth, height: thrustButtonHeight };
const thrustRightButton = { x: 0, y: 0, width: thrustButtonWidth, height: thrustButtonHeight };
const pitchLeftButton = { x: 0, y: 0, width: pitchButtonWidth, height: pitchButtonHeight };
const pitchRightButton = { x: 0, y: 0, width: pitchButtonWidth, height: pitchButtonHeight };
const restartButton = { x: 0, y: 0, width: 100, height: 40 };

let game;

// ----------------------
// Global Variables & Canvas Setup
// ----------------------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let SCREEN_WIDTH = canvas.width;
let SCREEN_HEIGHT = canvas.height;

const FPS = 60;
const DT = 1 / FPS;
const GRAVITY = 60.0;
const THRUST_POWER = 150.0;
const SAFE_LANDING_VELOCITY = 50.0;
const SAFE_LANDING_ANGLE = 20.0;

// ----------------------
// UI Update Functions
// ----------------------
function updateUIButtons() {
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
    restartButton.width = 100;
    restartButton.height = 40;
}

function resizeCanvas() {
    console.log("Resizing canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    SCREEN_WIDTH = canvas.width;
    SCREEN_HEIGHT = canvas.height;
    updateUIButtons();

    // Regenerate terrain if the game is in progress.
    if (game && !game.rocket.crashed && !game.rocket.landed) {
        game.terrain = new Terrain();
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ----------------------
// Utility Functions
// ----------------------
function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

// Draw an arrow along the canvas boundary pointing from the center toward the rocket.
function drawOffscreenArrow(ctx, rocket) {
  const cx = SCREEN_WIDTH / 2;
  const cy = SCREEN_HEIGHT / 2;
  const dx = rocket.pos.x - cx;
  const dy = rocket.pos.y - cy;
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

// Helper function: Draw distance indicator in the minimap area
function drawDistanceIndicator(ctx, rocket) {
  // Clamp the rocket's x and y to the canvas boundaries.
  const clampedX = Math.max(0, Math.min(rocket.pos.x, SCREEN_WIDTH));
  const clampedY = Math.max(0, Math.min(rocket.pos.y, SCREEN_HEIGHT));

  // Compute the differences.
  const dx = rocket.pos.x - clampedX;
  const dy = rocket.pos.y - clampedY;
  // Euclidean distance from rocket to the nearest border.
  const distancePx = Math.sqrt(dx * dx + dy * dy);
  
  // Convert pixels to meters (assuming 2 px = 1 meter).
  const distanceMeters = distancePx / 2;

  // Format distance: if more than 1000 m, also display kilometers
  let distanceText = "";
  if (distanceMeters >= 1000) {
    const distanceKm = (distanceMeters / 1000).toFixed(2);
    distanceText = `${distanceKm} km`;
  } else {
    distanceText = `${distanceMeters.toFixed(0)} m`;
  }

  // Draw the distance text near the minimap (for example, below it)
  // You can adjust the x,y positions as needed.
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  // Draw the text just below the avatar box
  ctx.fillText("Distance: " + distanceText, SCREEN_WIDTH / 2 - 70, SCREEN_HEIGHT / 2 + 90);
  ctx.restore();
}

// Draw the avatar (minimap) of the rocket—a scaled clone inside a box centered on the screen.
function drawAvatar(ctx, rocket) {
  const boxWidth = 150;
  const boxHeight = 150;
  const boxX = SCREEN_WIDTH / 2 - boxWidth / 2;
  const boxY = SCREEN_HEIGHT / 2 - boxHeight / 2;

  ctx.save();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

  // Draw the scaled clone of the rocket inside the box
  ctx.translate(SCREEN_WIDTH / 2, SCREEN_HEIGHT / 2);
  ctx.rotate(degToRad(rocket.angle));
  ctx.strokeStyle = 'cyan';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const scale = 0.5;
  const pts = rocket.points.map(pt => ({ x: pt.x * scale, y: pt.y * scale }));
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// ----------------------
// Particle Class
// ----------------------
class Particle {
  constructor(x, y, angle) {
    this.pos = { x: x, y: y };
    const speed = 50 + Math.random() * 50;
    this.vel = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    this.lifetime = 0.5 + Math.random() * 0.5;
    this.color = 'yellow';
  }
  
  update() {
    this.pos.x += this.vel.x * DT;
    this.pos.y += this.vel.y * DT;
    this.vel.y += GRAVITY * DT;
    this.lifetime -= DT;
  }
  
  isAlive() {
    return this.lifetime > 0;
  }
  
  draw(ctx) {
    ctx.save();
    const alpha = Math.min(this.lifetime / 1.0, 1);
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
  }
}

// ----------------------
// Rocket Class
// ----------------------
class Rocket {
  constructor(x, y) {
    this.pos = { x: x, y: y };
    this.vel = { x: 0, y: 0 };
    this.angle = 0;
    this.angularVel = 0;
    this.particles = [];
    this.crashed = false;
    this.landed = false;
    // Define the rocket shape in local coordinates
    this.points = [
      { x: 0, y: -20 },
      { x: 10, y: 10 },
      { x: -10, y: 10 },
    ];
  }
  
  getTransformedPoints() {
    const rad = degToRad(this.angle);
    return this.points.map(pt => {
      const rotated = {
        x: pt.x * Math.cos(rad) - pt.y * Math.sin(rad),
        y: pt.x * Math.sin(rad) + pt.y * Math.cos(rad),
      };
      return { x: rotated.x + this.pos.x, y: rotated.y + this.pos.y };
    });
  }
  
  applyThrust(direction) {
    const thrust = THRUST_POWER * 0.5;
    const rad = degToRad(this.angle);
    const localThrust = { x: 0, y: -thrust };
    const worldThrust = {
      x: localThrust.x * Math.cos(rad) - localThrust.y * Math.sin(rad),
      y: localThrust.x * Math.sin(rad) + localThrust.y * Math.cos(rad),
    };
    this.vel.x += worldThrust.x * DT;
    this.vel.y += worldThrust.y * DT;
    
    const engineOffset = (direction < 0) ? { x: -10, y: 10 } : { x: 10, y: 10 };
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad),
    };
    const torqueEffect = worldOffset.x * worldThrust.y - worldOffset.y * worldThrust.x;
    this.angularVel += (torqueEffect / 100.0) * DT;
  }
  
  applyPitchThrust(direction) {
    const thrust = THRUST_POWER * 25;
    const rad = degToRad(this.angle);
    const localThrust = { x: 0, y: -thrust };
    const worldThrust = {
      x: localThrust.x * Math.cos(rad) - localThrust.y * Math.sin(rad),
      y: localThrust.x * Math.sin(rad) + localThrust.y * Math.cos(rad),
    };
    
    const engineOffset = (direction < 0) ? { x: -5, y: -20 } : { x: 5, y: -20 };
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad),
    };
    const torqueEffect = worldOffset.x * worldThrust.y - worldOffset.y * worldThrust.x;
    this.angularVel += (torqueEffect / 200.0) * DT;
  }
  
  emitParticles(direction) {
    const engineOffset = (direction < 0) ? { x: -10, y: 10 } : { x: 10, y: 10 };
    const rad = degToRad(this.angle);
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad),
    };
    const particlePos = {
      x: this.pos.x + worldOffset.x,
      y: this.pos.y + worldOffset.y
    };
    const particleAngle = degToRad(this.angle) + Math.PI + (Math.random() * 0.4 - 0.2);
    this.particles.push(new Particle(particlePos.x, particlePos.y, particleAngle));
  }
  
  emitTopParticles(direction) {
    const engineOffset = (direction < 0) ? { x: -5, y: -20 } : { x: 5, y: -20 };
    const rad = degToRad(this.angle);
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad),
    };
    const particlePos = {
      x: this.pos.x + worldOffset.x,
      y: this.pos.y + worldOffset.y
    };
    const particleAngle = degToRad(this.angle) + Math.PI + (Math.random() * 0.4 - 0.2);
    this.particles.push(new Particle(particlePos.x, particlePos.y, particleAngle));
  }
  
  update() {
    if (this.crashed || this.landed) return;
    this.vel.y += GRAVITY * DT;
    this.pos.x += this.vel.x * DT;
    this.pos.y += this.vel.y * DT;
    this.angle += this.angularVel * DT;
    
    this.vel.x *= (1 - 0.1 * DT);
    this.vel.y *= (1 - 0.1 * DT);
    this.angularVel *= (1 - 0.2 * DT);
    
    this.particles = this.particles.filter(p => {
      p.update();
      return p.isAlive();
    });
  }
  
  draw(ctx) {
    this.particles.forEach(p => p.draw(ctx));
    const pts = this.getTransformedPoints();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = this.crashed ? 'red' : 'white';
    ctx.stroke();
    ctx.restore();
  }
}

// ----------------------
// Terrain Class
// ----------------------
class Terrain {
  constructor() {
    this.points = [];
    this.landingPad = null;
    this.generateTerrain();
  }
  
  generateTerrain() {
    let x = 0;
    while (x < SCREEN_WIDTH) {
      let y;
      if (x >= SCREEN_WIDTH / 3 && x <= SCREEN_WIDTH / 2) {
        y = SCREEN_HEIGHT * 0.7;
        this.landingPad = { start: x, end: x + 100 };
        x += 100;
      } else {
        y = SCREEN_HEIGHT * 0.6 + Math.random() * (SCREEN_HEIGHT * 0.2);
        x += 20 + Math.random() * 30;
      }
      this.points.push({ x: x, y: y });
    }
  }
  
  draw(ctx) {
    if (this.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(this.points[0].x, this.points[0].y);
      this.points.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
    if (this.landingPad) {
      ctx.fillStyle = 'yellow';
      const padY = SCREEN_HEIGHT * 0.7;
      ctx.fillRect(this.landingPad.start, padY, this.landingPad.end - this.landingPad.start, 5);
    }
  }
}

// ----------------------
// End Message Functionality
// ----------------------
class Game {
  constructor() {
    this.reset();
    this.lastTime = 0;
    this.running = true;
    this.keys = {};
    this.endMessageStartTime = null;
    
    window.addEventListener('keydown', (e) => {
      if (["ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "KeyR" && (this.rocket.landed || this.rocket.crashed)) {
        this.reset();
      }
      if (e.code === "Enter" && (this.rocket.landed || this.rocket.crashed)) {
        this.reset();
      }
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    
    // Multi-touch: track active pointers by pointerId
    this.activePointers = {};
    canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    canvas.addEventListener('pointercancel', this.handlePointerUp.bind(this));
    
    // Start processing multi-touch input
    this.processMultiPointerInput();
  }
  
  reset() {
    this.rocket = new Rocket(SCREEN_WIDTH / 2, 100);
    this.terrain = new Terrain();
    this.keys = {};
    this.running = true;
    this.lastTime = 0;
    this.activePointers = {};
    this.endMessageStartTime = null;
  }
  
  updatePointerPosition(e) {
    const rect = canvas.getBoundingClientRect();
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
  
  checkCollision() {
    if (this.rocket.crashed || this.rocket.landed) return;
    const pts = this.rocket.getTransformedPoints();
    const bottomCenter = {
      x: (pts[1].x + pts[2].x) / 2,
      y: (pts[1].y + pts[2].y) / 2
    };
    if (this.terrain.landingPad &&
        bottomCenter.x >= this.terrain.landingPad.start &&
        bottomCenter.x <= this.terrain.landingPad.end) {
      const padY = SCREEN_HEIGHT * 0.7;
      if (Math.abs(bottomCenter.y - padY) < 5) {
        if (Math.abs(this.rocket.vel.y) < SAFE_LANDING_VELOCITY &&
            Math.abs(this.rocket.vel.x) < SAFE_LANDING_VELOCITY &&
            Math.abs(this.rocket.angle) < SAFE_LANDING_ANGLE) {
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
      "This is just a prototype build with a super cool 7 year old;",
      "levels and other features are coming...",
      "...maybe.",
      "So show a little kindness, mmkay?",
      "Forks and pull requests are welcome."
    ];
    if (!this.endMessageStartTime) {
      this.endMessageStartTime = performance.now();
    }
    const currentTime = performance.now();
    const fadeDuration = 2000; // each line fades in over 2 seconds
    for (let i = 0; i < messages.length; i++) {
      const lineStart = this.endMessageStartTime + i * fadeDuration;
      const elapsed = currentTime - lineStart;
      let alpha = 0;
      if (elapsed > 0) {
        alpha = Math.min(1, elapsed / fadeDuration);
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText(messages[i], SCREEN_WIDTH / 2 - 200, 100 + i * 30);
      ctx.restore();
    }
  }
  
  update(deltaTime) {
    if (!this.rocket.crashed && !this.rocket.landed) {
      if (this.keys['ArrowLeft'] || this.keys['ShiftLeft']) {
        this.rocket.applyThrust(-1);
        this.rocket.emitParticles(-1);
      }
      if (this.keys['ArrowRight'] || this.keys['ShiftRight']) {
        this.rocket.applyThrust(1);
        this.rocket.emitParticles(1);
      }
      if (this.keys['KeyQ']) {
        this.rocket.applyPitchThrust(-1);
        this.rocket.emitTopParticles(-1);
      }
      if (this.keys['KeyE']) {
        this.rocket.applyPitchThrust(1);
        this.rocket.emitTopParticles(1);
      }
      this.rocket.update();
      this.checkCollision();
    }
  }
  
  render() {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    this.terrain.draw(ctx);
    this.rocket.draw(ctx);
    
    // Draw on-screen buttons for thrusters and pitch
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 2;
    ctx.strokeRect(thrustLeftButton.x, thrustLeftButton.y, thrustLeftButton.width, thrustLeftButton.height);
    ctx.strokeRect(thrustRightButton.x, thrustRightButton.y, thrustRightButton.width, thrustRightButton.height);
    ctx.strokeRect(pitchLeftButton.x, pitchLeftButton.y, pitchLeftButton.width, pitchLeftButton.height);
    ctx.strokeRect(pitchRightButton.x, pitchRightButton.y, pitchRightButton.width, pitchRightButton.height);
    
    ctx.fillStyle = 'gray';
    ctx.font = '16px Arial';
    ctx.fillText("Thrust L", thrustLeftButton.x + 10, thrustLeftButton.y + 25);
    ctx.fillText("Thrust R", thrustRightButton.x + 10, thrustRightButton.y + 25);
    ctx.fillText("Pitch L", pitchLeftButton.x + 5, pitchLeftButton.y + 20);
    ctx.fillText("Pitch R", pitchRightButton.x + 5, pitchRightButton.y + 20);
    
    // Display landing/crash messages and restart prompt
    if (this.rocket.landed || this.rocket.crashed) {
      ctx.font = '24px Arial';
      if (this.rocket.landed) {
        ctx.fillStyle = 'green';
        ctx.fillText("LANDED SUCCESSFULLY! 🚀", SCREEN_WIDTH / 2 - 100, 50);
      } else if (this.rocket.crashed) {
        ctx.fillStyle = 'red';
        ctx.fillText("CRASHED! 💥", SCREEN_WIDTH / 2 - 50, 50);
      }
      ctx.fillStyle = 'white';
      ctx.fillText("Press R, Enter, or tap Restart.", SCREEN_WIDTH / 2 - 150, 80);
      
      // Draw the restart button
      ctx.fillStyle = 'gray';
      ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      ctx.strokeStyle = 'white';
      ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText("Restart", restartButton.x + 17, restartButton.y + 28);
      
      // Display end messages (fading in one line at a time)
      this.displayEndMessage(ctx);
    }
    
    // If rocket is off canvas, draw offscreen arrow, minimap, and distance indicator.
    if (this.rocket.pos.x < 0 || this.rocket.pos.x > SCREEN_WIDTH ||
        this.rocket.pos.y < 0 || this.rocket.pos.y > SCREEN_HEIGHT) {
      drawOffscreenArrow(ctx, this.rocket);
      ctx.save();
      ctx.globalAlpha = 0.8;
      drawAvatar(ctx, this.rocket);
      ctx.restore();
      // Draw the distance indicator below the minimap.
      drawDistanceIndicator(ctx, this.rocket);
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

// ----------------------
// Start the Game
// ----------------------
game = new Game();
game.run();