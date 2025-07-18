# Backend API Documentation

## Base URL
```
http://localhost:3000
```

---

## Endpoints

### 1. Check if Vehicle Exists
**GET** `/rfid/exists?vehicle_id=CAT-980H`

**Query Parameter:**
- `vehicle_id` (string, required)

**Response:**
```
{
  "exists": true, // or false
  "log": { ... } // present if exists
}
```

---

### 2. Register a Vehicle with RFID
**POST** `/rfid`

**Request Body:**
```
{
  "vehicle_id": "CAT-980H",
  "rfid_id": "RFID123456"
}
```

**Response:**
```
{
  "message": "✅ RFID stored",
  "record": { ... },
  "log": { ... }
}
```

---

### 3. Check if RFID Number Exists
**GET** `/rfid/number/exists?rfid_id=RFID123456`

**Query Parameter:**
- `rfid_id` (string, required)

**Response:**
```
{
  "exists": true, // or false
  "record": { ... } // present if exists
}
```

---

### 4. Task Time Prediction
**POST** `/predict/time`

**Request Body:**
```
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

---

### 5. Speed Prediction
**POST** `/predict/speed`

**Request Body:**
```
{
  "vehicle_id": "CAT-980H",
  "accel_data": {
    "accel_x": -2.4,
    "accel_y": 1.8
  }
}
```

---

### 6. Engine Fault Detection
**POST** `/predict/engine`

**Request Body:**
```
{
  "vehicle_id": "CAT-980H",
  "engine_data": {
    "engine_temperature": 65.3,
    "engine_humidity": 70.1
  }
}
```

---

### 7. Drowsiness Detection
**POST** `/predict/drowsiness`

**Request Body:**
```
{
  "vehicle_id": "CAT-980H",
  "drowsiness_event": {
    "detected": true,
    "confidence": 0.87
  }
}
```

---

### 8. Obstacle Detection
**POST** `/predict/obstacle`

**Request Body:**
```
{
  "vehicle_id": "CAT-980H",
  "obstacle_data": {
    "distance_cm": 22.5,
    "obstacle_detected": true
  }
}
```

---

## WebSocket Events

- **Event:** `operatorlog_update`
  - **Payload:** `{ log: <OperatorLog>, event: <string> }`
  - Emitted on any update to an OperatorLog (task, speed, engine, drowsiness, obstacle)

- **Event:** `rfid_update`
  - **Payload:** `{ ...RfidRecord }`
  - Emitted when a new RFID record is created

---

## Notes
- All POST endpoints require `Content-Type: application/json`.
- All endpoints require `vehicle_id` in the request body (except the GET endpoints, which use query params).
- If `vehicle_id` is missing, the API will return a 400 error. 