// terrain.js - Updated terrain drawing for a looping terrain

import { getBaseSurfaceY } from "./ui.js";
export const TOTAL_TERRAIN_LENGTH = 5000; // Total horizontal length

export class Terrain {
  constructor() {
    this.points = [];
    this.landingPad = null; // { start, end }
    this.generateTerrain();
  }

  generateTerrain() {
    console.log("generateTerrain");
    const baseY = getBaseSurfaceY();
    let x = 0;
    while (x < TOTAL_TERRAIN_LENGTH) {
      let y;
      // Place a landing pad between 900 and 1100 world units (only once)
      if (x >= 900 && x < 1100 && !this.landingPad) {
        y = baseY;
        this.landingPad = { start: 950, end: 1050 };
        x += 100; // Skip over landing pad area
      } else {
        y = baseY - (Math.random() * 50 - 25);
        x += 10 + Math.random() * 30;
      }
      this.points.push({ x, y });
    }
    // Close the loop by appending a point at TOTAL_TERRAIN_LENGTH with same y as first point.
    if (this.points.length > 0) {
      const firstPoint = this.points[0];
      this.points.push({ x: TOTAL_TERRAIN_LENGTH, y: firstPoint.y });
    }
  }

  // Draw the terrain given a horizontal camera offset.
  // We draw three copies (for i = -1, 0, 1) to cover the visible range.
  draw(ctx, cameraOffsetX = 0) {
    const SCREEN_WIDTH = window.SCREEN_WIDTH;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      for (let j = 0; j < this.points.length; j++) {
        let point = this.points[j];
        // Shift each copy by i * TOTAL_TERRAIN_LENGTH
        let worldX = point.x + i * TOTAL_TERRAIN_LENGTH;
        // Compute screen position relative to camera offset.
        let screenX = worldX - cameraOffsetX;
        if (j === 0) {
          ctx.moveTo(screenX, point.y);
        } else {
          ctx.lineTo(screenX, point.y);
        }
      }
      ctx.strokeStyle = "white";
      ctx.stroke();
    }
    
    // Draw the landing pad on all copies.
    if (this.landingPad) {
      const padWidth = this.landingPad.end - this.landingPad.start;
      const padY = getBaseSurfaceY();
      for (let i = -1; i <= 1; i++) {
        let padScreenX = this.landingPad.start + i * TOTAL_TERRAIN_LENGTH - cameraOffsetX;
        ctx.save();
        ctx.fillStyle = "yellow";
        ctx.fillRect(padScreenX, padY, padWidth, 5);
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        ctx.strokeRect(padScreenX, padY, padWidth, 5);
        ctx.restore();
      }
    }
  }
}