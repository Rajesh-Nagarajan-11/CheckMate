# Latest Data & Logs API Documentation

This document describes the new GET endpoints for fetching the latest data and logs for a vehicle.

---

## 1. Get Latest Task Prediction
**GET** `/latest/task?vehicle_id=CAT-980H`

**Response:**
```json
{
  "task_data": {
    "task_name": "Boulder Clearing",
    "engine_hours": 45.5,
    "fuel_used": 10.2,
    "load_cycles": 18,
    "idling_time": 3.5,
    "predicted_time_minutes": 123.45,
    "task_model_used": "ModelName"
  }
}
```

---

## 2. Get Latest Speed Prediction
**GET** `/latest/speed?vehicle_id=CAT-980H`

**Response:**
```json
{
  "speed_data": {
    "accel_x": -2.4,
    "accel_y": 1.8,
    "predicted_speed_kmph": 12.34,
    "speed_model_used": "ModelName"
  }
}
```

---

## 3. Get Latest Engine Fault Data
**GET** `/latest/engine?vehicle_id=CAT-980H`

**Response:**
```json
{
  "engine_data": {
    "engine_temperature": 65.3,
    "engine_humidity": 70.1,
    "fault_code": 3,
    "fault_status": "Critical Fault: High Temperature and High Humidity",
    "rule_based": true
  }
}
```

---

## 4. Get Latest Obstacle Detection
**GET** `/latest/obstacle?vehicle_id=CAT-980H`

**Response:**
```json
{
  "obstacle_data": {
    "distance_cm": 22.5,
    "obstacle_detected": true
  }
}
```

---

## 5. Get Latest Drowsiness Event
**GET** `/latest/drowsiness?vehicle_id=CAT-980H`

**Response:**
```json
{
  "drowsiness_event": {
    "detected": true,
    "confidence": 0.87
  }
}
```

---

## 6. Get All Latest Data (Dashboard)
**GET** `/latest/dashboard?vehicle_id=CAT-980H`

**Response:**
```json
{
  "task_data": { ... },
  "speed_data": { ... },
  "engine_data": { ... },
  "obstacle_data": { ... },
  "drowsiness_event": { ... },
  "rfid": { "tag_id": "...", "vehicle_id": "..." },
  "timestamp": "2024-06-07T12:34:56.789Z",
  "logs": [ { ... }, ... ]
}
```

---

## 7. Get All Logs for a Vehicle
**GET** `/latest/logs?vehicle_id=CAT-980H`

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2024-06-07T12:34:56.789Z",
      "event_type": "engine_fault",
      "engine_data": { ... }
    },
    {
      "timestamp": "2024-06-07T12:35:56.789Z",
      "event_type": "obstacle_detected",
      "obstacle_data": { ... }
    },
    // ... more log entries ...
  ]
}
```

---

**Notes:**
- All endpoints require `vehicle_id` as a query parameter.
- If no data is found, a 404 error is returned.
- The dashboard endpoint returns all latest data and the full logs array for the vehicle. 