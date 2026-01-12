/*
 * NodeMCU ESP8266 - 智能药盒MQTT版本（完整修复版）
 * 修复设备ID问题和消息循环
 */

#include <ESP8266WiFi.h>
#include <U8g2lib.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ===================== OLED配置 =====================
U8G2_SSD1306_128X64_NONAME_F_4W_HW_SPI u8g2(U8G2_R0, 15, 16, 0);

// ===================== NTP时间客户端 =====================
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 8 * 3600, 60000);

// ===================== WiFi配置 =====================
const char* ssid = "kiraTheresa";          // 修改为你的WiFi名称
const char* password = "Theresakawaii";    // 修改为你的WiFi密码

// ===================== MQTT配置 =====================
const char* mqtt_server = "192.168.21.4";  // 你的PC IP地址
const int mqtt_port = 1883;
const char* mqtt_username = "";
const char* mqtt_password = "";

// 设备ID（基于MAC地址生成）
String deviceId;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// MQTT主题
String topicConfig;
String topicCommand;
String topicStatus;
String topicResponse;

// ===================== 串口通信 =====================
#define SERIAL_BAUD 9600

// ===================== 药品管理 =====================
#define MAX_MEDICINES 6

struct Medicine {
  char name[16];
  char dosage[8];
  int hour;
  int minute;
  bool taken;
  bool enabled;
  int boxNum;
};

Medicine medicines[MAX_MEDICINES] = {
  {"降压药", "1片", 8, 0, false, true, 1},
  {"降糖药", "1粒", 12, 0, false, true, 1},
  {"维生素", "2粒", 18, 30, false, true, 2},
  {"心脑通", "1粒", 9, 0, false, true, 2},
  {"钙片", "1片", 20, 0, false, true, 1},
  {"鱼油", "1粒", 14, 30, false, true, 2}
};

// ===================== 系统状态 =====================
int currentMedicineIndex = 0;
int remindLevel = 0;
bool emergencyMode = false;
bool wifiConnected = false;
bool timeSynced = false;
bool arduinoReady = false;
bool displayDirty = true;
bool configSynced = false;
bool showingSyncResult = false;
bool inWiFiScreen = false;
bool mqttConnected = false;

unsigned long lastRemindTime = 0;
unsigned long lastTimeSync = 0;
unsigned long lastSecondUpdate = 0;
unsigned long lastArduinoHeartbeat = 0;
unsigned long lastDisplayUpdate = 0;
unsigned long lastConfigSync = 0;
unsigned long lastWiFiCheck = 0;
unsigned long syncResultShowTime = 0;
unsigned long wifiScreenShowTime = 0;
unsigned long lastMqttReconnect = 0;
unsigned long lastMqttHeartbeat = 0;
unsigned long lastStatusSend = 0;

String currentTime = "--:--";
String lastDisplayedTime = "";
int lastSecond = -1;

// ===================== 显示相关函数 =====================
void setupDisplay() {
  u8g2.begin();
  u8g2.setFont(u8g2_font_wqy12_t_gb2312);
  u8g2.setFontRefHeightExtendedText();
  u8g2.setDrawColor(1);
  u8g2.setFontPosTop();
  u8g2.setFontDirection(0);
}

void drawText(int x, int y, const char* text) {
  u8g2.drawUTF8(x, y, text);
}

void drawText(int x, int y, String text) {
  u8g2.drawUTF8(x, y, text.c_str());
}

// ===================== 显示界面函数 =====================
void showBootScreen() {
  u8g2.clearBuffer();
  drawText(30, 10, "智能药盒");
  drawText(15, 30, "MQTT版本");
  drawText(50, 50, "V8.3");
  u8g2.sendBuffer();
  delay(2000);
}

