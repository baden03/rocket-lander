import pygame
import math
import random
from typing import List, Tuple, Optional
import sys

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 1280
SCREEN_HEIGHT = 720
"""
info = pygame.display.Info()
SCREEN_WIDTH = info.current_w
SCREEN_HEIGHT = info.current_h
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
"""
FPS = 60
DT = 1 / FPS

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)
GRAY = (100, 100, 100)

# Physics constants
GRAVITY = 60.0
THRUST_POWER = 150.0
TORQUE = 200.0
DRAG = 0.1
ANGULAR_DRAG = 0.2
SAFE_LANDING_VELOCITY = 50.0
SAFE_LANDING_ANGLE = 20.0

class Particle:
    def __init__(self, x: float, y: float, angle: float):
        self.pos = pygame.Vector2(x, y)
        speed = random.uniform(50, 100)
        self.vel = pygame.Vector2(
            math.cos(angle) * speed,
            math.sin(angle) * speed
        )
        self.lifetime = random.uniform(0.2, 0.5)
        self.color = YELLOW

    def update(self):
        self.pos += self.vel * DT
        self.vel.y += GRAVITY * DT
        self.lifetime -= DT
        
    def is_alive(self) -> bool:
        return self.lifetime > 0

    def draw(self, screen: pygame.Surface):
        alpha = int((self.lifetime * 255) / 0.5)
        color = (*self.color, alpha)
        pygame.draw.circle(screen, color, self.pos, 2)

