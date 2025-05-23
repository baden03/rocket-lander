// terrain.js - Updated terrain drawing for a looping terrain
// version 0.0.2

import { getBaseSurfaceY } from "./ui.js";
import { BuildingFactory, Building } from "./buildingFactory.js";
export const TOTAL_TERRAIN_LENGTH = 10000; // Total horizontal length

export class Terrain {
  constructor() {
    this.points = [];
    this.landingPad = null; // { start, end }
    this.buildings = []; // Array to store cityscape buildings
    this.lowestTerrainPoint = getBaseSurfaceY();
    this.generateTerrain();
    this.generateCityscape();
  }

  generateTerrain() {
    console.log("generateTerrain");
    const baseY = getBaseSurfaceY();
    let x = 0;
    this.lowestTerrainPoint = baseY;
    
    while (x < TOTAL_TERRAIN_LENGTH) {
      let y;
      // Place a landing pad between 900 and 1100 world units (only once)
      if (x >= 900 && x < 1100 && !this.landingPad) {
        y = baseY;
        this.landingPad = { start: 950, end: 1050 };
        x += 100; // Skip over landing pad area
      } else {
        y = baseY - (Math.random() * 50 - 25);
        // Update lowest point if this point is lower
        if (y > this.lowestTerrainPoint) {
          this.lowestTerrainPoint = y;
        }
        x += 10 + Math.random() * 30;
      }
      this.points.push({ x, y });
    }
    // Close the loop by appending a point at TOTAL_TERRAIN_LENGTH with same y as first point.
    if (this.points.length > 0) {
      const firstPoint = this.points[0];
      this.points.push({ x: TOTAL_TERRAIN_LENGTH, y: firstPoint.y });
    }
    //console.log(this.landingPad);
  }

  generateCityscape() {
    // Clear existing buildings
    this.buildings = [];
    
    // Generate buildings across the terrain
    let x = 0;
    while (x < TOTAL_TERRAIN_LENGTH) {
        // Skip the landing pad area
        if (!(x >= 850 && x <= 1150)) {
            // Random chance to place a building
            if (Math.random() < 0.3) {
                // Randomize color with varying probabilities
                const isBlue = Math.random() < 0.4; // 40% chance for blue buildings
                
                // Use the BuildingFactory's random building generator
                const building = BuildingFactory.createRandomBuilding(x, this.lowestTerrainPoint, isBlue);
                this.buildings.push(building);
            }
        }
        x += 60 + Math.random() * 40; // Space between potential building positions
    }
  }

  getTerrainHeightAt(x) {
    // Find the terrain height at a given x position
    for (let i = 1; i < this.points.length; i++) {
      if (this.points[i].x > x) {
        const prev = this.points[i - 1];
        const curr = this.points[i];
        const t = (x - prev.x) / (curr.x - prev.x);
        return prev.y + (curr.y - prev.y) * t;
      }
    }
    return getBaseSurfaceY();
  }

  // Draw the terrain given a horizontal camera offset.
  // We draw three copies (for i = -1, 0, 1) to cover the visible range.
  draw(ctx, cameraOffsetX = 0, cameraOffsetY = 0) {
    for (let i = -1; i <= 1; i++) {
      // First draw the terrain
      ctx.beginPath();
      for (let j = 0; j < this.points.length; j++) {
        const point = this.points[j];
        const worldX = point.x + i * TOTAL_TERRAIN_LENGTH;
        const screenX = worldX - cameraOffsetX;
        const screenY = point.y - cameraOffsetY;
        if (j === 0) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }
      ctx.strokeStyle = "white";
      ctx.stroke();
    }
    
    // Draw the landing pad on all copies.
    if (this.landingPad) {
      const padWidth = this.landingPad.end - this.landingPad.start;
      const padY = getBaseSurfaceY() - cameraOffsetY;
      for (let i = -1; i <= 1; i++) {
        const padScreenX = this.landingPad.start + i * TOTAL_TERRAIN_LENGTH - cameraOffsetX;
        ctx.save();
        ctx.fillStyle = "yellow";
        ctx.fillRect(padScreenX, padY, padWidth, 5);
        ctx.strokeStyle = "orange";
        ctx.lineWidth = 2;
        ctx.strokeRect(padScreenX, padY, padWidth, 5);
        ctx.restore();
      }
    }

    // Draw orange buildings in front
    for (let i = -1; i <= 1; i++) {
      this.buildings.forEach(building => {
        if (building.isBlue) return;
        const buildingX = building.x + i * TOTAL_TERRAIN_LENGTH - cameraOffsetX;
        const buildingY = building.y - cameraOffsetY;
        building.draw(ctx, buildingX, buildingY);
      });
    }
  }

