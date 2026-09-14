"""Synthetic-data prototype predictor. No sensor or government data is used."""
from fastapi import FastAPI
from pydantic import BaseModel, Field
import math

app = FastAPI(title="Pune Urban Flood AI Engine", version="0.1.0")

class Features(BaseModel):
    rainfall_intensity: float = Field(ge=0, le=300)
    historical_rainfall: float = Field(default=20, ge=0)
    elevation: float = Field(default=560, ge=400, le=1000)
    slope: float = Field(default=3, ge=0, le=45)
    drainage_capacity: float = Field(default=2.5, gt=0)

def estimate(f: Features):
    # explainable fallback calibrated on generated prototype samples
    terrain_factor = 1 + max(0, (575-f.elevation)/100) + max(0, 5-f.slope)/35
    runoff = max(.05, f.rainfall_intensity*.052*terrain_factor + f.historical_rainfall*.008)
    load = min(1.5, runoff/f.drainage_capacity)
    score = min(100, f.rainfall_intensity*.5 + load*35 + max(0,575-f.elevation)*.35 + max(0,4-f.slope)*2)
    return runoff, load, score

@app.post('/predict-runoff')
def predict_runoff(f: Features):
    runoff, load, _ = estimate(f)
    return {"expected_runoff": round(runoff,3), "unit":"m3/s (prototype estimate)", "drainage_load":round(load*100,1), "data_notice":"Synthetic prototype model; not operational guidance."}

@app.post('/predict-flood-risk')
def predict_flood_risk(f: Features):
    runoff, load, score = estimate(f)
    return {"expected_runoff":round(runoff,3),"risk_score":round(score,1),"risk_level":"SEVERE" if score>75 else "HIGH" if score>50 else "MODERATE" if score>25 else "LOW","overflow_probability":round(max(0,min(1,(load-.72)/.45))*100,1)}

@app.get('/model-status')
def model_status():
    return {"model":"synthetic-data regression fallback","lstm_architecture":"planned: 24-step rainfall/terrain/drainage sequences → LSTM(64) → Dense(1)","status":"ready","training_data":"synthetic prototype only","tensorflow_required":False}
