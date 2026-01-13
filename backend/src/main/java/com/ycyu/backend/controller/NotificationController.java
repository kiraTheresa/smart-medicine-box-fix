package com.ycyu.backend.controller;

import com.ycyu.backend.dto.NotificationDTO;
import com.ycyu.backend.service.DeviceEventService;
import com.ycyu.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private DeviceEventService deviceEventService;

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> sendTestNotification(
            @RequestParam String deviceId,
            @RequestParam String command,
            @RequestBody(required = false) Map<String, Object> data) {

        try {
            if (data == null) {
                data = new HashMap<>();
            }

            NotificationDTO notification = null;

            switch (command) {
                case "TEST_EMERGENCY":
                    notification = new NotificationDTO(
                        "紧急报警",
                        data.getOrDefault("message", "设备触发紧急报警").toString(),
                        "error",
                        deviceId,
                        "EMERGENCY",
                        data.toString()
                    );
                    break;

                case "TEST_MEDICATION_REMINDER":
                    String medicineName = data.getOrDefault("medicineName", "未知药品").toString();
                    String time = data.getOrDefault("time", new java.util.Date().toString()).toString();
                    deviceEventService.handleMedicationReminder(deviceId, medicineName, time);
                    break;

                case "TEST_WARNING":
                    notification = new NotificationDTO(
                        "设备警告",
                        data.getOrDefault("message", "设备警告").toString(),
                        "warning",
                        deviceId,
                        "DEVICE_WARNING",
                        data.toString()
                    );
                    break;

                case "TEST_ERROR":
                    notification = new NotificationDTO(
                        "设备错误",
                        data.getOrDefault("message", "设备错误").toString(),
                        "error",
                        deviceId,
                        "DEVICE_ERROR",
                        data.toString()
                    );
                    break;

                case "TEST_ONLINE":
                    deviceEventService.handleDeviceStatusChange(deviceId, true);
                    break;

                case "TEST_OFFLINE":
                    deviceEventService.handleDeviceStatusChange(deviceId, false);
                    break;

                default:
                    notification = new NotificationDTO(
                        "测试通知",
                        data.getOrDefault("message", "测试通知").toString(),
                        "info",
                        deviceId,
                        "TEST_NOTIFICATION",
                        data.toString()
                    );
            }

            if (notification != null) {
                notificationService.sendDeviceNotification(deviceId, notification);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "测试通知已发送");
            response.put("command", command);
            response.put("deviceId", deviceId);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "发送失败: " + e.getMessage());
            response.put("deviceId", deviceId);

            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getNotificationHistory(
            @RequestParam(required = false) String deviceId) {

        try {
            List<NotificationDTO> notifications;

            if (deviceId != null && !deviceId.isEmpty()) {
                notifications = notificationService.getDeviceNotifications(deviceId);
            } else {
                notifications = notificationService.getAllNotifications();
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("notifications", notifications);
            response.put("count", notifications.size());
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取历史记录失败: " + e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    @PostMapping("/read")
    public ResponseEntity<Map<String, Object>> markAsRead(
            @RequestParam String notificationId) {

        try {
            notificationService.markNotificationAsRead(notificationId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "通知已标记为已读");
            response.put("notificationId", notificationId);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "操作失败: " + e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearNotifications(
            @RequestParam(required = false) String deviceId) {

        try {
            if (deviceId != null && !deviceId.isEmpty()) {
                notificationService.clearDeviceNotifications(deviceId);
            } else {
                notificationService.clearDeviceNotifications("all");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "通知已清空");
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "清空失败: " + e.getMessage());

            return ResponseEntity.status(500).body(response);
        }
    }
}