void showMainScreen() {
  u8g2.clearBuffer();
  
  Medicine& med = medicines[currentMedicineIndex];
  
  // 第1行：标题和设备ID
  drawText(25, 0, "智能药盒");
  
  // 第2行：当前时间和MQTT状态
  drawText(0, 14, "时间:");
  if (currentTime.length() >= 5) {
    drawText(36, 14, currentTime.substring(0, 5).c_str());
  } else {
    drawText(36, 14, "--:--");
  }
  
  // MQTT状态指示
  if (mqttConnected) {
    u8g2.drawDisc(120, 18, 2);
  } else {
    u8g2.drawCircle(120, 18, 2);
  }
  
  // 第3行：当前药品
  drawText(0, 28, "当前:");
  if (med.enabled && !med.taken) {
    String medInfo = String(med.name) + "(格" + med.boxNum + ")";
    if (medInfo.length() > 10) {
      medInfo = medInfo.substring(0, 10) + "..";
    }
    drawText(36, 28, medInfo.c_str());
  } else {
    drawText(36, 28, "无");
  }
  
  // 第4行：下次服药
  drawText(0, 42, "下次:");
  bool foundNext = false;
  
  for (int i = 0; i < MAX_MEDICINES; i++) {
    int idx = (currentMedicineIndex + i + 1) % MAX_MEDICINES;
    if (medicines[idx].enabled && !medicines[idx].taken) {
      char nextInfo[40];
      char timePart[10];
      snprintf(timePart, sizeof(timePart), "%02d:%02d", 
              medicines[idx].hour, medicines[idx].minute);
      
      snprintf(nextInfo, sizeof(nextInfo), "%s", timePart);
      drawText(36, 42, nextInfo);
      foundNext = true;
      break;
    }
  }
  
  if (!foundNext) {
    drawText(36, 42, "无");
  }
  
  // 第5行：状态
  drawText(0, 56, "状态:");
  String statusText = "";
  if (emergencyMode) {
    statusText = "紧急!";
  } else if (remindLevel > 0) {
    statusText = "提醒中";
  } else if (mqttConnected) {
    statusText = "在线";
  } else if (wifiConnected) {
    statusText = "WiFi";
  } else {
    statusText = "离线";
  }
  
  drawText(36, 56, statusText.c_str());
  
  u8g2.sendBuffer();
  lastDisplayUpdate = millis();
  displayDirty = false;
}

void showWiFiScreen() {
  u8g2.clearBuffer();
  
  if (wifiConnected) {
    drawText(20, 10, "WiFi连接成功");
    String ipStr = WiFi.localIP().toString();
    int centerX = (128 - u8g2.getUTF8Width(ipStr.c_str())) / 2;
    if (centerX < 0) centerX = 0;
    drawText(centerX, 30, ipStr.c_str());
    drawText(20, 50, "连接MQTT...");
  } else {
    drawText(30, 10, "WiFi连接失败");
    drawText(20, 30, "检查网络配置");
  }
  
  u8g2.sendBuffer();
  lastDisplayUpdate = millis();
  inWiFiScreen = true;
  wifiScreenShowTime = millis();
}

void showSyncScreen(bool success, const char* message) {
  u8g2.clearBuffer();
  
  if (success) {
    drawText(30, 10, "同步成功");
  } else {
    drawText(30, 10, "同步失败");
  }
  
  if (strlen(message) > 0) {
    int centerX = (128 - u8g2.getUTF8Width(message)) / 2;
    if (centerX < 0) centerX = 0;
    drawText(centerX, 30, message);
  }
  
  drawText(20, 50, "返回主界面");
  
  u8g2.sendBuffer();
  lastDisplayUpdate = millis();
  syncResultShowTime = millis();
  showingSyncResult = true;
}

