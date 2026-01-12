/*
 * Arduino Uno - 智能药盒控制（修复版本）
 * 避免消息循环，简化串口通信
 */

#include <Servo.h>

// ===================== 引脚定义 =====================
#define SERVO1_PIN    9   // 舵机1 - 药格1
#define SERVO2_PIN    8   // 舵机2 - 药格2
#define BUZZER_PIN   10   // 有源蜂鸣器
#define LED1_PIN     11   // 红色LED - 药格1指示
#define LED2_PIN     7    // 绿色LED - 药格2指示
#define BUTTON_PIN   12   // 按钮（内部上拉）

// ===================== 系统状态 =====================
enum SystemState {
  STATE_IDLE,
  STATE_REMIND_LEVEL1,
  STATE_REMIND_LEVEL2,
  STATE_REMIND_LEVEL3,
  STATE_EMERGENCY,
  STATE_MEDICINE_TAKEN,
  STATE_MANUAL_OPEN,
  STATE_MANUAL_CLOSE,
  STATE_UPDATING_CONFIG
};

SystemState currentState = STATE_IDLE;

// ===================== 硬件对象 =====================
Servo medicineServo1;
Servo medicineServo2;

// ===================== 计时变量 =====================
unsigned long buttonPressStart = 0;
bool buttonPressed = false;
bool longPressDetected = false;
unsigned long lastBuzzTime = 0;
unsigned long lastHeartbeat = 0;
unsigned long emergencyStartTime = 0;
unsigned long lastDebounceTime = 0;
unsigned long manualOperationTime = 0;
unsigned long configUpdateStart = 0;
const unsigned long debounceDelay = 50;

// ===================== 药格状态 =====================
bool box1Open = false;
bool box2Open = false;
int currentBox = 1;
unsigned long lastShortPressTime = 0;

// ===================== 药品配置缓存 =====================
#define MAX_MEDICINES 6
struct MedicineConfig {
  char name[16];
  char dosage[8];
  int hour;
  int minute;
  int boxNum;
  bool enabled;
};

MedicineConfig medicineConfigs[MAX_MEDICINES];
int medicineCount = 0;
bool configUpdated = false;

// ===================== 初始化 =====================
void setup() {
  Serial.begin(9600);
  delay(2000);
  
  // 清空串口缓冲区
  while (Serial.available()) {
    Serial.read();
  }
  
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED1_PIN, OUTPUT);
  pinMode(LED2_PIN, OUTPUT);
  
  medicineServo1.attach(SERVO1_PIN);
  medicineServo2.attach(SERVO2_PIN);
  closeAllBoxes();
  
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  
  // 初始化默认配置
  initDefaultConfig();
  
  delay(1000);
  Serial.println("ARDUINO_READY");
  
  // 启动音
  tone(BUZZER_PIN, 1000, 200);
  delay(300);
  tone(BUZZER_PIN, 1500, 300);
  delay(400);
  digitalWrite(BUZZER_PIN, LOW);
}

// 初始化默认配置
void initDefaultConfig() {
  medicineCount = 6;
  
  // 默认配置
  MedicineConfig defaults[] = {
    {"降压药", "1片", 8, 0, 1, true},
    {"降糖药", "1粒", 12, 0, 1, true},
    {"维生素", "2粒", 18, 30, 2, true},
    {"心脑通", "1粒", 9, 0, 2, true},
    {"钙片", "1片", 20, 0, 1, true},
    {"鱼油", "1粒", 14, 30, 2, true}
  };
  
  for (int i = 0; i < medicineCount; i++) {
    medicineConfigs[i] = defaults[i];
  }
  
  Serial.println("默认配置已加载");
}

