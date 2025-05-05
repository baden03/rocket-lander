// buildingFactory.js - Factory for creating different styles of buildings

export class Building {
    constructor(x, y, width, height, isBlue, customDraw = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isBlue = isBlue;
        this.customDraw = customDraw;
        this.windowStyle = this.isBlue ? {
            size: 2,
            spacing: 6,
            probability: 0.5,
            color: 'rgba(255, 255, 255, 0.25)'
        } : {
            size: 4,
            spacing: 8,
            probability: 0.7,
            color: 'rgba(255, 255, 255, 0.3)'
        };
        this.style = this.isBlue ? {
            fill: 'rgba(41, 128, 185, 0.8)',
            stroke: 'rgba(25, 79, 115, 0.8)',
            lineWidth: 1
        } : {
            fill: '#e67e22',
            stroke: '#d35400',
            lineWidth: 2
        };
    }

    draw(ctx, x, y) {
        if (this.customDraw) {
            this.customDraw(ctx, x, y, this);
            return;
        }

        ctx.save();
        
        // Draw building body
        ctx.fillStyle = this.style.fill;
        ctx.fillRect(x, y - this.height, this.width, this.height);
        
        // Draw building outline
        ctx.strokeStyle = this.style.stroke;
        ctx.lineWidth = this.style.lineWidth;
        ctx.strokeRect(x, y - this.height, this.width, this.height);
        
        // Draw windows
        ctx.fillStyle = this.windowStyle.color;
        const windowsPerRow = Math.floor(this.width / this.windowStyle.spacing) - 1;
        const windowRows = Math.floor(this.height / this.windowStyle.spacing) - 1;
        
        for (let row = 0; row < windowRows; row++) {
            for (let col = 0; col < windowsPerRow; col++) {
                if (Math.random() < this.windowStyle.probability) {
                    ctx.fillRect(
                        x + (col + 1) * this.windowStyle.spacing,
                        y - this.height + (row + 1) * this.windowStyle.spacing,
                        this.windowStyle.size,
                        this.windowStyle.size
                    );
                }
            }
        }
        
        ctx.restore();
    }
}

export class BuildingFactory {
    static createStandardBuilding(x, y, isBlue = false) {
        const height = 30 + Math.random() * 100; // Random height between 30 and 130
        const width = 20 + Math.random() * 30;   // Random width between 20 and 50
        return new Building(x, y, width, height, isBlue);
    }

    static createTallBuilding(x, y, isBlue = false) {
        const height = 100 + Math.random() * 100; // Random height between 100 and 200
        const width = 15 + Math.random() * 20;    // Thinner width between 15 and 35
        return new Building(x, y, width, height, isBlue);
    }

    static createWideBuilding(x, y, isBlue = false) {
        const height = 20 + Math.random() * 40;   // Shorter height between 20 and 60
        const width = 40 + Math.random() * 40;    // Wider width between 40 and 80
        return new Building(x, y, width, height, isBlue);
    }