  drawSecondary(ctx, cameraOffsetX, cameraOffsetY, rocketPosY = 0) {
    // Constants for the dynamic vertical offset.
    const minSecondaryVerticalOffset = 50;   // When near the terrain.
    const maxSecondaryVerticalOffset = 200;    // When very high above the terrain.
    const effectThreshold = 300;              // Height above which the effect is noticeable.
    const maxPossibleHeight = 1000;            // Height above terrain at which the offset reaches its maximum.
    
    // Compute the rocket's height above the terrain.
    // getBaseSurfaceY() returns the global y-coordinate of the terrain's base.
    // When the rocket is above the terrain, (getBaseSurfaceY() - this.rocket.pos.y) will be positive.
    const heightAboveTerrain = Math.max( getBaseSurfaceY() - rocketPosY, 0);
    
    // Clamp the interpolation factor between 0 and 1.
    const t = Math.min(heightAboveTerrain / maxPossibleHeight, 1);
    
    // Interpolate between the minimum and maximum vertical offsets.
    let dynamicSecondaryVerticalOffset = minSecondaryVerticalOffset + 
      (maxSecondaryVerticalOffset - minSecondaryVerticalOffset) * t;
    
    // Only apply the effect if the rocket is at least 'effectThreshold' above the terrain.
    if (heightAboveTerrain > effectThreshold) {
      // Calculate effective height above the threshold.
      const effectiveHeight = heightAboveTerrain - effectThreshold;
      // Compute interpolation factor t (clamped between 0 and 1).
      const t = Math.min(effectiveHeight / (maxPossibleHeight - effectThreshold), 1);
      // Interpolate between the minimum and maximum offsets.
      dynamicSecondaryVerticalOffset = minSecondaryVerticalOffset +
        (maxSecondaryVerticalOffset - minSecondaryVerticalOffset) * t;
    }
    else{
      dynamicSecondaryVerticalOffset = minSecondaryVerticalOffset;
    }

    // Constants for horizontal parallax.
    const SECONDARY_SPEED_FACTOR = 0.5;    // Secondary layer moves at 50% of the main camera's speed.
    const SCALE_X = 0.5;                   // Secondary terrain is half as wide.
    const secondaryTerrainLength = TOTAL_TERRAIN_LENGTH * SCALE_X;
    
    // Adjust the horizontal offset for parallax.
    const adjustedCameraOffsetX = cameraOffsetX * SECONDARY_SPEED_FACTOR;
    
    // Draw the secondary terrain first
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      for (let j = 0; j < this.points.length; j++) {
        const point = this.points[j];
        const scaledX = point.x * SCALE_X;
        const worldX = scaledX + i * secondaryTerrainLength;
        const screenX = worldX - adjustedCameraOffsetX;
        const screenY = (point.y - dynamicSecondaryVerticalOffset) - cameraOffsetY;
        
        if (j === 0) {
          ctx.moveTo(screenX, screenY);
        } else {
          ctx.lineTo(screenX, screenY);
        }
      }
      ctx.strokeStyle = "#777777";
      ctx.stroke();

      // Draw blue buildings in the background with parallax effect
      this.buildings.forEach(building => {
        if (!building.isBlue) return;
        const buildingX = (building.x * SCALE_X) + i * secondaryTerrainLength - adjustedCameraOffsetX;
        const buildingY = (building.y - dynamicSecondaryVerticalOffset) - cameraOffsetY;
        
        ctx.save();
        // Scale the context for the building
        ctx.scale(SCALE_X, SCALE_X);
        // Convert coordinates back to unscaled space
        const unscaledX = buildingX / SCALE_X;
        const unscaledY = buildingY / SCALE_X;
        // Draw using original building's draw function
        building.draw(ctx, unscaledX, unscaledY);
        ctx.restore();
      });
    }
  }
}