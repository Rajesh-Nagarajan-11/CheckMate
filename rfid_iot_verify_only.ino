#include <Arduino.h>
#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <DHT.h>
#include <DHT_U.h>
#include <SPI.h>
#include <MFRC522.h>

// === WiFi Configuration ===
const char* ssid = "realme 7 Pro";
const char* password = "8925297879";

// === API Config ===
const String base_url = "http://4d6bff3a417a.ngrok-free.app";

// === Vehicle ID (MAC) ===
String vehicle_id = "";

// === Pins ===
#define DHTPIN 4
#define DHTTYPE DHT22
#define TRIG_PIN 27
#define ECHO_PIN 14
#define SS_PIN 21
#define RST_PIN 22
#define I2C_SDA 26
#define I2C_SCL 25

// === Sensors ===
DHT dht(DHTPIN, DHTTYPE);
Adafruit_MPU6050 mpu;
MFRC522 rfid(SS_PIN, RST_PIN);

// === Setup ===
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("Initializing...");

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi connected.");

  vehicle_id = WiFi.macAddress();
  vehicle_id.replace(":", "");
  Serial.println("✅ Vehicle ID (MAC): " + vehicle_id);

  Wire.begin(I2C_SDA, I2C_SCL);
  dht.begin();

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  if (!mpu.begin()) {
    Serial.println("❌ MPU6050 not found");
  } else {
    Serial.println("✅ MPU6050 initialized.");
  }

  SPI.begin();
  rfid.PCD_Init();
  Serial.println("✅ RFID initialized.");
}

// === Distance ===
float getDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  return duration * 0.034 / 2;
}

// === POST ===
void sendPostRequest(String endpoint, String payload) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = base_url + endpoint;
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(10000);  // Increase timeout

    int responseCode = http.POST(payload);
    Serial.printf("\n[POST] %s\nPayload: %s\nResponse Code: %d\n", endpoint.c_str(), payload.c_str(), responseCode);

    String response = http.getString();
    Serial.println("Response: " + response);
    http.end();
  } else {
    Serial.println("❌ WiFi not connected.");
  }
}

// === Main Loop ===
void loop() {
  Serial.println("\n--- Sensor Readings ---");

  // === DHT22 ===
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (!isnan(temp) && !isnan(hum)) {
    Serial.printf("✅ DHT22: Temp = %.2f°C, Hum = %.2f%%\n", temp, hum);

    String enginePayload = 
      "{\"vehicle_id\":\"" + vehicle_id + 
      "\",\"engine_data\":{\"engine_temperature\":" + String(temp, 1) + 
      ",\"engine_humidity\":" + String(hum, 1) + "}}";

    sendPostRequest("/predict/engine", enginePayload);
  } else {
    Serial.println("❌ Failed to read from DHT22 sensor.");
  }

  // === Ultrasonic ===
  float distance = getDistanceCM();
  bool obstacle = distance <= 60;
  Serial.printf("✅ HC-SR04: Distance = %.2f cm | Obstacle = %s\n", distance, obstacle ? "YES" : "NO");

  String obstaclePayload = 
    "{\"vehicle_id\":\"" + vehicle_id + 
    "\",\"obstacle_data\":{\"distance_cm\":" + String(distance, 1) + 
    ",\"obstacle_detected\":" + (obstacle ? "true" : "false") + "}}";

  sendPostRequest("/predict/obstacle", obstaclePayload);

  // === MPU6050 ===
  sensors_event_t a, g, temp_mpu;
  mpu.getEvent(&a, &g, &temp_mpu);
  Serial.printf("✅ MPU6050: AccelX = %.2f | AccelY = %.2f\n", a.acceleration.x, a.acceleration.y);

  String accelPayload = 
    "{\"vehicle_id\":\"" + vehicle_id + 
    "\",\"accel_data\":{\"accel_x\":" + String(a.acceleration.x, 2) + 
    ",\"accel_y\":" + String(a.acceleration.y, 2) + "}}";

  sendPostRequest("/predict/speed", accelPayload);

  // === RFID ===
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String rfid_uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) rfid_uid += "0";
      rfid_uid += String(rfid.uid.uidByte[i], HEX);
    }
    rfid_uid.toUpperCase();
    Serial.println("✅ RFID UID: " + rfid_uid);

    String rfidPayload = 
      "{\"vehicle_id\":\"" + vehicle_id + 
      "\",\"rfid_id\":\"" + rfid_uid + "\"}";

    // Only change: use /rfid/verify instead of /rfid
    sendPostRequest("/rfid/verify", rfidPayload);

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  } else {
    Serial.println("RFID -> No tag detected.");
  }

  delay(5000); // wait 5 seconds
} 