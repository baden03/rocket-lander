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
    ctx.arc(this.pos.x, this.pos.y, 3, 0, 2 * Math.PI); // radius 3 for better visibility
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
  
  // Return the transformed (rotated and translated) rocket points
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
  
  // Apply thrust from one of the bottom thrusters
  applyThrust(direction) {
    // direction: -1 for left, +1 for right
    const thrust = THRUST_POWER * 0.5;
    const rad = degToRad(this.angle);
    // Local thrust vector (pointing up)
    const localThrust = { x: 0, y: -thrust };
    // Rotate thrust vector by current angle
    const worldThrust = {
      x: localThrust.x * Math.cos(rad) - localThrust.y * Math.sin(rad),
      y: localThrust.x * Math.sin(rad) + localThrust.y * Math.cos(rad),
    };
    this.vel.x += worldThrust.x * DT;
    this.vel.y += worldThrust.y * DT;
    
    // Apply torque based on engine offset
    const engineOffset = (direction < 0) ? { x: -10, y: 10 } : { x: 10, y: 10 };
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad),
    };
    const torqueEffect = worldOffset.x * worldThrust.y - worldOffset.y * worldThrust.x;
    this.angularVel += (torqueEffect / 100.0) * DT;
  }
  
  // Apply pitch thrust from the top thrusters
  applyPitchThrust(direction) {
    // direction: -1 for left, +1 for right
    const thrust = THRUST_POWER * 25; // Adjust multiplier as needed
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
  
  // Emit particles from the bottom thrusters
  emitParticles(direction) {
    // direction: -1 for left thruster, +1 for right thruster
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
    // Emit particles in the opposite direction of thrust, adding some randomness
    const particleAngle = degToRad(this.angle) + Math.PI + (Math.random() * 0.4 - 0.2);
    this.particles.push(new Particle(particlePos.x, particlePos.y, particleAngle));
  }
  
  // Emit particles from the top (pitch) thrusters
  emitTopParticles(direction) {
    // direction: -1 for left pitch thruster, +1 for right pitch thruster
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
    
    // Apply gravity
    this.vel.y += GRAVITY * DT;
    
    // Update position and angle
    this.pos.x += this.vel.x * DT;
    this.pos.y += this.vel.y * DT;
    this.angle += this.angularVel * DT;
    
    // Apply simple drag
    this.vel.x *= (1 - 0.1 * DT);
    this.vel.y *= (1 - 0.1 * DT);
    this.angularVel *= (1 - 0.2 * DT);
    
    // Update and filter out dead particles
    this.particles = this.particles.filter(p => {
      p.update();
      return p.isAlive();
    });
  }
  
  draw(ctx) {
    // Draw particles
    this.particles.forEach(p => p.draw(ctx));
    
    // Draw rocket shape
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
    
    // Setup keyboard events with prevention of default scrolling for arrow/shift keys
    this.keys = {};
    window.addEventListener('keydown', (e) => {
      // Prevent default for keys used for thrust to avoid scrolling
      if (["ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"].includes(e.code)) {
        e.preventDefault();
      }
      // Restart game if R is pressed
      if (e.code === "KeyR") {
        this.reset();
      }
      this.keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  }
  
  // Reset the game state
  reset() {
    this.rocket = new Rocket(SCREEN_WIDTH / 2, 100);
    this.terrain = new Terrain();
    this.keys = {};
    this.running = true;
    this.lastTime = 0;
  }
  
  // Check for collisions with the terrain or landing pad
  checkCollision() {
    if (this.rocket.crashed || this.rocket.landed) return;

    // Get bottom center of the rocket (average of the two lower points)
    const pts = this.rocket.getTransformedPoints();
    const bottomCenter = {
      x: (pts[1].x + pts[2].x) / 2,
      y: (pts[1].y + pts[2].y) / 2
    };

    // If over the landing pad area
    if (this.terrain.landingPad &&
        bottomCenter.x >= this.terrain.landingPad.start &&
        bottomCenter.x <= this.terrain.landingPad.end) {
      const padY = SCREEN_HEIGHT * 0.7;
      if (Math.abs(bottomCenter.y - padY) < 5) {
        // Check safe landing conditions
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
      // Check collision with rough terrain
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
    // Only process input if the rocket is still active
    if (!this.rocket.crashed && !this.rocket.landed) {
      // Input handling for bottom thrusters (Arrow keys or Shift keys)
      if (this.keys['ArrowLeft'] || this.keys['ShiftLeft']) {
        this.rocket.applyThrust(-1);
        this.rocket.emitParticles(-1);
      }
      if (this.keys['ArrowRight'] || this.keys['ShiftRight']) {
        this.rocket.applyThrust(1);
        this.rocket.emitParticles(1);
      }
      // Input handling for pitch thrusters (Q/E keys)
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
    
    // Display landing/crash messages and restart prompt
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    if (this.rocket.landed) {
      ctx.fillStyle = 'green';
      ctx.fillText("LANDED SUCCESSFULLY! 🚀", SCREEN_WIDTH / 2 - 100, 50);
      ctx.fillStyle = 'white';
      ctx.fillText("Press R to restart", SCREEN_WIDTH / 2 - 100, 80);
    } else if (this.rocket.crashed) {
      ctx.fillStyle = 'red';
      ctx.fillText("CRASHED! 💥", SCREEN_WIDTH / 2 - 50, 50);
      ctx.fillStyle = 'white';
      ctx.fillText("Press R to restart", SCREEN_WIDTH / 2 - 100, 80);
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