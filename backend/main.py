import os
from typing import Literal

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from kalibre import azimuth_deg, downrange_to_local_en, haversine_distance_m
from motor import motor_from_avg
from roket import Rocket
from sim import SimConfig, simulate_2d


load_dotenv()


class BayhesRequest(BaseModel):
    launch_lat: float = Field(..., ge=-90, le=90)
    launch_lon: float = Field(..., ge=-180, le=180)
    target_lat: float = Field(..., ge=-90, le=90)
    target_lon: float = Field(..., ge=-180, le=180)
    elevation_deg: float = Field(..., gt=0, lt=90)
    dry_mass: float = Field(..., gt=0)
    prop_mass: float = Field(..., ge=0)
    diameter_m: float = Field(..., gt=0)
    cd: float = Field(..., gt=0)
    thrust_avg: float = Field(..., gt=0)
    burn_s: float = Field(..., gt=0)
    wind: float = Field(0.0)


class BayhesResponse(BaseModel):
    distance_m: float
    azimuth_deg: float
    flight_time_s: float
    max_alt_m: float
    impact_downrange_m: float
    impact_E: float
    impact_N: float
    max_speed_mps: float
    status: Literal["success"]


app = FastAPI(
    title="Mühendislik Hesaplama ve Simülasyon Platformu API",
    version="1.0.0",
)

local_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
env_origins = [
    os.getenv("FRONTEND_ORIGIN", ""),
    *os.getenv("ALLOWED_ORIGINS", "").split(","),
]
allowed_origins = local_origins + [
    origin.strip()
    for origin in env_origins
    if origin and origin.strip() and origin.strip() not in local_origins
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "message": "Backend çalışıyor"}


@app.get("/favicon.ico", include_in_schema=False)
def favicon() -> Response:
    return Response(status_code=204)


@app.post("/api/bayhes/simulate", response_model=BayhesResponse)
def simulate_bayhes(payload: BayhesRequest) -> BayhesResponse:
    try:
        distance = haversine_distance_m(
            payload.launch_lat,
            payload.launch_lon,
            payload.target_lat,
            payload.target_lon,
        )
        azimuth = azimuth_deg(
            payload.launch_lat,
            payload.launch_lon,
            payload.target_lat,
            payload.target_lon,
        )

        motor = motor_from_avg(payload.thrust_avg, payload.burn_s)
        rocket = Rocket(
            dry_mass=payload.dry_mass,
            prop_mass=payload.prop_mass,
            diameter_m=payload.diameter_m,
            cd=payload.cd,
            motor=motor,
        )
        config = SimConfig(elevation_deg=payload.elevation_deg, wind=payload.wind)
        result = simulate_2d(rocket, config)
        impact_e, impact_n = downrange_to_local_en(result["impact_downrange_m"], azimuth)

        return BayhesResponse(
            distance_m=distance,
            azimuth_deg=azimuth,
            flight_time_s=result["flight_time_s"],
            max_alt_m=result["max_alt_m"],
            impact_downrange_m=result["impact_downrange_m"],
            impact_E=impact_e,
            impact_N=impact_n,
            max_speed_mps=result["max_speed_mps"],
            status="success",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail={"status": "error", "message": str(exc)},
        ) from exc