// ===================== 初始化设备ID =====================
void initDeviceId() {
  // 从MAC地址生成设备ID
  deviceId = "medicinebox_" + WiFi.macAddress();
  deviceId.replace(":", "");
  
  // 设置MQTT主题
  topicConfig = "medicinebox/" + deviceId + "/config";
  topicCommand = "medicinebox/" + deviceId + "/command";
  topicStatus = "medicinebox/" + deviceId + "/status";
  topicResponse = "medicinebox/" + deviceId + "/response";
  
  Serial.print("设备ID: ");
  Serial.println(deviceId);
  Serial.print("配置主题: ");
  Serial.println(topicConfig);
  Serial.print("命令主题: ");
  Serial.println(topicCommand);
  Serial.print("状态主题: ");
  Serial.println(topicStatus);
}

// ===================== JSON字符串转义 =====================
String escapeJsonString(String input) {
  String output = "";
  for (unsigned int i = 0; i < input.length(); i++) {
    char c = input.charAt(i);
    switch (c) {
      case '"': output += "\\\""; break;
      case '\\': output += "\\\\"; break;
      case '\b': output += "\\b"; break;
      case '\f': output += "\\f"; break;
      case '\n': output += "\\n"; break;
      case '\r': output += "\\r"; break;
      case '\t': output += "\\t"; break;
      default: output += c;
    }
  }
  return output;
}

// ===================== MQTT回调函数 =====================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  // 创建消息字符串
  char* message = (char*)malloc(length + 1);
  memcpy(message, payload, length);
  message[length] = '\0';
  
  Serial.print("收到MQTT消息 [");
  Serial.print(topic);
  Serial.print("] 长度: ");
  Serial.println(length);
  Serial.print("内容: ");
  Serial.println(message);
  
  // 检查主题类型
  String topicStr = String(topic);
  
  if (topicStr == topicResponse) {
    Serial.println("忽略自己的响应消息");
    free(message);
    return;
  }
  
  if (topicStr == topicConfig) {
    Serial.println("处理配置同步消息...");
    handleConfigMessage(message);
  } else if (topicStr == topicCommand) {
    Serial.println("处理命令消息...");
    handleCommandMessage(message);
  } else if (topicStr == "medicinebox/broadcast") {
    Serial.println("处理广播消息...");
    handleBroadcastMessage(message);
  } else {
    Serial.println("未知主题的消息");
  }
  
  free(message);
}

// ===================== 处理配置消息 =====================
void handleConfigMessage(char* message) {
  DynamicJsonDocument doc(2048);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("JSON解析失败: ");
    Serial.println(error.c_str());
    sendMqttResponse("SYNC_ERROR", "配置解析失败");
    return;
  }
  
  String msgType = doc["type"].as<String>();
  if (msgType != "SYNC_MEDICINES") {
    Serial.println("不是配置同步消息");
    return;
  }
  
  Serial.println("开始同步药品配置...");
  
  JsonArray medicinesArray = doc["medicines"];
  int index = 0;
  
  for (JsonObject med : medicinesArray) {
    if (index >= MAX_MEDICINES) break;
    
    String name = med["name"].as<String>();
    String dosage = med["dosage"].as<String>();
    
    name.toCharArray(medicines[index].name, 16);
    dosage.toCharArray(medicines[index].dosage, 8);
    
    medicines[index].hour = med["hour"];
    medicines[index].minute = med["minute"];
    medicines[index].boxNum = med["boxNum"];
    medicines[index].enabled = med["enabled"];
    medicines[index].taken = false;
    
    Serial.print("更新药品");
    Serial.print(index + 1);
    Serial.print(": ");
    Serial.print(medicines[index].name);
    Serial.print(" (");
    Serial.print(medicines[index].hour);
    Serial.print(":");
    Serial.print(medicines[index].minute);
    Serial.print(") 格");
    Serial.println(medicines[index].boxNum);
    
    index++;
  }
  
  // 填充剩余位置
  for (int i = index; i < MAX_MEDICINES; i++) {
    strcpy(medicines[i].name, "");
    strcpy(medicines[i].dosage, "");
    medicines[i].hour = 0;
    medicines[i].minute = 0;
    medicines[i].boxNum = 1;
    medicines[i].enabled = false;
    medicines[i].taken = false;
  }
  
  configSynced = true;
  displayDirty = true;
  
  sendMqttResponse("SYNC_SUCCESS", "药品配置已更新");
  
  // 发送配置到Arduino
  sendConfigToArduino();
  
  // 显示同步成功
  showSyncScreen(true, "配置已更新");
}

