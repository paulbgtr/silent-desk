#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "";
const char* password = "";
const char* serverUrl = "http://192.168.1.137:3001/api/presence";

const int PIR_PIN = 27;

unsigned long lastMotion = 0;
unsigned long idleTimeout = 5 * 60 * 1000; // 5 minutes
bool isWorking = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIR_PIN, INPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
}

void loop() {
  int motion = digitalRead(PIR_PIN);
  unsigned long now = millis();

  if (motion == HIGH) {
    lastMotion = now;

    if (!isWorking) {
      sendState("working");
      isWorking = true;
    }
  }

  if (isWorking && (now - lastMotion > idleTimeout)) {
    sendState("idle");
    isWorking = false;
  }

  delay(200);
}

void sendState(String state) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String json = "{\"state\":\"" + state + "\"}";
    int code = http.POST(json);
    Serial.println("Sent: " + json + " | Code: " + code);

    http.end();
  } else {
    Serial.println("No Wi-Fi");
  }
}