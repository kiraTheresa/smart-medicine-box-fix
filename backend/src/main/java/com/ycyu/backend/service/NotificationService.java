package com.ycyu.backend.service;

import com.ycyu.backend.dto.NotificationDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class NotificationService {
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    // 存储通知历史
    private final ConcurrentHashMap<String, List<NotificationDTO>> notificationHistory = new ConcurrentHashMap<>();
    
    // 发送通知到所有客户端
    public void sendNotification(NotificationDTO notification) {
        // 广播通知
        messagingTemplate.convertAndSend("/topic/notifications", notification);
        
        // 存储到历史记录
        saveNotificationToHistory(notification);
        
        System.out.println("📢 发送通知: " + notification.getTitle() + " 类型: " + notification.getType());
    }
    
    // 发送设备特定的通知
    public void sendDeviceNotification(String deviceId, NotificationDTO notification) {
        notification.setDeviceId(deviceId);
        // 广播通知
        messagingTemplate.convertAndSend("/topic/device/" + deviceId + "/notifications", notification);
        // 发送到所有客户端的设备通知主题
        messagingTemplate.convertAndSend("/topic/notifications", notification);
        
        // 存储到历史记录
        saveNotificationToHistory(notification);
        
        System.out.println("📢 发送设备通知: " + deviceId + " 标题: " + notification.getTitle());
    }
    
    // 发送服药提醒通知
    public void sendMedicationReminder(String deviceId, String medicineName, String time) {
        NotificationDTO notification = new NotificationDTO(
            "服药提醒",
            "药品: " + medicineName + " 服药时间到",
            "reminder",
            deviceId,
            "MEDICATION_REMINDER",
            "{\"medicineName\": \"" + medicineName + "\", \"time\": \"" + time + "\"}"
        );
        sendDeviceNotification(deviceId, notification);
    }
    
    // 发送设备离线通知
    public void sendDeviceOfflineNotification(String deviceId) {
        NotificationDTO notification = new NotificationDTO(
            "设备离线",
            "设备 " + deviceId + " 已离线",
            "warning",
            deviceId,
            "DEVICE_OFFLINE",
            "{\"deviceId\": \"" + deviceId + "\"}"
        );
        sendDeviceNotification(deviceId, notification);
    }
    
    // 发送设备在线通知
    public void sendDeviceOnlineNotification(String deviceId) {
        NotificationDTO notification = new NotificationDTO(
            "设备在线",
            "设备 " + deviceId + " 已上线",
            "success",
            deviceId,
            "DEVICE_ONLINE",
            "{\"deviceId\": \"" + deviceId + "\"}"
        );
        sendDeviceNotification(deviceId, notification);
    }
    
    // 发送设备配置同步通知
    public void sendConfigSyncNotification(String deviceId, boolean success) {
        String title = success ? "配置同步成功" : "配置同步失败";
        String message = "设备 " + deviceId + " 的配置同步" + (success ? "成功" : "失败");
        String type = success ? "success" : "error";
        
        NotificationDTO notification = new NotificationDTO(
            title,
            message,
            type,
            deviceId,
            "CONFIG_SYNC",
            "{\"deviceId\": \"" + deviceId + "\", \"success\": " + success + "}"
        );
        sendDeviceNotification(deviceId, notification);
    }
    
    // 保存通知到历史记录
    private void saveNotificationToHistory(NotificationDTO notification) {
        notificationHistory.computeIfAbsent(notification.getDeviceId() != null ? notification.getDeviceId() : "all", 
            k -> new ArrayList<>()).add(0, notification);
        
        // 限制历史记录数量
        List<NotificationDTO> history = notificationHistory.get(notification.getDeviceId() != null ? notification.getDeviceId() : "all");
        if (history.size() > 100) {
            history.subList(100, history.size()).clear();
        }
    }
    
    // 获取设备的通知历史
    public List<NotificationDTO> getDeviceNotifications(String deviceId) {
        return notificationHistory.getOrDefault(deviceId, new ArrayList<>());
    }
    
    // 获取所有通知历史
    public List<NotificationDTO> getAllNotifications() {
        return notificationHistory.getOrDefault("all", new ArrayList<>());
    }
    
    // 标记通知为已读
    public void markNotificationAsRead(String notificationId) {
        for (List<NotificationDTO> history : notificationHistory.values()) {
            for (NotificationDTO notification : history) {
                if (notification.getId().equals(notificationId)) {
                    notification.setRead(true);
                    break;
                }
            }
        }
    }
    
    // 清空设备的通知历史
    public void clearDeviceNotifications(String deviceId) {
        notificationHistory.remove(deviceId);
    }
}