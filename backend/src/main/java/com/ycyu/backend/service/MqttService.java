package com.ycyu.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ycyu.backend.dto.MedicineDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MqttService {

    @Autowired
    private MqttGateway mqttGateway;

    @Autowired
    private ObjectMapper objectMapper;

    // 存储在线设备
    private final Map<String, Long> onlineDevices = new ConcurrentHashMap<>();

    // 获取在线设备列表
    public List<String> getOnlineDevices() {
        List<String> devices = new ArrayList<>();
        long now = System.currentTimeMillis();

        // 移除超过60秒没有心跳的设备
        onlineDevices.entrySet().removeIf(entry -> now - entry.getValue() > 60000);

        devices.addAll(onlineDevices.keySet());
        return devices;
    }

    // 更新设备在线状态
    public void updateDeviceStatus(String deviceId) {
        onlineDevices.put(deviceId, System.currentTimeMillis());
        System.out.println("📱 设备在线: " + deviceId);
    }

    // 同步药品配置到指定设备
    public void syncMedicinesToDevice(String deviceId, List<MedicineDTO> medicines) {
        try {
            System.out.println("========== 开始同步药品配置 ==========");
            System.out.println("设备ID: " + deviceId);
            System.out.println("药品数量: " + medicines.size());

            for (int i = 0; i < medicines.size(); i++) {
                MedicineDTO med = medicines.get(i);
                System.out.println("药品" + (i+1) + ": " + med.getName() +
                        ", 时间: " + med.getHour() + ":" + med.getMinute() +
                        ", 药格: " + med.getBoxNum());
            }

            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "SYNC_MEDICINES");
            payload.put("deviceId", deviceId);
            payload.put("medicines", medicines);
            payload.put("timestamp", System.currentTimeMillis());

            String message = objectMapper.writeValueAsString(payload);
            String topic = "medicinebox/" + deviceId + "/config";

            System.out.println("发送到主题: " + topic);
            System.out.println("消息内容: " + message);

            mqttGateway.sendToMqtt(topic, 1, message);
            System.out.println("✅ 同步命令已发送");

        } catch (JsonProcessingException e) {
            System.err.println("❌ JSON序列化失败: " + e.getMessage());
            throw new RuntimeException("JSON序列化失败", e);
        } catch (Exception e) {
            System.err.println("❌ MQTT消息发送失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("MQTT消息发送失败", e);
        }
    }

    // 发送命令到设备
    public void sendCommand(String deviceId, String command, Object data) {
        try {
            System.out.println("========== 发送命令 ==========");
            System.out.println("设备ID: " + deviceId);
            System.out.println("命令: " + command);
            System.out.println("数据: " + objectMapper.writeValueAsString(data));

            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "COMMAND");
            payload.put("command", command);
            payload.put("data", data);
            payload.put("timestamp", System.currentTimeMillis());

            String message = objectMapper.writeValueAsString(payload);
            String topic = "medicinebox/" + deviceId + "/command";

            System.out.println("发送到主题: " + topic);
            System.out.println("消息内容: " + message);

            mqttGateway.sendToMqtt(topic, 1, message);
            System.out.println("✅ 命令已发送");

        } catch (JsonProcessingException e) {
            System.err.println("❌ JSON序列化失败: " + e.getMessage());
            throw new RuntimeException("JSON序列化失败", e);
        } catch (Exception e) {
            System.err.println("❌ MQTT命令发送失败: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("MQTT命令发送失败", e);
        }
    }

    // 广播消息到所有设备
    public void broadcast(String message) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "BROADCAST");
            payload.put("message", message);
            payload.put("timestamp", System.currentTimeMillis());

            String jsonMessage = objectMapper.writeValueAsString(payload);
            mqttGateway.sendToMqtt("medicinebox/broadcast", jsonMessage);
        } catch (Exception e) {
            throw new RuntimeException("MQTT广播失败", e);
        }
    }
}