// ===================== 处理命令消息 =====================
void handleCommandMessage(char* message) {
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("JSON解析失败: ");
    Serial.println(error.c_str());
    sendMqttResponse("COMMAND_ERROR", "命令解析失败");
    return;
  }
  
  String msgType = doc["type"].as<String>();
  if (msgType != "COMMAND") {
    Serial.println("不是命令消息");
    return;
  }
  
  String command = doc["command"].as<String>();
  JsonObject data = doc["data"];
  
  Serial.print("执行命令: ");
  Serial.println(command);
  
  if (command == "OPEN_BOX") {
    int boxNum = data["boxNum"] | 1;
    Serial.print("打开药格");
    Serial.println(boxNum);
    Serial.print("OPEN");
    Serial.println(boxNum);
    sendMqttResponse("COMMAND_SUCCESS", "药格已打开");
    
  } else if (command == "CLOSE_BOX") {
    int boxNum = data["boxNum"] | 1;
    Serial.print("关闭药格");
    Serial.println(boxNum);
    Serial.print("CLOSE");
    Serial.println(boxNum);
    sendMqttResponse("COMMAND_SUCCESS", "药格已关闭");
    
  } else if (command == "TEST_BUZZER") {
    int level = data["level"] | 1;
    Serial.print("测试蜂鸣器，级别: ");
    Serial.println(level);
    Serial.print("BUZZ:");
    Serial.println(level);
    sendMqttResponse("COMMAND_SUCCESS", "蜂鸣器测试中");
    
  } else if (command == "GET_STATUS") {
    sendDeviceStatus();
    
  } else if (command == "REBOOT") {
    sendMqttResponse("REBOOTING", "设备正在重启");
    delay(1000);
    ESP.restart();
    
  } else if (command == "GET_CONFIG") {
    sendCurrentConfig();
    
  } else {
    Serial.print("未知命令: ");
    Serial.println(command);
    sendMqttResponse("ERROR", "未知命令");
  }
}

// ===================== 处理广播消息 =====================
void handleBroadcastMessage(char* message) {
  Serial.print("广播消息: ");
  Serial.println(message);
  
  DynamicJsonDocument doc(512);
  DeserializationError error = deserializeJson(doc, message);
  
  if (!error) {
    String msgType = doc["type"].as<String>();
    if (msgType == "BROADCAST") {
      String broadcastMsg = doc["message"].as<String>();
      showSyncScreen(true, broadcastMsg.c_str());
    }
  }
}

// ===================== 发送配置到Arduino =====================
void sendConfigToArduino() {
  Serial.println("发送配置到Arduino...");
  Serial.println("CONFIG_START");
  Serial.println("Medicine medicines[MAX_MEDICINES] = {");
  
  for (int i = 0; i < MAX_MEDICINES; i++) {
    Serial.print("  {\"");
    Serial.print(medicines[i].name);
    Serial.print("\", \"");
    Serial.print(medicines[i].dosage);
    Serial.print("\", ");
    Serial.print(medicines[i].hour);
    Serial.print(", ");
    Serial.print(medicines[i].minute);
    Serial.print(", false, ");
    Serial.print(medicines[i].enabled ? "true" : "false");
    Serial.print(", ");
    Serial.print(medicines[i].boxNum);
    Serial.print("}");
    
    if (i < MAX_MEDICINES - 1) {
      Serial.println(",");
    } else {
      Serial.println();
    }
  }
  
  Serial.println("};");
  Serial.println("CONFIG_END");
  Serial.println("配置发送完成");
}

