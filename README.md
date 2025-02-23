# Rocket Lander  
**Version 0.0.2**

Rocket Lander is a 2D physics-based game where the player pilots a rocket through challenging terrain to land safely on designated pads. In version 0.0.2, we introduce major architectural and gameplay improvements that lay the foundation for future levels and enhanced mechanics.

---

## Demo

A live demo of Rocket Lander is available at: [https://twinpictures.de/lander/](https://twinpictures.de/lander/)
Try it out to experience the looping terrain, dynamic camera modes, and landing-mode dashboard in action!

## New Features & Goals for Version 0.0.2

1. **Dynamic Camera:**
     - When the ship nears the left and right edges of the screen, the canvase transitions to a scrolling view.

2. **Continuous, Circular Terrain:**
   - The entire terrain for the level is generated at the start, forming a closed loop (a 360° planet).
   - As the player flies around, they eventually return to the initial landing pad, giving the impression of flying around a 2D planet.

3. **TODO: Different Landing Pad Types:**
   - **Standard (Takeoff & Landing) Pad:**  
     - Serves as both the starting pad and the landing pad.
   - **Underground Volcano Pads:**  
     - A surface crater pad integrated into the main terrain.
     - A deep underground volcano mode that switches to a separate “underground landing” canvas, offering a distinct, more complex landing scenario.
   - **Underground with Gate:**  
     - The landing pad is blocked by a gate that must be unlocked (by flying through a target or checkpoint) before landing is possible.
   - **Underground with Cave (Sideways Translation):**  
     - A challenging cave environment where the ship must translate sideways to align with the landing pad.

4. **TODO: Dynamic Gravity:**
   - When the rocket is near the surface, gravity remains constant.
   - As the ship flies higher above the terrain, gravity gradually decreases (using the conversion rate of 2 pixels = 1 meter).

5. **UI Separation:**
   - The UI elements (thruster buttons, end messages, etc.) are separated into a dedicated area at the bottom of the screen.
   - The gameplay area (or “window”) is distinct, so scrolling/zooming only affects the terrain and ship.

## Additional Enhancements

- **UI Minimapa Dashboard:**  
  - A dedicated minimap is now integrated into the bottom UI controls area.  
  - The minimap displays a representation of the planet and the position of the landing pad in relation to the ship along with telemetry information for a safe landing.

- **Modularized Code Structure:**  
  - The code has been refactored into separate modules for UI, terrain generation, ship (rocket) behavior, and utility functions. This modular design sets the stage for future levels and additional features.

---

## File Structure

To keep our code modular and maintainable, we've restructured the project as follows:
rocket-lander/
├── index.html          // Main HTML file with canvas and viewport settings.
├── css/
│   └── style.css       // CSS for styling the canvas, UI area, and overall layout.
├── assets/             // (Optional) Directory for images, audio, and other static resources.
├── js/
│   ├── main.js         // Entry point; bootstraps the game and handles global events (e.g., canvas resizing).
│   ├── game.js         // Contains the Game class, game loop, mode switching logic, and overall state management.
│   ├── ui.js           // Manages UI elements (buttons, end messages, target arrow, distance indicator).
│   ├── terrain.js      // Responsible for generating and drawing the full circular terrain and landing pad placement.
│   ├── ship.js         // Contains the Rocket (Ship) class with physics, controls, particle effects, and drawing routines.
│   ├── constants.js    // Defines shared configuration values (e.g., safe landing thresholds, TOTAL_TERRAIN_LENGTH).
│   └── utils.js        // Utility functions (e.g., degToRad, resizeCanvas) shared across modules.
└── README.md           // Project overview, goals for version 0.0.2, and file structure details.

### Module Descriptions

- **index.html:**  
  Sets up the full-screen canvas and includes links to the CSS and JavaScript files.

- **css/style.css:**  
  Contains styles ensuring the canvas fills the viewport, disables default touch callouts, and visually separates the UI from the gameplay area.

- **js/main.js:**  
  Initializes the canvas, handles window resize events, and creates an instance of the Game (from game.js).

- **js/game.js:**  
  Implements the core Game class that manages game states, mode transitions (static vs. scrolling/zoomed out), and the main loop.

- **js/ui.js:**  
  Contains functions and classes to manage UI elements like on-screen buttons, end messages, and the target arrow/distance indicator.

- **js/terrain.js:**  
  Generates a complete circular terrain for the level, including landing pad placement and wrap-around logic.

- **js/ship.js:**  
  Contains the Rocket (or Ship) class with its physics, control methods, particle effects, and drawing routines.

- **js/constants.js:**  
  Defines shared configuration values (e.g., safe landing thresholds, TOTAL_TERRAIN_LENGTH).

- **js/utils.js:**  
  Provides helper functions (like degToRad, canvas resizing, etc.) used throughout the project.

---

## Next Steps

- **Implement Mode Switching:**  
  Add a dynamic camera system that switches between a static view (normal flight/landing) and a scrolling/zoomed-out mode when the ship nears the edge.

- **Expand Terrain Generation:**  
  Modify `terrain.js` to create a continuous, circular terrain that wraps around, including various landing pad types and features.

- **Enhance Gameplay Physics:**  
  Update the ship's physics in `ship.js` to incorporate dynamic gravity based on altitude.

- **Separate UI and Gameplay:**  
  Move UI elements to `ui.js` so that the gameplay area (from `game.js` and `terrain.js`) and the UI area remain distinct.

- **Level Progression:**  
  Design additional levels with varying challenges that build on these mechanics.

---

## Conclusion

Version 0.0.2 lays the groundwork for a more dynamic, modular Rocket Lander game. With a complete circular terrain, dynamic camera modes, various landing pad types, and a clearly separated UI, we set the stage for advanced level designs and challenges in future updates.