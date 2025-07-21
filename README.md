# 🏆 CheckMate — CAT Hackathon 2025 Winning Project  
**Team HackaPillar**

**CheckMate** is a real-time **IoT-powered smart assistant** designed to improve **safety**, **productivity**, and **efficiency** in heavy vehicle operations. This award-winning system integrates sensor technology, machine learning, and cloud infrastructure to deliver critical insights in real-time.

---

## 🚀 Features

- 🔐 **RFID-Based Operator Authentication**
- 😴 **Drowsiness Detection** (Edge Impulse / Teachable Machine)
- 🌡️ **Engine Temperature Monitoring** (DHT22)
- 🎯 **Seatbelt Compliance Detection**
- 🚧 **Obstacle Detection** (HC-SR04)
- 🧠 **Engine Fault Detection** using ML
- 📈 **Speed Prediction** using accelerometer data
- 🏔️ **Terrain Slope Estimation** (MPU6050 + ML)
- ⏱️ **Task Completion Time Prediction** (ML regression models)
- 📡 **Real-Time Alerts & Live Dashboard** via WebSockets

---

## 🧠 Machine Learning Modules

| Feature                  | Model Used               | Input Data                            |
|--------------------------|---------------------------|----------------------------------------|
| Speed Prediction         | Linear / Random Forest    | MPU6050 Sensor                         |
| Slope Estimation         | Regression Model          | Accelerometer + Gyroscope              |
| Engine Fault Detection   | Classification Model      | Temp, vibration, obstacle sensors      |
| Task Time Estimation     | Regression Model          | Vehicle ID + Task Metrics              |

Models are built in **Python** using **scikit-learn**, and deployed via **FastAPI** for seamless integration.

---

## 🛠️ Tech Stack

- **Hardware**: ESP32, RFID Reader, DHT22, HC-SR04, MPU6050
- **Embedded**: Arduino/C++
- **Backend**:  
  - `FastAPI` (ML Model Serving)  
  - `Node.js + Express` (API Gateway + WebSocket)
- **Frontend**: React.js (Live Dashboard)
- **Database**: MongoDB (Operator & Task Logs)
- **AI Tools**: Scikit-learn, Edge Impulse, Teachable Machine
- **Protocols**: HTTP, WebSocket

---
Feel free to reach out or contribute!  
**Team HackaPillar** – CAT Hackathon 2025 Champions

