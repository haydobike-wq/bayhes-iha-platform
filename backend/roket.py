import math
from dataclasses import dataclass

from motor import Motor


@dataclass(frozen=True)
class Rocket:
    dry_mass: float
    prop_mass: float
    diameter_m: float
    cd: float
    motor: Motor

    @property
    def area_m2(self) -> float:
        radius = self.diameter_m / 2.0
        return math.pi * radius * radius

    def mass_at(self, time_s: float) -> float:
        if self.motor.burn_s <= 0:
            return self.dry_mass
        burn_fraction = min(max(time_s / self.motor.burn_s, 0.0), 1.0)
        return self.dry_mass + self.prop_mass * (1.0 - burn_fraction)