class Rocket:
    def __init__(self, x: float, y: float):
        self.pos = pygame.Vector2(x, y)
        self.vel = pygame.Vector2(0, 0)
        self.angle = 0  # degrees
        self.angular_vel = 0
        self.particles: List[Particle] = []
        self.crashed = False
        self.landed = False
        
        # Create rocket shape
        self.points = [
            pygame.Vector2(0, -20),   # nose
            pygame.Vector2(10, 10),   # bottom right
            pygame.Vector2(-10, 10)   # bottom left
        ]

    def handle_input(self, keys: pygame.key.ScancodeWrapper):
        if self.crashed or self.landed:
            return

        # Bottom thrusters for vertical movement:
        if keys[pygame.K_LEFT] or keys[pygame.K_LSHIFT]:
            self.apply_thrust(-1)
            self.emit_particles(-1)
        if keys[pygame.K_RIGHT] or keys[pygame.K_RSHIFT]:
            self.apply_thrust(1)
            self.emit_particles(1)
        
        # Top thrusters for pitch control (only apply torque):
        if keys[pygame.K_q]:
            self.apply_pitch_thrust(-1)
            self.emit_top_particles(-1)
        if keys[pygame.K_e]:
            self.apply_pitch_thrust(1)
            self.emit_top_particles(1)

    def apply_thrust(self, direction: int):
        """
        Apply thrust from a single engine.
        direction: -1 for left engine, +1 for right engine.
        """
        # When a single engine is fired, we use half thrust.
        local_thrust = pygame.Vector2(0, -THRUST_POWER * 0.5)
        # Rotate the local thrust vector by the current angle so it always points "up" from the ship's perspective.
        world_thrust = local_thrust.rotate(self.angle)
        
        # Apply the thrust force to the rocket's velocity.
        self.vel += world_thrust * DT

        # Define the engine's offset in local coordinates.
        # Adjust these values to match your ship's design. Here, left engine is at (-10, 10), right at (10, 10).
        if direction < 0:
            engine_offset = pygame.Vector2(-10, 10)
        else:
            engine_offset = pygame.Vector2(10, 10)
        
        # Rotate the engine offset so it is correctly positioned in world space relative to the ship.
        world_offset = engine_offset.rotate(self.angle)
        
        # Calculate torque using the 2D cross product between the engine offset and the thrust force.
        # This gives a scalar torque value: torque = offset.x * force.y - offset.y * force.x.
        torque_effect = world_offset.x * world_thrust.y - world_offset.y * world_thrust.x

        # Apply the torque to adjust the angular velocity.
        # The divisor (100.0) is a tuning parameter to control the strength of the rotation.
        self.angular_vel += (torque_effect / 100.0) * DT

    def apply_pitch_thrust(self, direction: int):
        """
        Apply pitch thrust from a top thruster.
        direction: -1 for left top thruster, +1 for right top thruster.
        This function applies torque only (no net linear force).
        """
        # Define a local thrust vector that will generate torque.
        # Here we use the same magnitude as a single bottom engine, but you can adjust if needed.
        # local_thrust = pygame.Vector2(0, -THRUST_POWER * 0.5)
        local_thrust = pygame.Vector2(0, -THRUST_POWER * 25)
        # Rotate it so it’s in world-space relative to the rocket's current orientation.
        world_thrust = local_thrust.rotate(self.angle)
        
        # Define the engine offset for top thrusters in the rocket's local coordinate system.
        # These should be positioned at the top of the rocket.
        if direction < 0:
            # Left top thruster (adjust as necessary)
            engine_offset = pygame.Vector2(-5, -20)
        else:
            # Right top thruster
            engine_offset = pygame.Vector2(5, -20)
        
        # Rotate the offset into world coordinates.
        world_offset = engine_offset.rotate(self.angle)
        
        # Compute the torque from the cross product:
        # torque = offset.x * force.y - offset.y * force.x
        torque_effect = world_offset.x * world_thrust.y - world_offset.y * world_thrust.x
        
        # Apply the torque (tuning factor of 100.0; adjust as needed)
        self.angular_vel += (torque_effect / 200.0) * DT

        # NOTE: We do not add to self.vel so that the pitch thrusters produce no net linear acceleration.

    def emit_particles(self, direction: int):
        """
        Emit particles from the bottom thrusters.
        direction: -1 for left thruster, +1 for right thruster.
        """
        # Define the engine offset in local coordinates for bottom thrusters.
        # These values should match the positions of your bottom thrusters.
        if direction < 0:
            engine_offset = pygame.Vector2(-10, 10)
        else:
            engine_offset = pygame.Vector2(10, 10)
        
        # Rotate the engine offset by the rocket's current angle.
        world_offset = engine_offset.rotate(self.angle)
        
        # Calculate the world position for the particles.
        particle_pos = self.pos + world_offset
        
        # Determine the particle emission angle:
        # Particles emit opposite to the thrust direction, with a bit of random variation.
        particle_angle = math.radians(self.angle) + math.pi + random.uniform(-0.2, 0.2)
        
        # Create and add the particle.
        self.particles.append(Particle(particle_pos.x, particle_pos.y, particle_angle))

    def emit_top_particles(self, direction: int):
        """
        Emit particles from the top thrusters.
        direction: -1 for left top thruster, +1 for right top thruster.
        """
        # Compute the offset for top thrusters in local coordinates.
        if direction < 0:
            engine_offset = pygame.Vector2(-5, -20)
        else:
            engine_offset = pygame.Vector2(5, -20)
        
        # Rotate offset to world space.
        world_offset = engine_offset.rotate(self.angle)
        
        # Determine the world position of the thruster.
        particle_pos = self.pos + world_offset
        # For a top thruster, we want the particles to go out opposite to the thrust.
        # That is, if the thruster fires downward relative to the rocket, emit particles downward.
        local_particle_thrust = pygame.Vector2(0, THRUST_POWER * 0.5)
        particle_angle = math.radians(self.angle) + math.pi + random.uniform(-0.2, 0.2)
        
        self.particles.append(Particle(particle_pos.x, particle_pos.y, particle_angle))

    def update(self):
        if self.crashed or self.landed:
            return

        # Apply gravity
        self.vel.y += GRAVITY * DT
        
        # Update position
        self.pos += self.vel * DT
        
        # Update rotation
        self.angle += self.angular_vel * DT
        
        # Apply drag
        self.vel *= (1 - DRAG * DT)
        self.angular_vel *= (1 - ANGULAR_DRAG * DT)

        # Update particles
        for particle in self.particles[:]:
            particle.update()
            if not particle.is_alive():
                self.particles.remove(particle)

    def get_transformed_points(self) -> List[pygame.Vector2]:
        transformed = []
        angle_rad = math.radians(self.angle)
        for point in self.points:
            rotated = pygame.Vector2(
                point.x * math.cos(angle_rad) - point.y * math.sin(angle_rad),
                point.x * math.sin(angle_rad) + point.y * math.cos(angle_rad)
            )
            transformed.append(rotated + self.pos)
        return transformed

    def draw(self, screen: pygame.Surface):
        # Draw particles
        for particle in self.particles:
            particle.draw(screen)

        # Draw rocket
        color = RED if self.crashed else WHITE
        pygame.draw.polygon(screen, color, self.get_transformed_points())

