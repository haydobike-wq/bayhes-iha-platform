from dataclasses import dataclass


@dataclass(frozen=True)
class Motor:
    thrust_avg: float
    burn_s: float

    def thrust_at(self, time_s: float) -> float:
        if 0.0 <= time_s <= self.burn_s:
            return self.thrust_avg
        return 0.0


def motor_from_avg(thrust_avg: float, burn_s: float) -> Motor:
    return Motor(thrust_avg=thrust_avg, burn_s=burn_s)
