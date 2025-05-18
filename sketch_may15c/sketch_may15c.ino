#include <WiFi.h>
#include <WebSocketsClient.h>

const char *ssid = "";
const char *password = "";

WebSocketsClient webSocket;

void setup()
{
    Serial.begin(115200);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
    }
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    webSocket.begin("192.168.1.144", 9002, "/");

    webSocket.onEvent([](WStype_t type, uint8_t *payload, size_t length)
                      {
    if (type == WStype_CONNECTED) {
      Serial.println("WebSocket connected");
      webSocket.sendTXT("{\"state\":\"idle\"}");
    } else if (type == WStype_DISCONNECTED) {
      Serial.println("WebSocket disconnected");
    } else if (type == WStype_ERROR) {
      Serial.println("WebSocket error");
    } });

    webSocket.setReconnectInterval(5000);
}

void loop()
{
    webSocket.loop();

    unsigned long currentTime = millis();

    static unsigned long lastSend = 0;
    static unsigned long workingStateStartTime = 0;
    static bool isWorking = false;
    const unsigned long sendInterval = 15000;
    const unsigned long workingDuration = 10000;

    if (!isWorking && (currentTime - lastSend > sendInterval))
    {
        lastSend = currentTime;
        Serial.println("Sending 'working' state");
        if (WiFi.status() == WL_CONNECTED && webSocket.isConnected())
        {
            webSocket.sendTXT("{\"state\":\"working\"}");
        }
        isWorking = true;
        workingStateStartTime = currentTime;
    }

    if (isWorking && (currentTime - workingStateStartTime > workingDuration))
    {
        Serial.println("Sending 'idle' state");
        if (WiFi.status() == WL_CONNECTED && webSocket.isConnected())
        {
            webSocket.sendTXT("{\"state\":\"idle\"}");
        }
        isWorking = false;
    }
}