// ===================== 解析配置更新 =====================
void parseConfigUpdate(String configStr) {
  Serial.println("开始解析配置更新...");
  
  // 清除旧配置
  medicineCount = 0;
  
  int startPos = configStr.indexOf('{');
  int endPos = configStr.lastIndexOf('}');
  
  if (startPos == -1 || endPos == -1) {
    Serial.println("配置格式错误");
    return;
  }
  
  String configArray = configStr.substring(startPos, endPos + 1);
  
  int pos = 0;
  int itemCount = 0;
  
  while (itemCount < MAX_MEDICINES && pos < configArray.length()) {
    int itemStart = configArray.indexOf('{', pos);
    int itemEnd = configArray.indexOf('}', pos);
    
    if (itemStart == -1 || itemEnd == -1) break;
    
    String item = configArray.substring(itemStart + 1, itemEnd);
    item.trim();
    
    // 解析药品信息
    int quote1 = item.indexOf('"');
    int quote2 = item.indexOf('"', quote1 + 1);
    int quote3 = item.indexOf('"', quote2 + 1);
    int quote4 = item.indexOf('"', quote3 + 1);
    
    if (quote1 != -1 && quote2 != -1 && quote3 != -1 && quote4 != -1) {
      String name = item.substring(quote1 + 1, quote2);
      String dosage = item.substring(quote3 + 1, quote4);
      
      name.toCharArray(medicineConfigs[itemCount].name, 16);
      dosage.toCharArray(medicineConfigs[itemCount].dosage, 8);
      
      // 解析其他字段
      String remaining = item.substring(quote4 + 1);
      int comma1 = remaining.indexOf(',');
      int comma2 = remaining.indexOf(',', comma1 + 1);
      int comma3 = remaining.indexOf(',', comma2 + 1);
      int comma4 = remaining.indexOf(',', comma3 + 1);
      int comma5 = remaining.indexOf(',', comma4 + 1);
      
      if (comma1 != -1 && comma5 != -1) {
        medicineConfigs[itemCount].hour = remaining.substring(comma1 + 1, comma2).toInt();
        medicineConfigs[itemCount].minute = remaining.substring(comma2 + 1, comma3).toInt();
        
        String enabledStr = remaining.substring(comma4 + 1, comma5);
        medicineConfigs[itemCount].enabled = (enabledStr == "true");
        
        medicineConfigs[itemCount].boxNum = remaining.substring(comma5 + 1).toInt();
        
        itemCount++;
      }
    }
    
    pos = itemEnd + 1;
  }
  
  medicineCount = itemCount;
  configUpdated = true;
  
  Serial.print("配置更新完成，共 ");
  Serial.print(medicineCount);
  Serial.println(" 个药品");
  
  // 播放更新成功音效
  playUpdateSuccessTone();
}

// ===================== 切换药盒开关 =====================
void toggleMedicineBox() {
  stopAllAlerts();
  
  bool boxToToggle = (currentBox == 1) ? box1Open : box2Open;
  
  if (!boxToToggle) {
    openBox(currentBox);
    currentState = STATE_MANUAL_OPEN;
  } else {
    closeBox(currentBox);
    currentState = STATE_MANUAL_CLOSE;
  }
  
  manualOperationTime = millis();
  playToggleTone();
}

// ===================== 主循环 =====================
void loop() {
  unsigned long now = millis();
  
  handleButton();
  handleSerialCommands();
  handleStateMachine();
  
  // 每5秒发送心跳
  if (now - lastHeartbeat > 5000) {
    Serial.println("HBT");  // 简化的心跳，避免被转发
    lastHeartbeat = now;
  }
  
  // 90秒后自动取消紧急状态
  if (currentState == STATE_EMERGENCY && 
      now - emergencyStartTime > 90000) {
    cancelEmergency();
  }
  
  // 手动操作5秒后返回空闲状态
  if ((currentState == STATE_MANUAL_OPEN || currentState == STATE_MANUAL_CLOSE) &&
      now - manualOperationTime > 5000) {
    currentState = STATE_IDLE;
  }
  
  // 配置更新状态处理
  if (currentState == STATE_UPDATING_CONFIG) {
    if (now - configUpdateStart > 3000) {
      currentState = STATE_IDLE;
      digitalWrite(LED1_PIN, LOW);
      digitalWrite(LED2_PIN, LOW);
    }
  }
  
  delay(10);
}

// ===================== 按钮处理函数 =====================
void handleButton() {
  int buttonState = digitalRead(BUTTON_PIN);
  static int lastButtonState = HIGH;
  
  // 防抖处理
  if (buttonState != lastButtonState) {
    lastDebounceTime = millis();
  }
  
  if ((millis() - lastDebounceTime) > debounceDelay) {
    if (buttonState == LOW && !buttonPressed) {
      buttonPressStart = millis();
      buttonPressed = true;
      longPressDetected = false;
      
    } else if (buttonState == HIGH && buttonPressed) {
      unsigned long pressDuration = millis() - buttonPressStart;
      buttonPressed = false;
      
      if (longPressDetected) {
        // 长按释放已处理
      } else if (pressDuration > 50 && pressDuration < 1000) {
        handleShortPress();
      }
    }
    
    // 长按检测（3秒）
    if (buttonPressed && !longPressDetected && 
        (millis() - buttonPressStart) > 3000) {
      longPressDetected = true;
      handleLongPress();
    }
  }
  
  lastButtonState = buttonState;
}

