package com.ycyu.backend.service;

import com.ycyu.backend.dto.NotificationDTO;
import com.ycyu.backend.entity.OfflineEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class DeviceEventService {
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private OfflineEventService offlineEventService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    // 处理设备状态变化事件
    public void handleDeviceStatusChange(String deviceId, boolean online) {
        if (online) {
            // 设备上线
            notificationService.sendDeviceOnlineNotification(deviceId);
            
            // 记录设备上线事件
            offlineEventService.recordEvent(
                deviceId,
                "DEVICE_ONLINE",
                null,
                "设备已上线"
            );
        } else {
            // 设备离线
            notificationService.sendDeviceOfflineNotification(deviceId);
            
            // 记录设备离线事件
            offlineEventService.recordEvent(
                deviceId,
                "DEVICE_OFFLINE",
                null,
                "设备已离线"
            );
        }
    }
    
    // 处理设备配置同步事件
    public void handleConfigSync(String deviceId, boolean success) {
        notificationService.sendConfigSyncNotification(deviceId, success);
        
        // 记录配置同步事件
        offlineEventService.recordEvent(
            deviceId,
            "CONFIG_SYNC",
            "{\"success\": " + success + "}",
            "设备配置同步" + (success ? "成功" : "失败")
        );
    }
    
    // 处理服药提醒事件
    public void handleMedicationReminder(String deviceId, String medicineName, String time) {
        notificationService.sendMedicationReminder(deviceId, medicineName, time);
        
        // 记录服药提醒事件
        offlineEventService.recordEvent(
            deviceId,
            "MEDICATION_REMINDER",
            "{\"medicineName\": \"" + medicineName + "\", \"time\": \"" + time + "\"}",
            "服药提醒: " + medicineName
        );
    }
    
    // 处理药品服用事件
    public void handleMedicineTaken(String deviceId, String medicineName) {
        NotificationDTO notification = new NotificationDTO(
            "服药确认",
            "设备 " + deviceId + " 的药品 " + medicineName + " 已服用",
            "success",
            deviceId,
            "MEDICINE_TAKEN",
            "{\"medicineName\": \"" + medicineName + "\"}"
        );
        notificationService.sendDeviceNotification(deviceId, notification);
        
        // 记录药品服用事件
        offlineEventService.recordEvent(
            deviceId,
            "MEDICINE_TAKEN",
            "{\"medicineName\": \"" + medicineName + "\"}",
            "药品已服用: " + medicineName
        );
    }
    
    // 处理设备警告事件
    public void handleDeviceWarning(String deviceId, String warningType, String message) {
        NotificationDTO notification = new NotificationDTO(
            "设备警告",
            message,
            "warning",
            deviceId,
            "DEVICE_WARNING",
            "{\"warningType\": \"" + warningType + "\"}"
        );
        notificationService.sendDeviceNotification(deviceId, notification);
        
        // 记录设备警告事件
        offlineEventService.recordEvent(
            deviceId,
            "DEVICE_WARNING",
            "{\"warningType\": \"" + warningType + "\"}",
            message
        );
    }
    
    // 处理设备错误事件
    public void handleDeviceError(String deviceId, String errorType, String message) {
        NotificationDTO notification = new NotificationDTO(
            "设备错误",
            message,
            "error",
            deviceId,
            "DEVICE_ERROR",
            "{\"errorType\": \"" + errorType + "\"}"
        );
        notificationService.sendDeviceNotification(deviceId, notification);
        
        // 记录设备错误事件
        offlineEventService.recordEvent(
            deviceId,
            "DEVICE_ERROR",
            "{\"errorType\": \"" + errorType + "\"}",
            message
        );
    }
}