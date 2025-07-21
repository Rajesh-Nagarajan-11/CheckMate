# 🏆 CheckMate — CAT Hackathon 2025 Winning Project  
**Team HackaPillar**

**CheckMate** is a real-time **IoT-powered smart assistant** designed to improve **safety**, **productivity**, and **efficiency** in heavy vehicle operations. This award-winning system integrates **sensor networks**, **AI/ML models**, and an intelligent **chatbot assistant** powered by the **Gemini API**, delivering critical operational insights and support to operators on the field.


---

## 🚀 Features

- 🔐 **RFID-Based Operator Authentication**
- 😴 **Drowsiness Detection** (Teachable Machine)
- 🌡️ **Engine Temperature Monitoring** (DHT22)
- 🎯 **Seatbelt Compliance Detection**
- 🚧 **Obstacle Detection** (HC-SR04)
- 🧠 **Engine Fault Detection** using ML
- 🏔️📈 **Smart Speed Estimation Based on Terrain Slope**  
  Uses MPU6050 sensor data to estimate terrain slope (inclination) and predict the vehicle’s optimal speed in real-time using ML models.
- ⏱️ **Task Completion Time Prediction** using regression models
- 📡 **Live Dashboard with Real-Time Alerts** via WebSockets

---

## 🧠 Machine Learning Modules

| Feature                      | Model Used               | Input Data                                     |
|------------------------------|---------------------------|------------------------------------------------|
| Smart Speed Estimation       | Regression (Random Forest)| MPU6050 data (accelerometer + gyro) + Slope    |
| Engine Fault Detection       | Classification Model      | Temp, vibration, obstacle sensors              |
| Task Time Estimation         | Regression Model          | Vehicle ID + Task Type + Sensor Metrics        |

➡️ **Terrain slope is computed from MPU6050 data and used as a key input in speed estimation**, ensuring the system adapts to uphill/downhill conditions.

---

## 🛠️ Tech Stack

- **Hardware**: ESP32, RFID Reader, DHT22, HC-SR04, MPU6050
- **Embedded**: Arduino/C++
- **Backend**:  
  - `FastAPI` for ML Model Serving  
  - `Node.js + Express` for API Gateway + WebSocket Integration
- **Frontend**: React.js (Live Dashboard)
- **Database**: MongoDB (Operator & Task Logs)
- **AI Tools**: Scikit-learn, Teachable Machine
- **Protocols**: HTTP, WebSocket

---

## 🤝 Contributing & Contact

We welcome contributions, feature suggestions, and feedback!

**Team HackaPillar**  
🏆 Winners of CAT Hackathon 2025