// ===================== 处理短按 =====================
void handleShortPress() {
  // 防止连续短按
  if (millis() - lastShortPressTime < 300) {
    return;
  }
  lastShortPressTime = millis();
  
  if (currentState == STATE_REMIND_LEVEL1 || 
      currentState == STATE_REMIND_LEVEL2 || 
      currentState == STATE_REMIND_LEVEL3) {
    confirmMedication();
    
  } else if (currentState == STATE_EMERGENCY) {
    // 紧急状态下忽略短按
    
  } else {
    toggleMedicineBox();
  }
}

// ===================== 处理长按 =====================
void handleLongPress() {
  if (currentState == STATE_EMERGENCY) {
    cancelEmergency();
  } else {
    triggerEmergency();
  }
}

// ===================== 取消紧急状态 =====================
void cancelEmergency() {
  stopAllAlerts();
  playCancelTone();
  Serial.println("EMERGENCY_CANCEL");
  currentState = STATE_IDLE;
  emergencyStartTime = 0;
}

// ===================== 串口命令处理（简化版本） =====================
void handleSerialCommands() {
  while (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    
    if (command.length() == 0) continue;
    
    // 简化处理，避免复杂输出
    if (command == "ARDUINO_HELLO") {
      Serial.println("READY");
      
    } else if (command == "HEARTBEAT") {
      // 心跳不需要回复
      
    } else if (command == "OPEN1") {
      openBox(1);
      currentState = STATE_MANUAL_OPEN;
      manualOperationTime = millis();
      Serial.println("OK:OPEN1");
      
    } else if (command == "OPEN2") {
      openBox(2);
      currentState = STATE_MANUAL_OPEN;
      manualOperationTime = millis();
      Serial.println("OK:OPEN2");
      
    } else if (command == "CLOSE1") {
      closeBox(1);
      currentState = STATE_MANUAL_CLOSE;
      manualOperationTime = millis();
      Serial.println("OK:CLOSE1");
      
    } else if (command == "CLOSE2") {
      closeBox(2);
      currentState = STATE_MANUAL_CLOSE;
      manualOperationTime = millis();
      Serial.println("OK:CLOSE2");
      
    } else if (command.startsWith("BUZZ:")) {
      int level = command.substring(5).toInt();
      setReminderLevel(level);
      Serial.print("OK:BUZZ:");
      Serial.println(level);
      
    } else if (command == "BUZZ_OFF") {
      stopAllAlerts();
      currentState = STATE_IDLE;
      Serial.println("OK:BUZZ_OFF");
      
    } else if (command.startsWith("SET_BOX:")) {
      currentBox = command.substring(8).toInt();
      if (currentBox < 1) currentBox = 1;
      if (currentBox > 2) currentBox = 2;
      Serial.print("OK:BOX");
      Serial.println(currentBox);
      
    } else if (command == "TAKEN") {
      playConfirmTone();
      Serial.println("OK:TAKEN");
      
    } else if (command == "EMERGENCY") {
      triggerEmergency();
      Serial.println("OK:EMERGENCY");
      
    } else if (command == "UPDATE_CONFIG") {
      handleConfigUpdate();
      Serial.println("OK:UPDATE");
      
    } else if (command.startsWith("CONFIG:")) {
      String configData = command.substring(7);
      parseConfigUpdate(configData);
      Serial.println("OK:CONFIG");
      
    } else if (command == "GET_CONFIG") {
      sendCurrentConfig();
    }
  }
}

// ===================== 处理配置更新 =====================
void handleConfigUpdate() {
  currentState = STATE_UPDATING_CONFIG;
  configUpdateStart = millis();
  
  // 闪烁LED指示更新状态
  digitalWrite(LED1_PIN, HIGH);
  digitalWrite(LED2_PIN, HIGH);
  delay(500);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  
  Serial.println("READY_CONFIG");
}