// ===================== MQTT连接 =====================
void connectMQTT() {
  Serial.println("连接MQTT服务器...");
  
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setBufferSize(2048);
  
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    attempts++;
    Serial.print("MQTT连接尝试 #");
    Serial.print(attempts);
    Serial.print("...");
    
    String clientId = "NodeMCU-" + deviceId;
    
    if (mqttClient.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("成功");
      
      // 订阅主题
      bool sub1 = mqttClient.subscribe(topicConfig.c_str(), 1);
      bool sub2 = mqttClient.subscribe(topicCommand.c_str(), 1);
      bool sub3 = mqttClient.subscribe("medicinebox/broadcast", 1);
      
      Serial.print("订阅状态: config=");
      Serial.print(sub1 ? "成功 " : "失败 ");
      Serial.print("command=");
      Serial.print(sub2 ? "成功 " : "失败 ");
      Serial.print("broadcast=");
      Serial.println(sub3 ? "成功" : "失败");
      
      mqttConnected = true;
      displayDirty = true;
      
      // 发送连接成功消息
      sendMqttResponse("CONNECTED", "设备已连接");
      sendDeviceInfo();
      
      showSyncScreen(true, "MQTT已连接");
      
      break;
    } else {
      Serial.print("失败，状态码: ");
      Serial.println(mqttClient.state());
      delay(2000);
    }
  }
  
  if (!mqttClient.connected()) {
    Serial.println("MQTT连接失败");
    mqttConnected = false;
    displayDirty = true;
    showSyncScreen(false, "MQTT连接失败");
  }
}

// ===================== 发送MQTT消息 =====================
void sendMqttResponse(String responseType, String message) {
  String jsonStr = "{";
  jsonStr += "\"deviceId\":\"" + deviceId + "\",";
  jsonStr += "\"type\":\"RESPONSE\",";
  jsonStr += "\"responseType\":\"" + responseType + "\",";
  jsonStr += "\"message\":\"" + escapeJsonString(message) + "\",";
  jsonStr += "\"timestamp\":" + String(millis());
  jsonStr += "}";
  
  if (mqttClient.publish(topicResponse.c_str(), jsonStr.c_str())) {
    Serial.print("发送响应: ");
    Serial.println(responseType);
  } else {
    Serial.println("响应发送失败");
  }
}

void sendDeviceInfo() {
  String jsonStr = "{";
  jsonStr += "\"deviceId\":\"" + deviceId + "\",";
  jsonStr += "\"type\":\"DEVICE_INFO\",";
  jsonStr += "\"macAddress\":\"" + WiFi.macAddress() + "\",";
  jsonStr += "\"ipAddress\":\"" + WiFi.localIP().toString() + "\",";
  jsonStr += "\"firmwareVersion\":\"V8.3\",";
  jsonStr += "\"maxMedicines\":" + String(MAX_MEDICINES) + ",";
  jsonStr += "\"timestamp\":" + String(millis());
  jsonStr += "}";
  
  mqttClient.publish(topicStatus.c_str(), jsonStr.c_str());
}

void sendDeviceStatus() {
  int activeMedicines = 0;
  for (int i = 0; i < MAX_MEDICINES; i++) {
    if (medicines[i].enabled && !medicines[i].taken) {
      activeMedicines++;
    }
  }
  
  String jsonStr = "{";
  jsonStr += "\"deviceId\":\"" + deviceId + "\",";
  jsonStr += "\"type\":\"STATUS\",";
  jsonStr += "\"wifiConnected\":" + String(wifiConnected ? "true" : "false") + ",";
  jsonStr += "\"mqttConnected\":" + String(mqttConnected ? "true" : "false") + ",";
  jsonStr += "\"timeSynced\":" + String(timeSynced ? "true" : "false") + ",";
  jsonStr += "\"emergencyMode\":" + String(emergencyMode ? "true" : "false") + ",";
  jsonStr += "\"remindLevel\":" + String(remindLevel) + ",";
  jsonStr += "\"arduinoReady\":" + String(arduinoReady ? "true" : "false") + ",";
  jsonStr += "\"activeMedicines\":" + String(activeMedicines) + ",";
  jsonStr += "\"timestamp\":" + String(millis());
  
  if (timeSynced) {
    jsonStr += ",\"currentTime\":\"" + currentTime + "\"";
  }
  
  jsonStr += "}";
  
  mqttClient.publish(topicStatus.c_str(), jsonStr.c_str());
}

