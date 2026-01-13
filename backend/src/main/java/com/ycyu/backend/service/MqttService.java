package com.ycyu.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ycyu.backend.dto.DeviceStatusDTO;
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

    // 存储设备状态
    private final Map<String, DeviceStatusDTO> deviceStatusMap = new ConcurrentHashMap<>();

    // 获取设备状态列表
    public List<DeviceStatusDTO> getDeviceStatusList() {
        List<DeviceStatusDTO> devices = new ArrayList<>();
        long now = System.currentTimeMillis();

        // 检查所有设备的在线状态
        for (DeviceStatusDTO device : deviceStatusMap.values()) {
            // 更新设备在线状态（超过60秒无心跳则标记为离线）
            boolean isOnline = now - device.getLastActiveTime() <= 60000;
            device.setOnline(isOnline);
            devices.add(device);
        }

        return devices;
    }

    // 更新设备在线状态
    public void updateDeviceStatus(String deviceId) {
        long now = System.currentTimeMillis();
        DeviceStatusDTO device = deviceStatusMap.get(deviceId);
        
        if (device == null) {
            // 新设备，创建状态记录
            device = new DeviceStatusDTO();
            device.setDeviceId(deviceId);
            device.setStatusMessage("设备已连接");
            device.setOfflineModeEnabled(true); // 默认启用离线模式
            device.setLastSyncTime(now);
            device.setLocalConfigVersion("1.0");
            device.setOfflineEventsCount(0);
            device.setLastEventTime(now);
            device.setDeviceType("medicinebox");
            device.setFirmwareVersion("V8.3");
        }
        
        device.setLastActiveTime(now);
        device.setOnline(true);
        deviceStatusMap.put(deviceId, device);
        System.out.println("📱 设备在线: " + deviceId);
    }
    
    // 更新设备离线模式状态
    public void updateDeviceOfflineStatus(String deviceId, boolean offlineModeEnabled) {
        long now = System.currentTimeMillis();
        DeviceStatusDTO device = deviceStatusMap.get(deviceId);
        
        if (device == null) {
            device = new DeviceStatusDTO();
            device.setDeviceId(deviceId);
            device.setOnline(false);
            device.setLastActiveTime(now);
        }
        
        device.setOfflineModeEnabled(offlineModeEnabled);
        deviceStatusMap.put(deviceId, device);
        System.out.println("📱 设备离线模式: " + (offlineModeEnabled ? "已启用" : "已禁用") + " 设备ID: " + deviceId);
    }
    
    // 记录设备离线事件
    public void recordOfflineEvent(String deviceId) {
        long now = System.currentTimeMillis();
        DeviceStatusDTO device = deviceStatusMap.get(deviceId);
        
        if (device == null) {
            device = new DeviceStatusDTO();
            device.setDeviceId(deviceId);
            device.setOnline(false);
            device.setLastActiveTime(now);
        }
        
        device.setOfflineEventsCount(device.getOfflineEventsCount() + 1);
        device.setLastEventTime(now);
        deviceStatusMap.put(deviceId, device);
        System.out.println("📱 设备离线事件记录: " + deviceId + " 事件数: " + device.getOfflineEventsCount());
    }
    
    // 更新设备最后同步时间
    public void updateLastSyncTime(String deviceId) {
        long now = System.currentTimeMillis();
        DeviceStatusDTO device = deviceStatusMap.get(deviceId);
        
        if (device != null) {
            device.setLastSyncTime(now);
            deviceStatusMap.put(deviceId, device);
            System.out.println("📱 设备同步时间更新: " + deviceId + " 时间: " + now);
        }
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
            // 更新设备最后同步时间
            updateLastSyncTime(deviceId);
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
            
            // 检查设备是否在线
            DeviceStatusDTO device = deviceStatusMap.get(deviceId);
            long now = System.currentTimeMillis();
            boolean isOnline = false;
            
            if (device != null) {
                isOnline = now - device.getLastActiveTime() <= 60000;
                device.setOnline(isOnline);
            }
            
            System.out.println("设备状态: " + (isOnline ? "在线" : "离线"));
            
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "COMMAND");
            payload.put("command", command);
            payload.put("data", data);
            payload.put("timestamp", System.currentTimeMillis());
            payload.put("deviceOnline", isOnline);

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