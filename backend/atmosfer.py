import math


RHO0 = 1.225
SCALE_HEIGHT_M = 8500.0


def air_density(altitude_m: float) -> float:
    altitude = max(0.0, altitude_m)
    return RHO0 * math.exp(-altitude / SCALE_HEIGHT_M)