// ===================== 发送当前配置 =====================
void sendCurrentConfig() {
  Serial.println("CONFIG_START");
  Serial.println("Medicine medicines[MAX_MEDICINES] = {");
  
  for (int i = 0; i < medicineCount && i < MAX_MEDICINES; i++) {
    Serial.print("  {\"");
    Serial.print(medicineConfigs[i].name);
    Serial.print("\", \"");
    Serial.print(medicineConfigs[i].dosage);
    Serial.print("\", ");
    Serial.print(medicineConfigs[i].hour);
    Serial.print(", ");
    Serial.print(medicineConfigs[i].minute);
    Serial.print(", false, ");
    Serial.print(medicineConfigs[i].enabled ? "true" : "false");
    Serial.print(", ");
    Serial.print(medicineConfigs[i].boxNum);
    Serial.print("}");
    
    if (i < medicineCount - 1 && i < MAX_MEDICINES - 1) {
      Serial.println(",");
    } else {
      Serial.println();
    }
  }
  
  // 如果药品不足，填充空数据
  for (int i = medicineCount; i < MAX_MEDICINES; i++) {
    Serial.print("  {\"\", \"\", 0, 0, false, false, 1}");
    if (i < MAX_MEDICINES - 1) {
      Serial.println(",");
    } else {
      Serial.println();
    }
  }
  
  Serial.println("};");
  Serial.println("CONFIG_END");
}

// ===================== 状态机处理 =====================
void handleStateMachine() {
  unsigned long now = millis();
  
  switch (currentState) {
    case STATE_IDLE:
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED1_PIN, box1Open ? HIGH : LOW);
      digitalWrite(LED2_PIN, box2Open ? HIGH : LOW);
      break;
      
    case STATE_REMIND_LEVEL1:
      if (now - lastBuzzTime > 5000) {
        tone(BUZZER_PIN, 1000, 200);
        if (currentBox == 1) digitalWrite(LED1_PIN, HIGH);
        else digitalWrite(LED2_PIN, HIGH);
        delay(200);
        digitalWrite(LED1_PIN, LOW);
        digitalWrite(LED2_PIN, LOW);
        lastBuzzTime = now;
      }
      break;
      
    case STATE_REMIND_LEVEL2:
      if (now - lastBuzzTime > 2000) {
        tone(BUZZER_PIN, 1200, 500);
        if (currentBox == 1) digitalWrite(LED1_PIN, HIGH);
        else digitalWrite(LED2_PIN, HIGH);
        delay(500);
        digitalWrite(LED1_PIN, LOW);
        digitalWrite(LED2_PIN, LOW);
        lastBuzzTime = now;
      }
      break;
      
    case STATE_REMIND_LEVEL3:
      if (now - lastBuzzTime > 1000) {
        digitalWrite(BUZZER_PIN, HIGH);
        if (currentBox == 1) {
          digitalWrite(LED1_PIN, !digitalRead(LED1_PIN));
          digitalWrite(LED2_PIN, LOW);
        } else {
          digitalWrite(LED2_PIN, !digitalRead(LED2_PIN));
          digitalWrite(LED1_PIN, LOW);
        }
        lastBuzzTime = now;
      }
      break;
      
    case STATE_EMERGENCY:
      digitalWrite(BUZZER_PIN, HIGH);
      if (now - lastBuzzTime > 250) {
        digitalWrite(LED1_PIN, !digitalRead(LED1_PIN));
        digitalWrite(LED2_PIN, !digitalRead(LED2_PIN));
        lastBuzzTime = now;
      }
      break;
      
    case STATE_MEDICINE_TAKEN:
      playConfirmTone();
      currentState = STATE_IDLE;
      break;
      
    case STATE_MANUAL_OPEN:
      digitalWrite(BUZZER_PIN, LOW);
      if (currentBox == 1) {
        digitalWrite(LED1_PIN, HIGH);
        digitalWrite(LED2_PIN, LOW);
      } else {
        digitalWrite(LED1_PIN, LOW);
        digitalWrite(LED2_PIN, HIGH);
      }
      break;
      
    case STATE_MANUAL_CLOSE:
      digitalWrite(BUZZER_PIN, LOW);
      if (currentBox == 1) {
        digitalWrite(LED1_PIN, LOW);
      } else {
        digitalWrite(LED2_PIN, LOW);
      }
      break;
      
    case STATE_UPDATING_CONFIG:
      // LED交替闪烁表示更新中
      if (now - lastBuzzTime > 500) {
        digitalWrite(LED1_PIN, !digitalRead(LED1_PIN));
        digitalWrite(LED2_PIN, !digitalRead(LED2_PIN));
        lastBuzzTime = now;
      }
      break;
  }
}