void sendCurrentConfig() {
  String jsonStr = "{";
  jsonStr += "\"deviceId\":\"" + deviceId + "\",";
  jsonStr += "\"type\":\"CONFIG\",";
  jsonStr += "\"timestamp\":" + String(millis()) + ",";
  jsonStr += "\"medicines\":[";
  
  for (int i = 0; i < MAX_MEDICINES; i++) {
    jsonStr += "{";
    jsonStr += "\"name\":\"" + escapeJsonString(String(medicines[i].name)) + "\",";
    jsonStr += "\"dosage\":\"" + escapeJsonString(String(medicines[i].dosage)) + "\",";
    jsonStr += "\"hour\":" + String(medicines[i].hour) + ",";
    jsonStr += "\"minute\":" + String(medicines[i].minute) + ",";
    jsonStr += "\"boxNum\":" + String(medicines[i].boxNum) + ",";
    jsonStr += "\"enabled\":" + String(medicines[i].enabled ? "true" : "false") + ",";
    jsonStr += "\"taken\":" + String(medicines[i].taken ? "true" : "false");
    jsonStr += "}";
    
    if (i < MAX_MEDICINES - 1) {
      jsonStr += ",";
    }
  }
  
  jsonStr += "]}";
  
  mqttClient.publish(topicResponse.c_str(), jsonStr.c_str());
}

// ===================== 时间管理 =====================
bool updateTime() {
  if (wifiConnected && timeSynced) {
    int hours = timeClient.getHours();
    int minutes = timeClient.getMinutes();
    int seconds = timeClient.getSeconds();
    
    char timeStr[9];
    snprintf(timeStr, sizeof(timeStr), "%02d:%02d:%02d", hours, minutes, seconds);
    currentTime = String(timeStr);
    
    if (seconds != lastSecond) {
      lastSecond = seconds;
      return true;
    }
  } else {
    currentTime = "--:--";
  }
  return false;
}

bool syncNTPTime() {
  if (!wifiConnected) return false;
  
  for (int i = 0; i < 3; i++) {
    if (timeClient.forceUpdate()) {
      if (timeClient.getEpochTime() > 1600000000) {
        timeSynced = true;
        Serial.println("NTP时间同步成功");
        return true;
      }
    }
    delay(1000);
  }
  
  timeSynced = false;
  Serial.println("NTP时间同步失败");
  return false;
}

// ===================== 网络连接 =====================
void connectWiFi() {
  Serial.println("连接WiFi...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    timeClient.begin();
    
    if (syncNTPTime()) {
      lastTimeSync = millis();
    }
    
    Serial.println("WiFi连接成功");
    Serial.print("IP地址: ");
    Serial.println(WiFi.localIP());
    
  } else {
    wifiConnected = false;
    timeSynced = false;
    Serial.println("WiFi连接失败");
    displayDirty = true;
  }
}

// ===================== 串口处理 =====================
String serialBuffer = "";

void handleSerial() {
  while (Serial.available()) {
    char c = Serial.read();
    
    if (c == '\n') {
      String msg = serialBuffer;
      serialBuffer = "";
      msg.trim();
      
      if (msg.length() > 0) {
        processSerialMessage(msg);
      }
    } else if (c != '\r') {
      serialBuffer += c;
      
      if (serialBuffer.length() > 100) {
        serialBuffer = "";
      }
    }
  }
}

