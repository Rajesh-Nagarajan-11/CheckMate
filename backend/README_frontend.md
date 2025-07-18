# Backend API Reference for Frontend Development

This document summarizes all available backend API endpoints, request/response formats, and field details to help you build a frontend for this system.

---

## Base URL
```
http://localhost:3000
```

---

## Endpoints

### 1. Task Time Prediction
**POST** `/predict/time`

**Request Body:**
```json
{
  "vehicle_id": "CAT-980H",
  "task_data": {
    "task_name": "Boulder Clearing",
    "engine_hours": 45.5,
    "fuel_used": 10.2,
    "load_cycles": 18,
    "idling_time": 3.5
  }
}
```
**Response:**
```json
{
  "message": "✅ Task prediction saved",
  "prediction": {
    "task_name": "Boulder Clearing",
    "predicted_time_minutes": 123.45,
    "model_used": "ModelName"
  },
  "log": { ...OperatorLog... }
}
```

---

### 2. Speed Prediction
**POST** `/predict/speed`

**Request Body:**
```json
{
  "vehicle_id": "CAT-980H",
  "accel_data": {
    "accel_x": -2.4,
    "accel_y": 1.8
  }
}
```
**Response:**
```json
{
  "message": "✅ Speed prediction saved",
  "prediction": {
    "accel_x": -2.4,
    "accel_y": 1.8,
    "predicted_speed_kmph": 12.34,
    "model_used": "ModelName"
  },
  "log": { ...OperatorLog... }
}
```

---

### 3. Engine Fault Detection
**POST** `/predict/engine`

**Request Body:**
```json
{
  "vehicle_id": "CAT-980H",
  "engine_data": {
    "engine_temperature": 65.3,
    "engine_humidity": 70.1
  }
}
```
**Response:**
```json
{
  "message": "✅ Engine data saved",
  "engine_data": {
    "engine_temperature": 65.3,
    "engine_humidity": 70.1,
    "fault_code": 3,
    "fault_status": "Critical Fault: High Temperature and High Humidity",
    "rule_based": true
  },
  "log": { ...OperatorLog... }
}
```

---

### 4. Drowsiness Detection
**POST** `/predict/drowsiness`

**Request Body:**
```json
{
  "vehicle_id": "CAT-980H",
  "drowsiness_event": {
    "detected": true,
    "confidence": 0.87
  }
}
```
**Response:**
```json
{
  "message": "✅ Drowsiness event logged",
  "drowsiness_event": {
    "detected": true,
    "confidence": 0.87
  },
  "log": { ...OperatorLog... }
}
```

---

### 5. Obstacle Detection
**POST** `/predict/obstacle`

**Request Body:**
```json
{
  "vehicle_id": "CAT-980H",
  "obstacle_data": {
    "distance_cm": 22.5,
    "obstacle_detected": true
  }
}
```
**Response:**
```json
{
  "message": "✅ Obstacle detection logged",
  "obstacle_data": {
    "distance_cm": 22.5,
    "obstacle_detected": true
  },
  "log": { ...OperatorLog... }
}
```

---

### 6. Register RFID
**POST** `/rfid`

**Request Body:**
```json
{
  "vehicle_id": "CAT-980H",
  "rfid_id": "RFID123456"
}
```
**Response:**
```json
{
  "message": "✅ RFID stored",
  "record": { ... },
  "log": { ...OperatorLog... }
}
```

---

### 7. Check if Vehicle Exists
**GET** `/rfid/exists?vehicle_id=CAT-980H`

**Response:**
```json
{
  "exists": true,
  "log": { ...OperatorLog... }
}
```

---

### 8. Check if RFID Number Exists
**GET** `/rfid/number/exists?rfid_id=RFID123456`

**Response:**
```json
{
  "exists": true,
  "record": { ... }
}
```

---

## WebSocket Events
- **operatorlog_update**: `{ log: <OperatorLog>, event: <string> }` (on any update)
- **rfid_update**: `{ ...RfidRecord }` (on new RFID record)

---

## Notes for Frontend/AI Developers
- All POST endpoints require `Content-Type: application/json`.
- All endpoints require `vehicle_id` in the request body (except the GET endpoints, which use query params).
- The `OperatorLog` object contains all historical and latest data for a vehicle, including logs of all events.
- For engine data, the following fields are available:
  - `engine_temperature`, `engine_humidity`, `fault_code`, `fault_status`, `rule_based`
- For speed data, the following fields are available:
  - `accel_x`, `accel_y`, `predicted_speed_kmph`, `speed_model_used`
- For task data, the following fields are available:
  - `task_name`, `engine_hours`, `fuel_used`, `load_cycles`, `idling_time`, `predicted_time_minutes`, `task_model_used`
- For obstacle data, the following fields are available:
  - `distance_cm`, `obstacle_detected`
- For drowsiness events, the following fields are available:
  - `detected`, `confidence`

---

This reference is designed to help you or an AI agent quickly scaffold a frontend UI for all backend features. 