🏆 CheckMate — CAT Hackathon 2025 Winning Project
Team HackaPillar

CheckMate is a real-time IoT-powered smart assistant for heavy vehicle operators, built to enhance safety, productivity, and operational efficiency. Winner of the CAT Hackathon 2025, it integrates sensor networks, AI/ML, and cloud technologies to deliver actionable insights and real-time alerts.

🚀 Core Features
🔐 RFID-based Operator Authentication

😴 Drowsiness Detection (via Teachable Machine)

🌡️ Engine Temperature Monitoring

🎯 Seatbelt Compliance Detection

🚧 Obstacle Detection (Ultrasonic - HC-SR04)

🧠 Engine Fault Detection using ML

📈 Speed Prediction using sensor-driven ML regression

🏔️ Terrain Slope Estimation via MPU6050 + ML

⏱️ Task Completion Time Prediction using vehicle ID and task data

📡 Live Dashboard & Real-time Alerts using WebSockets

🧠 Machine Learning Modules
Speed & Slope Estimation:
Trained using MPU6050 sensor data + regression models (Random Forest, Linear Regression)

Engine Fault Detection:
ML classification on temperature, vibration, and obstacle data

Task Time Prediction:
Predicts estimated time of task completion using vehicle type and task metrics

Models deployed via Python FastAPI, integrated with Node.js backend

🧰 Tech Stack
Hardware: ESP32, RFID, DHT22, MPU6050, HC-SR04

Embedded: Arduino/C++

Backend: FastAPI (ML) + Node.js (REST/WebSocket API)

Frontend: React (live dashboard)

Database: MongoDB

AI Tools: Scikit-learn, Edge Impulse, Teachable Machine

Protocols: HTTP, WebSocket

