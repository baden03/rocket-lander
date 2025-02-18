import pygame
import math
import random
from typing import List, Tuple, Optional
import sys

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60
DT = 1 / FPS

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)
GRAY = (100, 100, 100)

# Physics constants
GRAVITY = 100.0
THRUST_POWER = 200.0
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

        # Left engine (LEFT ARROW or LEFT SHIFT)
        if keys[pygame.K_LEFT] or keys[pygame.K_LSHIFT]:
            self.apply_thrust(-1)
            self.emit_particles(-1)
            
        # Right engine (RIGHT ARROW or RIGHT SHIFT)
        if keys[pygame.K_RIGHT] or keys[pygame.K_RSHIFT]:
            self.apply_thrust(1)
            self.emit_particles(1)

    def apply_thrust(self, direction: int):
        angle_rad = math.radians(self.angle)
        thrust = THRUST_POWER
        
        # Calculate thrust components
        thrust_x = math.sin(angle_rad) * thrust * direction
        thrust_y = -math.cos(angle_rad) * thrust
        
        # Apply forces
        self.vel.x += thrust_x * DT
        self.vel.y += thrust_y * DT
        
        # Apply torque for rotation
        self.angular_vel += TORQUE * direction * DT

    def emit_particles(self, direction: int):
        angle_rad = math.radians(self.angle)
        offset = pygame.Vector2(
            math.sin(angle_rad) * 10 * direction,
            math.cos(angle_rad) * 10
        )
        
        particle_pos = self.pos + offset
        particle_angle = angle_rad + math.pi + random.uniform(-0.2, 0.2)
        
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
        
        self.reset_game()
        self.running = True

    def reset_game(self):
        self.rocket = Rocket(SCREEN_WIDTH // 2, 100)
        self.terrain = Terrain()

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_r:
                    self.reset_game()
                
        keys = pygame.key.get_pressed()
        self.rocket.handle_input(keys)

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
        
        # Check collision with terrain
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
        
        # Draw status
        font = pygame.font.Font(None, 36)
        if self.rocket.crashed:
            text = font.render("CRASHED! Press R to reset", True, RED)
            self.screen.blit(text, (10, 10))
        elif self.rocket.landed:
            text = font.render("LANDED! Press R to reset", True, YELLOW)
            self.screen.blit(text, (10, 10))
        
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