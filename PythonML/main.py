from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import joblib

# ===============================
# Load Task Completion Time Model
# ===============================
try:
    task_model_data = joblib.load("Predict_Time.pkl")
    task_model = task_model_data["model"]
    task_scaler = task_model_data["scaler"]
    task_encoder = task_model_data["encoder"]
    task_labels = task_encoder.categories_[0]
except Exception as e:
    print(f"❌ Failed to load task model: {e}")
    task_model = task_scaler = task_encoder = None

# ===============================
# Load Speed Prediction Model
# ===============================
try:
    speed_model_data = joblib.load("speed_predictor_model.pkl")
    speed_model = speed_model_data["model"]
    speed_scaler = speed_model_data["scaler"]
    speed_feature_names = speed_model_data["feature_names"]
except Exception as e:
    print(f"❌ Failed to load speed model: {e}")
    speed_model = speed_scaler = None

# ===============================
# Initialize FastAPI
# ===============================
app = FastAPI(title="Rule-Based + ML Prediction API")

# ===============================
# Schemas
# ===============================
class TaskInput(BaseModel):
    task_name: str
    engine_hours: float
    fuel_used: float
    load_cycles: int
    idling_time: float

class SpeedInput(BaseModel):
    accel_x: float
    accel_y: float

class FaultInput(BaseModel):
    temperature: float  # Raw temperature (0–80 °C)
    humidity: float     # Raw humidity (0–80 %RH)

class TemperatureInput(BaseModel):
    temperature: float  # Raw temperature in °C

# ===============================
# /predictTaskTime Endpoint
# ===============================
@app.post("/predictTaskTime")
def predict_task_time(data: TaskInput):
    if task_model is None:
        raise HTTPException(status_code=500, detail="Task prediction model not loaded.")
    if data.task_name not in task_labels:
        raise HTTPException(status_code=400, detail=f"Invalid task name. Available: {list(task_labels)}")

    try:
        task_ohe = task_encoder.transform([[data.task_name]])
        other_features = np.array([[data.engine_hours, data.fuel_used, data.load_cycles, data.idling_time]])
        features = np.concatenate([task_ohe, other_features], axis=1)
        features_scaled = task_scaler.transform(features)
        predicted_time = task_model.predict(features_scaled)[0]

        return {
            "task_name": data.task_name,
            "predicted_time_minutes": round(float(predicted_time), 2),
            "model_used": task_model_data.get("model_name", "Unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

# ===============================
# /predictSpeed Endpoint
# ===============================
@app.post("/predictSpeed")
def predict_speed(data: SpeedInput):
    if speed_model is None:
        raise HTTPException(status_code=500, detail="Speed prediction model not loaded.")

    try:
        features = np.array([[data.accel_x, data.accel_y]])
        features_scaled = speed_scaler.transform(features)
        predicted_speed = speed_model.predict(features_scaled)[0]

        return {
            "accel_x": data.accel_x,
            "accel_y": data.accel_y,
            "predicted_speed_kmph": round(float(predicted_speed), 2),
            "model_used": speed_model_data.get("model_name", "Unknown")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {e}")

# ===============================
# /predictFault Endpoint (Rule-Based using raw 0–80 values)
# ===============================
@app.post("/predictFault")
def predict_fault(data: FaultInput):
    temp = data.temperature
    hum = data.humidity

    if not (0 <= temp <= 80) or not (0 <= hum <= 80):
        raise HTTPException(status_code=400, detail="Temperature and humidity must be between 0 and 80.")

    if temp > 60 and hum > 60:
        fault = "Critical Fault: High Temperature and High Humidity"
        code = 3
    elif temp > 60:
        fault = "High Temperature Fault"
        code = 1
    elif hum > 60:
        fault = "High Humidity Fault"
        code = 2
    else:
        fault = "No Fault"
        code = 0

    return {
        "temperature": temp,
        "humidity": hum,
        "fault_code": code,
        "fault_status": fault,
        "rule_based": True
    }
