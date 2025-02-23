// ship.js - Defines the Rocket class for Rocket Lander (Version 0.0.2)
// version 0.0.2

import { degToRad } from "./utils.js";

// Particle class represents exhaust particles from the rocket.
class Particle {
  constructor(x, y, angle) {
    this.pos = { x, y };
    const speed = 50 + Math.random() * 50;
    this.vel = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    };
    this.lifetime = 0.5 + Math.random() * 0.5;
    this.color = "yellow";
  }

  update() {
    this.pos.x += this.vel.x * (1 / 60);
    this.pos.y += this.vel.y * (1 / 60);
    // Base gravity; refined in game.js if needed.
    this.vel.y += 60 * (1 / 60);
    this.lifetime -= (1 / 60);
  }

  isAlive() {
    return this.lifetime > 0;
  }

  // Draws the particle using its global coordinates.
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

// Rocket class represents the player's ship.
export class Rocket {
  constructor(x, y) {
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.angle = 0; // In degrees.
    this.angularVel = 0;
    this.particles = [];
    this.crashed = false;
    this.landed = false;

    // Define the rocket shape in local coordinates.
    // These points are relative to the ship's center (i.e. its local origin).
    this.points = [
      { x: 0, y: -20 },
      { x: 10, y: 10 },
      { x: -10, y: 10 }
    ];
  }

  // Returns the rocket's shape after applying rotation and translation.
  // (This is used in draw() for the global drawing version.)
  getTransformedPoints() {
    const rad = degToRad(this.angle);
    return this.points.map(pt => {
      const rotated = {
        x: pt.x * Math.cos(rad) - pt.y * Math.sin(rad),
        y: pt.x * Math.sin(rad) + pt.y * Math.cos(rad)
      };
      return { x: rotated.x + this.pos.x, y: rotated.y + this.pos.y };
    });
  }

  // Private helper method for drawing the ship (including particles)
  // in global coordinates.
  _drawShip(ctx) {
    // Draw particles using their global positions.
    this.particles.forEach(p => p.draw(ctx));
    
    // Get transformed ship shape.
    const pts = this.getTransformedPoints();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = this.crashed ? "red" : "white";
    ctx.stroke();
  }

  // Helper method for drawing particles relative to the ship's local origin.
  // In this revised version, we also rotate the relative particle coordinates by the
  // negative of the ship's angle so that they remain attached correctly.
  _drawParticlesRelative(ctx) {
    // Compute the negative angle in radians.
    const negAngle = degToRad(-this.angle);
    this.particles.forEach(p => {
      // Compute the difference between the particle's global position and the ship's position.
      const dx = p.pos.x - this.pos.x;
      const dy = p.pos.y - this.pos.y;
      // Rotate the difference so that it is expressed in the ship's local coordinate system.
      const localX = dx * Math.cos(negAngle) - dy * Math.sin(negAngle);
      const localY = dx * Math.sin(negAngle) + dy * Math.cos(negAngle);
      ctx.save();
      const alpha = Math.min(p.lifetime / 1.0, 1);
      ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(localX, localY, 3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();
    });
  }

  // draw() uses the global position.
  draw(ctx) {
    ctx.save();
    // No additional translation—drawing using global coordinates.
    this._drawShip(ctx);
    ctx.restore();
  }

  // drawAt() uses an effective (wrapped) x coordinate and provided y.
  // In this version, we draw the ship relative to its own local origin.
  drawAt(ctx, effectiveX, y) {
    ctx.save();
    // Translate to the effective drawing position.
    ctx.translate(effectiveX, y);
    // Apply the ship's rotation.
    ctx.rotate(degToRad(this.angle));
    
    // Draw the ship shape using its local coordinates (from this.points).
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = this.crashed ? "red" : "white";
    ctx.stroke();

    // Draw particles relative to the ship.
    this._drawParticlesRelative(ctx);
    
    ctx.restore();
  }

  // Applies main engine thrust.
  applyThrust(direction) {
    const thrust = 150 * 0.5; // Example thrust power.
    const rad = degToRad(this.angle);
    const localThrust = { x: 0, y: -thrust };
    const worldThrust = {
      x: localThrust.x * Math.cos(rad) - localThrust.y * Math.sin(rad),
      y: localThrust.x * Math.sin(rad) + localThrust.y * Math.cos(rad)
    };
    this.vel.x += worldThrust.x * (1 / 60);
    this.vel.y += worldThrust.y * (1 / 60);

    const engineOffset = (direction < 0) ? { x: -10, y: 10 } : { x: 10, y: 10 };
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad)
    };
    const torqueEffect = worldOffset.x * worldThrust.y - worldOffset.y * worldThrust.x;
    this.angularVel += (torqueEffect / 100) * (1 / 60);
  }

  // Applies pitch (rotational) thrust.
  applyPitchThrust(direction) {
    const thrust = 150 * 25;
    const rad = degToRad(this.angle);
    const localThrust = { x: 0, y: -thrust };
    const worldThrust = {
      x: localThrust.x * Math.cos(rad) - localThrust.y * Math.sin(rad),
      y: localThrust.x * Math.sin(rad) + localThrust.y * Math.cos(rad)
    };

    const engineOffset = (direction < 0) ? { x: -5, y: -20 } : { x: 5, y: -20 };
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad)
    };
    const torqueEffect = worldOffset.x * worldThrust.y - worldOffset.y * worldThrust.x;
    this.angularVel += (torqueEffect / 200) * (1 / 60);
  }

  // Emits particles from the main engine.
  emitParticles(direction) {
    const engineOffset = (direction < 0) ? { x: -10, y: 10 } : { x: 10, y: 10 };
    const rad = degToRad(this.angle);
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad)
    };
    const particlePos = {
      x: this.pos.x + worldOffset.x,
      y: this.pos.y + worldOffset.y
    };
    const particleAngle = degToRad(this.angle) + Math.PI + (Math.random() * 0.4 - 0.2);
    this.particles.push(new Particle(particlePos.x, particlePos.y, particleAngle));
  }

  // Emits particles from the top engine (for pitch adjustments).
  emitTopParticles(direction) {
    const engineOffset = (direction < 0) ? { x: -5, y: -20 } : { x: 5, y: -20 };
    const rad = degToRad(this.angle);
    const worldOffset = {
      x: engineOffset.x * Math.cos(rad) - engineOffset.y * Math.sin(rad),
      y: engineOffset.x * Math.sin(rad) + engineOffset.y * Math.cos(rad)
    };
    const particlePos = {
      x: this.pos.x + worldOffset.x,
      y: this.pos.y + worldOffset.y
    };
    const particleAngle = degToRad(this.angle) + Math.PI + (Math.random() * 0.4 - 0.2);
    this.particles.push(new Particle(particlePos.x, particlePos.y, particleAngle));
  }

  // Updates the rocket's physics and particles.
  update() {
    if (this.crashed || this.landed) return;
    // Apply base gravity.
    this.vel.y += 60 * (1 / 60);
    this.pos.x += this.vel.x * (1 / 60);
    this.pos.y += this.vel.y * (1 / 60);
    this.angle += this.angularVel * (1 / 60);
   
     // Normalize the angle to the range [-180, 180)
    this.angle = ((((this.angle + 180) % 360) + 360) % 360) - 180;

    // Dampen velocities and angular velocity.
    this.vel.x *= (1 - 0.1 * (1 / 60));
    this.vel.y *= (1 - 0.1 * (1 / 60));
    this.angularVel *= (1 - 0.2 * (1 / 60));

    // Update particles and filter out dead ones.
    this.particles = this.particles.filter(p => {
      p.update();
      return p.isAlive();
    });
  }
}