class Terrain:
    def __init__(self):
        self.points: List[Tuple[float, float]] = []
        self.landing_pad: Optional[Tuple[float, float]] = None
        self.generate_terrain()

    def generate_terrain(self):
        x = 0
        while x < SCREEN_WIDTH:
            if SCREEN_WIDTH/3 <= x <= SCREEN_WIDTH/2:
                # Create flat landing pad
                y = SCREEN_HEIGHT * 0.7
                self.landing_pad = (x, x + 100)
                x += 100
            else:
                # Generate rough terrain
                y = random.randint(
                    int(SCREEN_HEIGHT * 0.6),
                    int(SCREEN_HEIGHT * 0.8)
                )
                x += random.randint(20, 50)
            
            self.points.append((x, y))

    def draw(self, screen: pygame.Surface):
        # Draw terrain
        if len(self.points) > 1:
            pygame.draw.lines(screen, WHITE, False, self.points)
        
        # Draw landing pad
        if self.landing_pad:
            pad_x = self.landing_pad[0]
            pad_width = self.landing_pad[1] - self.landing_pad[0]
            pad_y = SCREEN_HEIGHT * 0.7
            pygame.draw.rect(screen, YELLOW, 
                           (pad_x, pad_y, pad_width, 5))

class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Rocket Lander Challenge")
        self.clock = pygame.time.Clock()
        
        # Define on-screen button areas (Rect(left, top, width, height))
        # Thrust buttons on left and right sides
        self.thrust_button_width = 100
        self.thrust_button_height = 100
        self.thrust_gap_from_bottom = 150  # from bottom of screen
        
        self.bottom_left_button = pygame.Rect(
            20,
            SCREEN_HEIGHT - self.thrust_button_height - 20,
            self.thrust_button_width,
            self.thrust_button_height
        )
        self.bottom_right_button = pygame.Rect(
            SCREEN_WIDTH - self.thrust_button_width - 20,
            SCREEN_HEIGHT - self.thrust_button_height - 20,
            self.thrust_button_width,
            self.thrust_button_height
        )
        
        # Pitch buttons are directly on top of the thrust buttons.
        # We'll center them horizontally relative to the thrust buttons.
        self.pitch_button_width = 60
        self.pitch_button_height = 60
        self.button_gap = 10  # vertical gap between pitch and thrust buttons
        
        self.pitch_left_button = pygame.Rect(
            self.bottom_left_button.x + (self.thrust_button_width - self.pitch_button_width) // 2,
            self.bottom_left_button.y - self.pitch_button_height - self.button_gap,
            self.pitch_button_width,
            self.pitch_button_height
        )
        self.pitch_right_button = pygame.Rect(
            self.bottom_right_button.x + (self.thrust_button_width - self.pitch_button_width) // 2,
            self.bottom_right_button.y - self.pitch_button_height - self.button_gap,
            self.pitch_button_width,
            self.pitch_button_height
        )
        
        self.reset_game()
        self.running = True

    def reset_game(self):
        self.rocket = Rocket(SCREEN_WIDTH // 2, 100)
        self.terrain = Terrain()

    def handle_events(self):
        # Process keyboard and mouse/touch events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:
                    self.reset_game()

        keys = pygame.key.get_pressed()
        self.rocket.handle_input(keys)
        
        # Process touch/mouse input for on-screen buttons
        if pygame.mouse.get_pressed()[0]:
            pos = pygame.mouse.get_pos()
            # Left side thrust button:
            if self.bottom_left_button.collidepoint(pos):
                self.rocket.apply_thrust(-1)
                self.rocket.emit_particles(-1)
            # Right side thrust button:
            if self.bottom_right_button.collidepoint(pos):
                self.rocket.apply_thrust(1)
                self.rocket.emit_particles(1)
            # Left side pitch button:
            if self.pitch_left_button.collidepoint(pos):
                self.rocket.apply_pitch_thrust(-1)
                self.rocket.emit_top_particles(-1)
            # Right side pitch button:
            if self.pitch_right_button.collidepoint(pos):
                self.rocket.apply_pitch_thrust(1)
                self.rocket.emit_top_particles(1)

    def check_landing(self):
        if self.rocket.crashed or self.rocket.landed:
            return

        # Get rocket's bottom point (middle bottom)
        rocket_points = self.rocket.get_transformed_points()
        bottom_point = (rocket_points[1] + rocket_points[2]) / 2

        # Check if rocket is over landing pad
        if (self.terrain.landing_pad and 
            self.terrain.landing_pad[0] <= bottom_point.x <= self.terrain.landing_pad[1]):
            pad_y = SCREEN_HEIGHT * 0.7
            
            # Check if we're touching the pad
            if abs(bottom_point.y - pad_y) < 5:
                # Check landing conditions
                if (abs(self.rocket.vel.y) < SAFE_LANDING_VELOCITY and 
                    abs(self.rocket.vel.x) < SAFE_LANDING_VELOCITY and 
                    abs(self.rocket.angle) < SAFE_LANDING_ANGLE):
                    self.rocket.landed = True
                else:
                    self.rocket.crashed = True
        
        # Check collision with terrain (if not above landing pad)
        else:
            for i in range(len(self.terrain.points) - 1):
                p1 = pygame.Vector2(self.terrain.points[i])
                p2 = pygame.Vector2(self.terrain.points[i + 1])
                
                # Simple point-line collision check
                if bottom_point.y > p1.y and p1.x <= bottom_point.x <= p2.x:
                    self.rocket.crashed = True
                    break

    def update(self):
        self.rocket.update()
        self.check_landing()

    def render(self):
        self.screen.fill(BLACK)
        
        self.terrain.draw(self.screen)
        self.rocket.draw(self.screen)
        
        # Draw status text
        font = pygame.font.Font(None, 36)
        if self.rocket.crashed:
            text = font.render("CRASHED! Press R to reset", True, RED)
            self.screen.blit(text, (10, 10))
        elif self.rocket.landed:
            text = font.render("LANDED! Press R to reset", True, YELLOW)
            self.screen.blit(text, (10, 10))
        
        # Draw on-screen buttons for mobile input (for debugging/visual feedback)
        pygame.draw.rect(self.screen, GRAY, self.bottom_left_button, 2)
        pygame.draw.rect(self.screen, GRAY, self.bottom_right_button, 2)
        pygame.draw.rect(self.screen, GRAY, self.pitch_left_button, 2)
        pygame.draw.rect(self.screen, GRAY, self.pitch_right_button, 2)
        
        # Label buttons
        small_font = pygame.font.Font(None, 24)
        thrust_text = small_font.render("Thrust", True, GRAY)
        pitch_text = small_font.render("Pitch", True, GRAY)
        # Render labels on the thrust buttons
        self.screen.blit(thrust_text, (self.bottom_left_button.x + 10, self.bottom_left_button.y + 10))
        self.screen.blit(thrust_text, (self.bottom_right_button.x + 10, self.bottom_right_button.y + 10))
        # Render labels on the pitch buttons
        self.screen.blit(pitch_text, (self.pitch_left_button.x + 5, self.pitch_left_button.y + 5))
        self.screen.blit(pitch_text, (self.pitch_right_button.x + 5, self.pitch_right_button.y + 5))
        
        pygame.display.flip()

    def run(self):
        while self.running:
            self.handle_events()
            self.update()
            self.render()
            self.clock.tick(FPS)

if __name__ == "__main__":
    game = Game()
    game.run()
    pygame.quit()
    sys.exit()