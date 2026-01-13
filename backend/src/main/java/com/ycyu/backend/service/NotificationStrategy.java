package com.ycyu.backend.service;

import com.ycyu.backend.dto.NotificationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class NotificationStrategy {
    
    @Autowired
    private NotificationService notificationService;
    
    // 存储设备最后服药时间
    private final ConcurrentHashMap<String, Long> lastMedicationTime = new ConcurrentHashMap<>();
    
    // 存储设备离线时间
    private final ConcurrentHashMap<String, Long> deviceOfflineTime = new ConcurrentHashMap<>();
    
    // 设备离线策略（超过5分钟）
    public void checkDeviceOfflineStrategy(String deviceId, boolean online) {
        if (online) {
            // 设备上线，清除离线记录
            deviceOfflineTime.remove(deviceId);
        } else {
            // 设备离线，记录离线时间
            if (!deviceOfflineTime.containsKey(deviceId)) {
                deviceOfflineTime.put(deviceId, System.currentTimeMillis());
            } else {
                long offlineDuration = System.currentTimeMillis() - deviceOfflineTime.get(deviceId);
                // 如果设备离线超过5分钟，发送警告通知
                if (offlineDuration > 5 * 60 * 1000) {
                    NotificationDTO notification = new NotificationDTO(
                        "设备长时间离线警告",
                        "设备 " + deviceId + " 已离线超过5分钟，请检查设备状态",
                        "warning",
                        deviceId,
                        "DEVICE_OFFLINE_WARNING",
                        "{\"offlineDuration\": " + offlineDuration + "}"
                    );
                    notificationService.sendDeviceNotification(deviceId, notification);
                    // 移除记录，避免重复发送
                    deviceOfflineTime.remove(deviceId);
                }
            }
        }
    }
    
    // 服药未确认策略（超过30分钟）
    public void checkMedicationNotConfirmedStrategy(String deviceId, String medicineName, long reminderTime) {
        // 记录服药提醒时间
        lastMedicationTime.put(deviceId + "_" + medicineName, reminderTime);
        
        // 这里可以添加定时任务来检查是否超过30分钟未确认
        // 为了简化，我们可以在设备状态更新时检查
    }
    
    // 设备状态检查策略
    public void checkDeviceStatusStrategy(String deviceId, boolean online) {
        // 设备状态变化时发送通知（已在DeviceEventService中实现）
        // 这里可以添加更多的状态检查逻辑
    }
    
    // 配置同步失败策略
    public void checkConfigSyncStrategy(String deviceId, boolean success) {
        if (!success) {
            NotificationDTO notification = new NotificationDTO(
                "配置同步失败",
                "设备 " + deviceId + " 配置同步失败，请检查设备连接",
                "error",
                deviceId,
                "CONFIG_SYNC_FAILED",
                null
            );
            notificationService.sendDeviceNotification(deviceId, notification);
        }
    }
    
    // 设备警告事件策略
    public void checkDeviceWarningStrategy(String deviceId, String warningType, String message) {
        NotificationDTO notification = new NotificationDTO(
            "设备警告",
            message,
            "warning",
            deviceId,
            "DEVICE_WARNING",
            "{\"warningType\": \"" + warningType + "\"}"
        );
        notificationService.sendDeviceNotification(deviceId, notification);
    }
    
    // 设备错误事件策略
    public void checkDeviceErrorStrategy(String deviceId, String errorType, String message) {
        NotificationDTO notification = new NotificationDTO(
            "设备错误",
            message,
            "error",
            deviceId,
            "DEVICE_ERROR",
            "{\"errorType\": \"" + errorType + "\"}"
        );
        notificationService.sendDeviceNotification(deviceId, notification);
    }
}