// ===================== 设置提醒级别 =====================
void setReminderLevel(int level) {
  stopAllAlerts();
  
  switch (level) {
    case 1:
      currentState = STATE_REMIND_LEVEL1;
      break;
    case 2:
      currentState = STATE_REMIND_LEVEL2;
      break;
    case 3:
      currentState = STATE_REMIND_LEVEL3;
      break;
    default:
      currentState = STATE_IDLE;
  }
  
  lastBuzzTime = millis();
}

// ===================== 确认服药 =====================
void confirmMedication() {
  stopAllAlerts();
  openBox(currentBox);
  delay(2000);
  closeBox(currentBox);
  playConfirmTone();
  Serial.println("TAKEN");
  currentState = STATE_MEDICINE_TAKEN;
}

// ===================== 触发紧急状态 =====================
void triggerEmergency() {
  stopAllAlerts();
  currentState = STATE_EMERGENCY;
  emergencyStartTime = millis();
  Serial.println("EMERGENCY");
}

// ===================== 药盒控制函数 =====================
void openBox(int boxNum) {
  if (boxNum == 1) {
    medicineServo1.write(90);
    box1Open = true;
    digitalWrite(LED1_PIN, HIGH);
  } else if (boxNum == 2) {
    medicineServo2.write(90);
    box2Open = true;
    digitalWrite(LED2_PIN, HIGH);
  }
  delay(500);
}

void closeBox(int boxNum) {
  if (boxNum == 1) {
    medicineServo1.write(0);
    box1Open = false;
    digitalWrite(LED1_PIN, LOW);
  } else if (boxNum == 2) {
    medicineServo2.write(0);
    box2Open = false;
    digitalWrite(LED2_PIN, LOW);
  }
  delay(500);
}

void openAllBoxes() {
  medicineServo1.write(90);
  medicineServo2.write(90);
  box1Open = true;
  box2Open = true;
  digitalWrite(LED1_PIN, HIGH);
  digitalWrite(LED2_PIN, HIGH);
  delay(500);
}

void closeAllBoxes() {
  medicineServo1.write(0);
  medicineServo2.write(0);
  box1Open = false;
  box2Open = false;
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  delay(500);
}

// ===================== 音效函数 =====================
void playToggleTone() {
  tone(BUZZER_PIN, 1200, 150);
  if (currentBox == 1) {
    digitalWrite(LED1_PIN, HIGH);
    delay(200);
    digitalWrite(LED1_PIN, LOW);
  } else {
    digitalWrite(LED2_PIN, HIGH);
    delay(200);
    digitalWrite(LED2_PIN, LOW);
  }
  digitalWrite(BUZZER_PIN, LOW);
}

void playConfirmTone() {
  for (int i = 0; i < 2; i++) {
    tone(BUZZER_PIN, 1500, 100);
    digitalWrite(LED1_PIN, HIGH);
    digitalWrite(LED2_PIN, HIGH);
    delay(150);
    digitalWrite(LED1_PIN, LOW);
    digitalWrite(LED2_PIN, LOW);
    delay(50);
  }
  
  tone(BUZZER_PIN, 1500, 300);
  digitalWrite(LED1_PIN, HIGH);
  digitalWrite(LED2_PIN, HIGH);
  delay(350);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
}

void playCancelTone() {
  for (int i = 0; i < 3; i++) {
    tone(BUZZER_PIN, 1200 - i * 300, 200);
    delay(250);
  }
  digitalWrite(BUZZER_PIN, LOW);
  delay(300);
}

void playUpdateSuccessTone() {
  tone(BUZZER_PIN, 1000, 100);
  delay(150);
  tone(BUZZER_PIN, 1500, 100);
  delay(150);
  tone(BUZZER_PIN, 2000, 200);
  delay(300);
  digitalWrite(BUZZER_PIN, LOW);
  
  // LED闪烁庆祝
  for (int i = 0; i < 3; i++) {
    digitalWrite(LED1_PIN, HIGH);
    digitalWrite(LED2_PIN, HIGH);
    delay(200);
    digitalWrite(LED1_PIN, LOW);
    digitalWrite(LED2_PIN, LOW);
    delay(200);
  }
}

// ===================== 系统控制函数 =====================
void stopAllAlerts() {
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED1_PIN, LOW);
  digitalWrite(LED2_PIN, LOW);
  noTone(BUZZER_PIN);
}