void processSerialMessage(String msg) {
  // 过滤心跳消息，不转发
  if (msg == "HBT" || msg == "HEARTBEAT" || msg == "PING") {
    lastArduinoHeartbeat = millis();
    arduinoReady = true;
    return;
  }
  
  Serial.print("Arduino: ");
  Serial.println(msg);
  
  // 处理重要消息
  if (msg == "TAKEN") {
    if (currentMedicineIndex < MAX_MEDICINES) {
      medicines[currentMedicineIndex].taken = true;
    }
    remindLevel = 0;
    emergencyMode = false;
    displayDirty = true;
    
    sendMqttResponse("MEDICINE_TAKEN", "药品已服用");
    
    for (int i = 1; i <= MAX_MEDICINES; i++) {
      int idx = (currentMedicineIndex + i) % MAX_MEDICINES;
      if (medicines[idx].enabled && !medicines[idx].taken) {
        currentMedicineIndex = idx;
        break;
      }
    }
    
  } else if (msg == "EMERGENCY") {
    emergencyMode = true;
    remindLevel = 0;
    displayDirty = true;
    sendMqttResponse("EMERGENCY_ACTIVATED", "紧急状态已激活");
    
  } else if (msg == "EMERGENCY_CANCEL") {
    emergencyMode = false;
    Serial.println("BUZZ_OFF");
    displayDirty = true;
    sendMqttResponse("EMERGENCY_CANCELED", "紧急状态已取消");
    
  } else if (msg == "ARDUINO_READY" || msg == "READY") {
    arduinoReady = true;
    lastArduinoHeartbeat = millis();
    displayDirty = true;
    sendMqttResponse("ARDUINO_READY", "Arduino已就绪");
    
  } else if (msg.startsWith("OK:")) {
    // Arduino命令响应
    sendMqttResponse("ARDUINO_RESPONSE", msg);
    
  } else if (msg == "CONFIG_START" || msg == "CONFIG_END") {
    // 配置相关，不转发
    
  } else {
    // 其他消息，选择性转发
    if (msg.indexOf("HBT") == -1 && 
        msg.indexOf("CONFIG") == -1 &&
        msg.length() > 2) {
      sendMqttResponse("ARDUINO_MESSAGE", msg);
    }
  }
}

// ===================== 检查服药时间 =====================
void checkMedicationTime() {
  if (!timeSynced || emergencyMode || remindLevel > 0) return;
  
  int currentHour = timeClient.getHours();
  int currentMinute = timeClient.getMinutes();
  
  for (int i = 0; i < MAX_MEDICINES; i++) {
    if (medicines[i].enabled && !medicines[i].taken &&
        medicines[i].hour == currentHour && 
        medicines[i].minute == currentMinute) {
      
      currentMedicineIndex = i;
      remindLevel = 1;
      lastRemindTime = millis();
      
      Serial.println("BUZZ:1");
      
      char boxCmd[20];
      snprintf(boxCmd, sizeof(boxCmd), "SET_BOX:%d", medicines[i].boxNum);
      Serial.println(boxCmd);
      
      sendMqttResponse("MEDICINE_REMINDER", 
        String("服药时间到: ") + medicines[i].name);
      
      displayDirty = true;
      break;
    }
  }
}

// ===================== 主程序 =====================
void setup() {
  Serial.begin(SERIAL_BAUD);
  delay(2000);
  
  pinMode(2, OUTPUT);
  digitalWrite(2, HIGH);
  
  setupDisplay();
  showBootScreen();
  
  Serial.println("智能药盒系统启动...");
  Serial.println("版本: V8.3 完整修复版");
  Serial.println("================================");
  
  connectWiFi();
  initDeviceId();
  
  if (wifiConnected) {
    connectMQTT();
  }
  
  delay(3000);
  Serial.println("HELLO");
  
  displayDirty = true;
  
  if (mqttConnected) {
    sendMqttResponse("SYSTEM_READY", "系统已就绪");
  }
  
  Serial.println("NODEMCU_READY");
  Serial.println("设备ID: " + deviceId);
  Serial.println("================================");
}

