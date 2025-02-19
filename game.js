// version 0.0.2
// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;
const FPS = 60;
const DT = 1 / FPS;
const GRAVITY = 60.0;
const THRUST_POWER = 150.0;
const SAFE_LANDING_VELOCITY = 50.0;
const SAFE_LANDING_ANGLE = 20.0;

// Button definitions (positions and sizes)
const buttonMargin = 20;
const thrustButtonWidth = 100;
const thrustButtonHeight = 100;
const pitchButtonWidth = 60;
const pitchButtonHeight = 60;
const buttonGap = 10;

// Bottom thruster buttons
const thrustLeftButton = {
  x: buttonMargin,
  y: SCREEN_HEIGHT - thrustButtonHeight - buttonMargin,
  width: thrustButtonWidth,
  height: thrustButtonHeight
};
const thrustRightButton = {
  x: SCREEN_WIDTH - thrustButtonWidth - buttonMargin,
  y: SCREEN_HEIGHT - thrustButtonHeight - buttonMargin,
  width: thrustButtonWidth,
  height: thrustButtonHeight
};

// Pitch buttons directly above the thruster buttons
const pitchLeftButton = {
  x: thrustLeftButton.x + (thrustButtonWidth - pitchButtonWidth) / 2,
  y: thrustLeftButton.y - pitchButtonHeight - buttonGap,
  width: pitchButtonWidth,
  height: pitchButtonHeight
};
const pitchRightButton = {
  x: thrustRightButton.x + (thrustButtonWidth - pitchButtonWidth) / 2,
  y: thrustRightButton.y - pitchButtonHeight - buttonGap,
  width: pitchButtonWidth,
  height: pitchButtonHeight
};

// Restart button (only visible when rocket has crashed or landed)
const restartButton = {
  x: SCREEN_WIDTH / 2 - 50,
  y: 100,
  width: 100,
  height: 40
};

// Utility function for degree-radian conversion
function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

// --- Particle Class ---
class Particle {
  constructor(x, y, angle) {
    this.pos = { x: x, y: y };
    const speed = 50 + Math.random() * 50;
    this.vel = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
    // Increased lifetime for better visibility (from 0.5 to 1.0 seconds)
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
    // Fade effect based on lifetime remaining
    const alpha = Math.min(this.lifetime / 1.0, 1);
    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 3, 0, 2 * Math.PI); // radius 3 for visibility
    ctx.fill();
    ctx.restore();
  }
}

// --- Rocket Class ---
class Rocket {
  constructor(x, y) {
    this.pos = { x: x, y: y };
    this.vel = { x: 0, y: 0 };
    this.angle = 0; // in degrees
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
  
  // Return transformed rocket points
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
  
  // Apply thrust from a bottom thruster
  applyThrust(direction) {
    // direction: -1 for left, +1 for right
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
  
  // Apply pitch thrust from a top thruster
  applyPitchThrust(direction) {
    // direction: -1 for left, +1 for right
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
  
  // Emit particles from a bottom thruster
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
  
  // Emit particles from a top thruster
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

// --- Terrain Class ---
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

// --- Game Class ---
class Game {
  constructor() {
    this.reset();
    this.lastTime = 0;
    this.running = true;
    this.keys = {};
    
    // Keyboard events (prevent default scrolling for arrow/shift keys)
    window.addEventListener('keydown', (e) => {
      if (["ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === "KeyR") {
        this.reset();
      }
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    
    // Pointer events for on-screen buttons
    this.pointerDown = false;
    this.pointerX = 0;
    this.pointerY = 0;
    canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    canvas.addEventListener('pointercancel', this.handlePointerUp.bind(this));
  }
  
  reset() {
    this.rocket = new Rocket(SCREEN_WIDTH / 2, 100);
    this.terrain = new Terrain();
    this.keys = {};
    this.running = true;
    this.lastTime = 0;
    this.pointerDown = false;
  }
  
  handlePointerDown(e) {
    e.preventDefault();
    this.pointerDown = true;
    this.updatePointerPosition(e);
    this.processPointerInput();
  }
  
  handlePointerMove(e) {
    if (!this.pointerDown) return;
    this.updatePointerPosition(e);
  }
  
  handlePointerUp(e) {
    e.preventDefault();
    this.pointerDown = false;
  }
  
  updatePointerPosition(e) {
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const rect = canvas.getBoundingClientRect();
    this.pointerX = clientX - rect.left;
    this.pointerY = clientY - rect.top;
  }
  
  processPointerInput() {
    if (!this.pointerDown) return;
    const x = this.pointerX;
    const y = this.pointerY;
    
    // If rocket is crashed/landed, check restart button
    if ((this.rocket.crashed || this.rocket.landed) &&
        x >= restartButton.x && x <= restartButton.x + restartButton.width &&
        y >= restartButton.y && y <= restartButton.y + restartButton.height) {
      this.reset();
      return;
    }
    
    // Process thruster buttons
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
    requestAnimationFrame(this.processPointerInput.bind(this));
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
      ctx.fillText("Press R or tap Restart", SCREEN_WIDTH / 2 - 130, 80);
      
      // Draw the restart button
      ctx.fillStyle = 'gray';
      ctx.fillRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      ctx.strokeStyle = 'white';
      ctx.strokeRect(restartButton.x, restartButton.y, restartButton.width, restartButton.height);
      ctx.fillStyle = 'white';
      ctx.font = '20px Arial';
      ctx.fillText("Restart", restartButton.x + 10, restartButton.y + 28);
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

// Start the game
const game = new Game();
game.run();