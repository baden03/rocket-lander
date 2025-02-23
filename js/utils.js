// utils.js - Utility functions for Rocket Lander (Version 0.0.2)
// version 0.0.1

export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
  }
  
  export function radToDeg(radians) {
    return radians * (180 / Math.PI);
  }
  
  // Resize the canvas and update global variables (attached to window)
  export function resizeCanvas(canvas) {
    console.log("resizeCanvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    
    // Update globals on window object
    window.SCREEN_WIDTH = canvas.width;
    window.SCREEN_HEIGHT = canvas.height;
    
    // Call updateUIButtons if defined in ui.js (it will be attached to window later)
    if (typeof window.updateUIButtons === "function") {
      window.updateUIButtons();
    }
  }