void loop() {
  handleSerial();
  
  // MQTT连接维护
  if (wifiConnected) {
    if (!mqttClient.connected()) {
      if (millis() - lastMqttReconnect > 10000) {
        lastMqttReconnect = millis();
        Serial.println("MQTT断开，尝试重连...");
        connectMQTT();
      }
    } else {
      mqttClient.loop();
      mqttConnected = true;
      
      // 定期发送状态
      if (millis() - lastStatusSend > 30000) {
        sendDeviceStatus();
        lastStatusSend = millis();
      }
    }
  }
  
  // Arduino心跳
  static unsigned long lastHeartbeatSend = 0;
  if (millis() - lastHeartbeatSend > 5000) {
    if (arduinoReady) {
      Serial.println("PING");
    } else {
      Serial.println("HELLO");
    }
    lastHeartbeatSend = millis();
  }
  
  // Arduino连接检查
  static unsigned long lastArduinoCheck = 0;
  if (millis() - lastArduinoCheck > 10000) {
    if (arduinoReady && millis() - lastArduinoHeartbeat > 30000) {
      arduinoReady = false;
      displayDirty = true;
      sendMqttResponse("ARDUINO_DISCONNECTED", "Arduino连接断开");
    }
    lastArduinoCheck = millis();
  }
  
  // 时间更新
  unsigned long now = millis();
  if (now - lastSecondUpdate >= 1000) {
    lastSecondUpdate = now;
    
    if (wifiConnected) {
      timeClient.update();
      bool timeChanged = updateTime();
      
      if (timeSynced) {
        checkMedicationTime();
      }
    }
  }
  
  // 提醒升级
  if (remindLevel > 0) {
    unsigned long remindDuration = now - lastRemindTime;
    
    if (remindLevel == 1 && remindDuration > 1800000) {
      remindLevel = 2;
      lastRemindTime = now;
      Serial.println("BUZZ:2");
      displayDirty = true;
      sendMqttResponse("REMINDER_LEVEL_UP", "提醒级别升级到2");
      
    } else if (remindLevel == 2 && remindDuration > 3600000) {
      remindLevel = 3;
      lastRemindTime = now;
      Serial.println("BUZZ:3");
      displayDirty = true;
      sendMqttResponse("REMINDER_LEVEL_UP", "提醒级别升级到3");
    }
  }
  
  // 显示更新
  if (inWiFiScreen && now - wifiScreenShowTime > 3000) {
    inWiFiScreen = false;
    displayDirty = true;
  }
  
  if (showingSyncResult && now - syncResultShowTime > 2000) {
    showingSyncResult = false;
    displayDirty = true;
  }
  
  if (displayDirty || now - lastDisplayUpdate > 3000) {
    if (inWiFiScreen) {
      showWiFiScreen();
    } else if (showingSyncResult) {
      // 继续显示同步结果
    } else {
      showMainScreen();
    }
  }
  
  // NTP时间同步
  if (timeSynced && now - lastTimeSync > 1800000) {
    syncNTPTime();
    lastTimeSync = now;
  }
  
  // WiFi重连
  if (!wifiConnected && now - lastWiFiCheck > 60000) {
    connectWiFi();
    lastWiFiCheck = now;
  }
  
  // LED状态指示
  static unsigned long lastBlink = 0;
  unsigned long blinkInterval = 0;
  
  if (emergencyMode) {
    blinkInterval = 200;
  } else if (remindLevel > 0) {
    blinkInterval = 500;
  } else if (mqttConnected) {
    blinkInterval = 1000;
  } else if (wifiConnected) {
    blinkInterval = 2000;
  } else {
    digitalWrite(2, LOW);
  }
  
  if (blinkInterval > 0 && now - lastBlink > blinkInterval) {
    digitalWrite(2, !digitalRead(2));
    lastBlink = now;
  }
  
  delay(50);
}