    static createSpireBuilding(x, y, isBlue = false) {
        const height = 120 + Math.random() * 80;  // Height between 120 and 200
        const baseWidth = 15 + Math.random() * 10; // Base width between 15 and 25
        
        const customDraw = (ctx, x, y, building) => {
            ctx.save();
            
            // Draw the spire (tapered rectangle)
            ctx.beginPath();
            ctx.fillStyle = building.style.fill;
            ctx.moveTo(x, y);
            ctx.lineTo(x + baseWidth, y);
            ctx.lineTo(x + (baseWidth * 0.7), y - height * 0.8); // Taper at 80% height
            ctx.lineTo(x + (baseWidth * 0.3), y - height * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = building.style.stroke;
            ctx.lineWidth = building.style.lineWidth;
            ctx.stroke();

            // Draw the ball at the top with dome style
            const ballRadius = baseWidth * 1.2;
            const ballCenterX = x + (baseWidth / 2);
            const ballCenterY = y - height + ballRadius * 0.1;
            
            // Draw ball base
            ctx.beginPath();
            ctx.arc(ballCenterX, ballCenterY, ballRadius, 0, Math.PI * 2);
            //ctx.fill();
            ctx.stroke();

            // Add dome highlight like in DomeCluster
            ctx.beginPath();
            ctx.arc(ballCenterX, ballCenterY, ballRadius * 0.8, Math.PI, 0);
            ctx.strokeStyle = building.windowStyle.color;
            ctx.stroke();
            ctx.strokeStyle = building.style.stroke;

            // Add windows around the ball using DomeCluster style
            const windowCount = 8;
            for (let i = 0; i < windowCount; i++) {
                if (Math.random() < 0.7) { // Same probability as DomeCluster
                    const angle = (i / windowCount) * Math.PI * 2;
                    const windowX = ballCenterX + Math.cos(angle) * ballRadius * 0.7;
                    const windowY = ballCenterY + Math.sin(angle) * ballRadius * 0.7;
                    
                    ctx.beginPath();
                    ctx.arc(
                        windowX,
                        windowY,
                        building.windowStyle.size,
                        0,
                        Math.PI * 2
                    );
                    ctx.fillStyle = building.windowStyle.color;
                    ctx.fill();
                }
            }

            // Add some window lights up the spire
            ctx.fillStyle = building.windowStyle.color;
            const spireWindowCount = Math.floor(height / 15);
            for (let i = 0; i < spireWindowCount; i++) {
                if (Math.random() < building.windowStyle.probability) {
                    const windowY = y - (i * 15);
                    const windowX = x + (baseWidth / 2);
                    ctx.beginPath();
                    ctx.arc(windowX, windowY, building.windowStyle.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        };

        return new Building(x, y, baseWidth, height, isBlue, customDraw);
    }

    static createPentHouseBuilding(x, y, isBlue = false) {
        const width = 30 + Math.random() * 40;       // Width between 30 and 70
        const shortHeight = 60 + Math.random() * 80;  // Shorter height between 60 and 140
        const heightDifference = 20 + Math.random() * 30;  // Difference in wall heights
        const tallSideRight = Math.random() < 0.5;   // Randomly choose which side is taller
        const totalHeight = shortHeight + heightDifference;
        
        const customDraw = (ctx, x, y, building) => {
            ctx.save();
            
            // Draw the entire building as a single polygon
            ctx.beginPath();
            ctx.fillStyle = building.style.fill;
            ctx.strokeStyle = building.style.stroke;
            ctx.lineWidth = building.style.lineWidth;

            // Start from bottom left
            ctx.moveTo(x, y);
            
            // Draw to bottom right
            ctx.lineTo(x + width, y);
            
            // Draw to top of taller side
            if (tallSideRight) {
                ctx.lineTo(x + width, y - totalHeight);  // Right side is taller
                ctx.lineTo(x, y - shortHeight);          // Left side is shorter
            } else {
                ctx.lineTo(x + width, y - shortHeight);  // Right side is shorter
                ctx.lineTo(x, y - totalHeight);          // Left side is taller
            }
            
            // Close the path back to start
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw windows
            ctx.fillStyle = building.windowStyle.color;
            const maxHeight = Math.max(shortHeight, totalHeight);
            const windowRows = Math.floor(maxHeight / building.windowStyle.spacing) - 1;
            const windowsPerRow = Math.floor(width / building.windowStyle.spacing) - 1;
            
            for (let row = 0; row < windowRows; row++) {
                const rowHeight = y - (row + 1) * building.windowStyle.spacing;
                const leftHeight = tallSideRight ? shortHeight : totalHeight;
                const rightHeight = tallSideRight ? totalHeight : shortHeight;
                
                // Calculate the maximum width for this row based on the sloped top
                for (let col = 0; col < windowsPerRow; col++) {
                    const windowX = x + (col + 1) * building.windowStyle.spacing;
                    const maxHeightAtX = leftHeight + (rightHeight - leftHeight) * (windowX - x) / width;
                    
                    // Only draw window if it's below the sloped top
                    if (y - rowHeight < maxHeightAtX && Math.random() < building.windowStyle.probability) {
                        ctx.fillRect(
                            windowX,
                            rowHeight,
                            building.windowStyle.size,
                            building.windowStyle.size
                        );
                    }
                }
            }

            ctx.restore();
        };

        return new Building(x, y, width, totalHeight, isBlue, customDraw);
    }

    static createDomeTower(x, y, isBlue = false) {
        const baseWidth = 40 + Math.random() * 30;    // Base width between 40 and 70
        const height = 100 + Math.random() * 120;     // Height between 100 and 220
        const domeRadius = baseWidth * 0.5;           // Dome size proportional to base
        const supportTowerWidth = baseWidth * 0.3;    // Thin support tower
        
        // Pre-calculate beam light positions
        const beamLights = [];
        const beamCount = 3;
        const flowPoints = 5;
        
        for (let i = 1; i <= beamCount; i++) {
            const beamY = i * (height / (beamCount + 1));
            const lights = [];
            for (let j = 0; j < flowPoints; j++) {
                if (Math.random() < 0.7) {
                    lights.push(j);
                }
            }
            beamLights.push({ y: beamY, points: lights });
        }
        
        // Pre-calculate dome windows
        const windowCount = 8;
        const domeWindows = [];
        for (let i = 0; i < windowCount; i++) {
            if (Math.random() < 0.7) {
                domeWindows.push(i);
            }
        }
        
        const customDraw = (ctx, x, y, building) => {
            ctx.save();
            
            // Draw the main support tower
            ctx.fillStyle = building.style.fill;
            ctx.strokeStyle = building.style.stroke;
            ctx.lineWidth = building.style.lineWidth;
            
            // Central support tower
            const towerX = x + (baseWidth - supportTowerWidth) / 2;
            ctx.fillRect(towerX, y - height, supportTowerWidth, height);
            ctx.strokeRect(towerX, y - height, supportTowerWidth, supportTowerWidth);

            // Draw connecting support beams
            ctx.beginPath();
            const beamSpacing = height / (beamCount + 1);
            beamLights.forEach(beam => {
                const beamY = y - beam.y;
                ctx.moveTo(x, beamY);
                ctx.lineTo(x + baseWidth, beamY);
            });
            ctx.stroke();

            // Draw the dome at the top
            const centerX = x + baseWidth / 2;
            const centerY = y - (height + domeRadius);
            
            // Draw dome base
            ctx.beginPath();
            ctx.arc(centerX, centerY, domeRadius, 0, Math.PI * 2);
            //ctx.fill();
            ctx.stroke();

            // Draw dome highlight (like in DomeCluster)
            ctx.beginPath();
            ctx.arc(centerX, centerY, domeRadius * 0.8, Math.PI, 0);
            ctx.strokeStyle = building.windowStyle.color;
            ctx.stroke();
            ctx.strokeStyle = building.style.stroke;

            // Add pre-calculated windows around the dome (like in DomeCluster)
            domeWindows.forEach(windowIndex => {
                const angle = (windowIndex / windowCount) * Math.PI * 2;
                const windowX = centerX + Math.cos(angle) * domeRadius * 0.7;
                const windowY = centerY + Math.sin(angle) * domeRadius * 0.7;
                
                ctx.beginPath();
                ctx.arc(
                    windowX,
                    windowY,
                    building.windowStyle.size,
                    0,
                    Math.PI * 2
                );
                ctx.fillStyle = building.windowStyle.color;
                ctx.fill();
            });

            // Draw beam lights
            const windowSize = 4;
            beamLights.forEach(beam => {
                beam.points.forEach(j => {
                    const pointX = x + (j + 1) * (baseWidth / (flowPoints + 1));
                    ctx.fillRect(
                        pointX - windowSize/2,
                        y - beam.y - windowSize/2,
                        windowSize,
                        windowSize
                    );
                });
            });

            ctx.restore();
        };

        return new Building(x, y, baseWidth, height, isBlue, customDraw);
    }

    static createLAXBuilding(x, y, isBlue = false) {
        const baseWidth = 120 + Math.random() * 40;     // Base width between 80 and 120
        const height = 100 + Math.random() * 30;        // Height between 70 and 100
        const archThickness = 8;                       // Thickness of the support arches
        
        const customDraw = (ctx, x, y, building) => {
            ctx.save();
            
            const centerX = x + baseWidth / 2;
            const centerY = y - height / 2;
            const archRadius = baseWidth * 0.4;        // Radius of the arches
            const centralDiskRadius = baseWidth * 0.2; // Size of the central suspended structure
            
            ctx.fillStyle = building.style.fill;
            ctx.strokeStyle = building.style.stroke;
            ctx.lineWidth = building.style.lineWidth;

            // Draw the base platform
            const baseHeight = 10;
            ctx.fillRect(x, y - baseHeight, baseWidth, baseHeight);
            ctx.strokeRect(x, y - baseHeight, baseWidth, baseHeight);

            // Draw the crossed arches
            // First arch (left to right)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
                centerX, y - height,
                x + baseWidth, y
            );
            ctx.lineTo(x + baseWidth + archThickness, y);
            ctx.quadraticCurveTo(
                centerX + archThickness, y - height + archThickness,
                x - archThickness, y
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Second arch (right to left)
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.quadraticCurveTo(
                centerX, y - height,
                x + baseWidth, y
            );
            ctx.lineTo(x + baseWidth - archThickness, y);
            ctx.quadraticCurveTo(
                centerX - archThickness, y - height - archThickness,
                x + archThickness, y
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Draw the central suspended disk structure with dome style
            ctx.beginPath();
            ctx.arc(centerX, centerY, centralDiskRadius, 0, Math.PI * 2);
            //ctx.fill();
            ctx.stroke();

            // Add dome highlight like in DomeCluster
            ctx.beginPath();
            ctx.arc(centerX, centerY, centralDiskRadius * 0.8, Math.PI, 0);
            ctx.strokeStyle = building.windowStyle.color;
            ctx.stroke();
            ctx.strokeStyle = building.style.stroke;

            // Add windows around the disk using the same style as DomeCluster
            const windowCount = 8;
            for (let i = 0; i < windowCount; i++) {
                if (Math.random() < 0.7) { // Same probability as DomeCluster
                    const angle = (i / windowCount) * Math.PI * 2;
                    const windowX = centerX + Math.cos(angle) * centralDiskRadius * 0.7;
                    const windowY = centerY + Math.sin(angle) * centralDiskRadius * 0.7;
                    
                    ctx.beginPath();
                    ctx.arc(
                        windowX,
                        windowY,
                        building.windowStyle.size,
                        0,
                        Math.PI * 2
                    );
                    ctx.fillStyle = building.windowStyle.color;
                    ctx.fill();
                }
            }

            // Add support cables from arches to disk
            ctx.beginPath();
            const cableCount = 8;
            for (let i = 0; i < cableCount; i++) {
                const angle = (i / cableCount) * Math.PI * 2;
                const outerX = centerX + Math.cos(angle) * archRadius;
                const outerY = centerY + Math.sin(angle) * archRadius;
                
                ctx.moveTo(centerX + Math.cos(angle) * centralDiskRadius,
                          centerY + Math.sin(angle) * centralDiskRadius);
                ctx.lineTo(outerX, outerY);
            }
            ctx.strokeStyle = building.style.stroke;
            ctx.stroke();

            // Add glow effects along the arches
            const gradient = ctx.createLinearGradient(x, y, x + baseWidth, y);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.5, building.windowStyle.color);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - baseHeight/2);
            ctx.quadraticCurveTo(centerX, y - height, x + baseWidth, y - baseHeight/2);
            ctx.stroke();

            ctx.restore();
        };

        return new Building(x, y, baseWidth, height, isBlue, customDraw);
    }

    static createDomeCluster(x, y, isBlue = false) {
        const baseWidth = 80 + Math.random() * 40;    // Base width between 80 and 120
        const height = 60 + Math.random() * 40;       // Height between 60 and 100
        const domeCount = 3 + Math.random() * 2 | 0;  // 3-4 domes
        
        // Pre-calculate dome positions and sizes once during creation
        const domes = [];
        const minDomeRadius = 15;
        const maxDomeRadius = 25;
        
        for (let i = 0; i < domeCount; i++) {
            const radius = minDomeRadius + Math.random() * (maxDomeRadius - minDomeRadius);
            // Store relative positions instead of absolute
            const relativeX = (i * baseWidth/(domeCount-0.5)) + radius;
            const relativeY = radius + (Math.random() * height * 0.3);
            // Pre-calculate window positions for each dome
            const windowCount = 8;
            const windows = [];
            for (let j = 0; j < windowCount; j++) {
                if (Math.random() < 0.7) {
                    windows.push(j);
                }
            }
            domes.push({ relativeX, relativeY, radius, windows });
        }
        
        const customDraw = (ctx, x, y, building) => {
            ctx.save();
            
            ctx.fillStyle = building.style.fill;
            ctx.strokeStyle = building.style.stroke;
            ctx.lineWidth = building.style.lineWidth;

            // Draw connecting tunnels between domes
            ctx.beginPath();
            for (let i = 0; i < domes.length - 1; i++) {
                const current = domes[i];
                const next = domes[i + 1];
                
                // Calculate absolute positions for current drawing
                const currentX = x + current.relativeX;
                const currentY = y - current.relativeY;
                const nextX = x + next.relativeX;
                const nextY = y - next.relativeY;
                
                // Calculate tunnel control points for curve
                const midX = (currentX + nextX) / 2;
                const midY = Math.min(currentY, nextY) - 10;
                
                // Draw curved tunnel
                ctx.moveTo(currentX, currentY);
                ctx.quadraticCurveTo(midX, midY, nextX, nextY);
            }
            ctx.lineWidth = 10;
            ctx.stroke();
            ctx.lineWidth = building.style.lineWidth;

            // Draw the domes using calculated absolute positions
            domes.forEach(dome => {
                const domeX = x + dome.relativeX;
                const domeY = y - dome.relativeY;
                
                // Draw dome base
                ctx.beginPath();
                ctx.arc(domeX, domeY, dome.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Draw dome highlight
                ctx.beginPath();
                ctx.arc(domeX, domeY, dome.radius * 0.8, Math.PI, 0);
                ctx.strokeStyle = building.windowStyle.color;
                ctx.stroke();
                ctx.strokeStyle = building.style.stroke;

                // Add pre-calculated windows/lights around the dome
                dome.windows.forEach(windowIndex => {
                    const angle = (windowIndex / 8) * Math.PI * 2;
                    const windowX = domeX + Math.cos(angle) * dome.radius * 0.7;
                    const windowY = domeY + Math.sin(angle) * dome.radius * 0.7;
                    
                    ctx.beginPath();
                    ctx.arc(
                        windowX,
                        windowY,
                        building.windowStyle.size,
                        0,
                        Math.PI * 2
                    );
                    ctx.fillStyle = building.windowStyle.color;
                    ctx.fill();
                });

                // Draw support structure beneath each dome
                ctx.beginPath();
                ctx.moveTo(domeX - dome.radius * 0.5, y);
                ctx.lineTo(domeX + dome.radius * 0.5, y);
                ctx.lineTo(domeX + dome.radius * 0.3, domeY + dome.radius);
                ctx.lineTo(domeX - dome.radius * 0.3, domeY + dome.radius);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });

            ctx.restore();
        };

        return new Building(x, y, baseWidth, height, isBlue, customDraw);
    }

    static createPooBuilding(x, y, isBlue = false) {
        const baseWidth = 60 + Math.random() * 20;    // Base width between 60 and 80
        const height = 80 + Math.random() * 30;       // Height between 80 and 110
        
        const customDraw = (ctx, x, y, building) => {
            ctx.save();
            
            // Use brown colors for orange buildings, blue tints for blue buildings
            const mainColor = building.isBlue ? building.style.fill : '#8B4513';
            const outlineColor = building.isBlue ? building.style.stroke : '#654321';
            const highlightColor = building.isBlue ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)';
            
            const centerX = x + baseWidth / 2;
            const baseY = y;
            const topY = y - height;
            
            // Draw main body (poo shape) with three stacked segments
            ctx.fillStyle = mainColor;
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = building.style.lineWidth;

            // Bottom segment (largest)
            ctx.beginPath();
            ctx.moveTo(x + baseWidth * 0.2, baseY);
            ctx.bezierCurveTo(
                x, baseY - height * 0.2,
                x, baseY - height * 0.4,
                centerX, baseY - height * 0.3
            );
            ctx.bezierCurveTo(
                x + baseWidth, baseY - height * 0.4,
                x + baseWidth, baseY - height * 0.2,
                x + baseWidth * 0.8, baseY
            );
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Middle segment
            ctx.beginPath();
            ctx.moveTo(x + baseWidth * 0.25, baseY - height * 0.25);
            ctx.bezierCurveTo(
                x + baseWidth * 0.1, baseY - height * 0.4,
                x + baseWidth * 0.1, baseY - height * 0.6,
                centerX, baseY - height * 0.5
            );
            ctx.bezierCurveTo(
                x + baseWidth * 0.9, baseY - height * 0.6,
                x + baseWidth * 0.9, baseY - height * 0.4,
                x + baseWidth * 0.75, baseY - height * 0.25
            );
            ctx.fill();
            ctx.stroke();

            // Top segment with swirl
            ctx.beginPath();
            ctx.moveTo(x + baseWidth * 0.3, baseY - height * 0.45);
            // Spiral to the peak
            ctx.bezierCurveTo(
                x + baseWidth * 0.2, baseY - height * 0.7,
                x + baseWidth * 0.4, baseY - height * 0.9,
                centerX, baseY - height * 0.8
            );
            ctx.bezierCurveTo(
                x + baseWidth * 0.6, baseY - height * 0.9,
                x + baseWidth * 0.8, baseY - height * 0.7,
                x + baseWidth * 0.7, baseY - height * 0.45
            );
            ctx.fill();
            ctx.stroke();

            // Add glossy highlights
            ctx.fillStyle = highlightColor;
            // Main highlight
            ctx.beginPath();
            ctx.ellipse(
                centerX - baseWidth * 0.15,
                baseY - height * 0.5,
                baseWidth * 0.15,
                height * 0.15,
                Math.PI / 4,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Small highlight
            ctx.beginPath();
            ctx.ellipse(
                centerX - baseWidth * 0.1,
                baseY - height * 0.7,
                baseWidth * 0.08,
                height * 0.08,
                Math.PI / 4,
                0,
                Math.PI * 2
            );
            ctx.fill();

            // Draw face
            const faceY = baseY - height * 0.45;
            const eyeSpacing = baseWidth * 0.15;
            
            // Eyes (slightly larger and more expressive)
            ctx.fillStyle = outlineColor;
            // Left eye
            ctx.beginPath();
            ctx.arc(centerX - eyeSpacing, faceY, 4, 0, Math.PI * 2);
            ctx.fill();
            // Right eye
            ctx.beginPath();
            ctx.arc(centerX + eyeSpacing, faceY, 4, 0, Math.PI * 2);
            ctx.fill();
            
            // Smile (more curved and cheerful)
            ctx.beginPath();
            ctx.lineWidth = building.style.lineWidth * 1.5;
            ctx.arc(centerX, faceY + 8, 10, 0, Math.PI);
            ctx.stroke();

            ctx.restore();
        };

        return new Building(x, y, baseWidth, height, isBlue, customDraw);
    }

    static createRandomBuilding(x, y, isBlue = false) {
        const styles = [
            this.createStandardBuilding,
            this.createTallBuilding,
            this.createWideBuilding,
            this.createSpireBuilding,
            this.createPentHouseBuilding,
            this.createDomeTower,
            this.createLAXBuilding,
            this.createDomeCluster,
            this.createPooBuilding
        ];
        const randomStyle = styles[Math.floor(Math.random() * styles.length)];
        return randomStyle.call(this, x, y, isBlue);
    }
} 