// ship.js - Defines the Rocket class for Rocket Lander (Version 0.0.2)
// version 0.0.1

import { degToRad } from "./utils.js";

// You may later import Particle from a separate module if desired.
// For now, we'll define it inline in this module if needed.

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
    this.vel.y += 60 * (1 / 60); // Base gravity; refined in game.js
    this.lifetime -= (1 / 60);
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

export class Rocket {
  constructor(x, y) {
    this.pos = { x, y };
    this.vel = { x: 0, y: 0 };
    this.angle = 0;
    this.angularVel = 0;
    this.particles = [];
    this.crashed = false;
    this.landed = false;
    // Define rocket shape in local coordinates
    this.points = [
      { x: 0, y: -20 },
      { x: 10, y: 10 },
      { x: -10, y: 10 }
    ];
  }

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

  applyThrust(direction) {
    const thrust = 150 * 0.5; // Using THRUST_POWER = 150
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

  update() {
    if (this.crashed || this.landed) return;
    // Use base gravity (60) for now; actual effective gravity is computed in game.js
    this.vel.y += 60 * (1 / 60);
    this.pos.x += this.vel.x * (1 / 60);
    this.pos.y += this.vel.y * (1 / 60);
    this.angle += this.angularVel * (1 / 60);

    this.vel.x *= (1 - 0.1 * (1 / 60));
    this.vel.y *= (1 - 0.1 * (1 / 60));
    this.angularVel *= (1 - 0.2 * (1 / 60));

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
    ctx.strokeStyle = this.crashed ? "red" : "white";
    ctx.stroke();
    ctx.restore();
  }
}