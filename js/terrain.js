// terrain.js - Terrain generation for Rocket Lander (Version 0.0.2)
// version 0.0.1

import { getBaseSurfaceY } from "./ui.js";

export class Terrain {
  constructor() {
    this.points = [];
    this.landingPad = null;
    this.generateTerrain();
  }

  generateTerrain() {
    const SCREEN_WIDTH = window.SCREEN_WIDTH;
    const baseY = getBaseSurfaceY();
    let x = 0;
    while (x < SCREEN_WIDTH) {
      let y;
      // Place the landing pad roughly in the middle of the terrain
      if (x >= SCREEN_WIDTH / 3 && x <= SCREEN_WIDTH / 2) {
        y = baseY;
        this.landingPad = { start: x, end: x + 100 };
        x += 100;
      } else {
        y = baseY - (Math.random() * 50);
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
      ctx.strokeStyle = "white";
      ctx.stroke();
    }
    if (this.landingPad) {
      ctx.save();
      ctx.fillStyle = "yellow";
      const padY = getBaseSurfaceY();
      ctx.fillRect(this.landingPad.start, padY, this.landingPad.end - this.landingPad.start, 5);
      ctx.strokeStyle = "orange";
      ctx.lineWidth = 2;
      ctx.strokeRect(this.landingPad.start, padY, this.landingPad.end - this.landingPad.start, 5);
      ctx.restore();
    }
  }
}