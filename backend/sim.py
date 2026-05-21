import math
from dataclasses import dataclass

from atmosfer import air_density
from roket import Rocket


G = 9.80665


@dataclass(frozen=True)
class SimConfig:
    elevation_deg: float
    wind: float = 0.0
    dt: float = 0.02
    max_time_s: float = 300.0


def simulate_2d(rocket: Rocket, config: SimConfig) -> dict[str, float]:
    theta = math.radians(config.elevation_deg)
    x = 0.0
    z = 0.0
    vx = 0.0
    vz = 0.0
    t = 0.0
    max_alt = 0.0
    max_speed = 0.0

    while t < config.max_time_s:
        mass = max(rocket.mass_at(t), 0.001)
        thrust = rocket.motor.thrust_at(t)
        rel_vx = vx - config.wind
        rel_vz = vz
        rel_speed = math.hypot(rel_vx, rel_vz)
        drag = 0.5 * air_density(z) * rel_speed * rel_speed * rocket.cd * rocket.area_m2

        if rel_speed > 1e-9:
            drag_x = -drag * rel_vx / rel_speed
            drag_z = -drag * rel_vz / rel_speed
        else:
            drag_x = 0.0
            drag_z = 0.0

        thrust_x = thrust * math.cos(theta)
        thrust_z = thrust * math.sin(theta)

        ax = (thrust_x + drag_x) / mass
        az = (thrust_z + drag_z) / mass - G

        prev_x = x
        prev_z = z
        vx += ax * config.dt
        vz += az * config.dt
        x += vx * config.dt
        z += vz * config.dt
        t += config.dt

        max_alt = max(max_alt, z)
        max_speed = max(max_speed, math.hypot(vx, vz))

        if t > 0.1 and z <= 0.0 and vz < 0.0:
            if z != prev_z:
                ratio = prev_z / (prev_z - z)
                impact_x = prev_x + ratio * (x - prev_x)
                impact_t = t - config.dt + ratio * config.dt
            else:
                impact_x = x
                impact_t = t

            return {
                "flight_time_s": impact_t,
                "max_alt_m": max_alt,
                "impact_downrange_m": max(0.0, impact_x),
                "max_speed_mps": max_speed,
            }

    return {
        "flight_time_s": t,
        "max_alt_m": max_alt,
        "impact_downrange_m": max(0.0, x),
        "max_speed_mps": max_speed,
    }
