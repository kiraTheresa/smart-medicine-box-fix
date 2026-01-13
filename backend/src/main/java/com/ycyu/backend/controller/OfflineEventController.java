package com.ycyu.backend.controller;

import com.ycyu.backend.entity.OfflineEvent;
import com.ycyu.backend.service.OfflineEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/offline-events")
public class OfflineEventController {
    
    @Autowired
    private OfflineEventService offlineEventService;
    
    // 记录离线事件
    @PostMapping
    public ResponseEntity<Map<String, Object>> recordEvent(@RequestBody Map<String, Object> request) {
        try {
            String deviceId = (String) request.get("deviceId");
            String eventType = (String) request.get("eventType");
            String eventData = (String) request.get("eventData");
            String description = (String) request.get("description");
            
            OfflineEvent event = offlineEventService.recordEvent(deviceId, eventType, eventData, description);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "event", event,
                "message", "离线事件记录成功"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "离线事件记录失败: " + e.getMessage()
            );
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // 获取设备的离线事件列表
    @GetMapping("/device/{deviceId}")
    public ResponseEntity<Map<String, Object>> getDeviceEvents(@PathVariable String deviceId) {
        List<OfflineEvent> events = offlineEventService.getDeviceEvents(deviceId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "events", events,
            "count", events.size(),
            "message", "获取设备离线事件成功"
        );
        
        return ResponseEntity.ok(response);
    }
    
    // 获取未处理的离线事件
    @GetMapping("/unprocessed")
    public ResponseEntity<Map<String, Object>> getUnprocessedEvents() {
        List<OfflineEvent> events = offlineEventService.getUnprocessedEvents();
        
        Map<String, Object> response = Map.of(
            "success", true,
            "events", events,
            "count", events.size(),
            "message", "获取未处理离线事件成功"
        );
        
        return ResponseEntity.ok(response);
    }
    
    // 获取设备的未处理离线事件
    @GetMapping("/device/{deviceId}/unprocessed")
    public ResponseEntity<Map<String, Object>> getDeviceUnprocessedEvents(@PathVariable String deviceId) {
        List<OfflineEvent> events = offlineEventService.getDeviceUnprocessedEvents(deviceId);
        
        Map<String, Object> response = Map.of(
            "success", true,
            "events", events,
            "count", events.size(),
            "message", "获取设备未处理离线事件成功"
        );
        
        return ResponseEntity.ok(response);
    }
    
    // 处理离线事件
    @PostMapping("/process/{eventId}")
    public ResponseEntity<Map<String, Object>> processEvent(@PathVariable Long eventId) {
        try {
            offlineEventService.processEvent(eventId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "离线事件处理成功"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "离线事件处理失败: " + e.getMessage()
            );
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // 批量处理设备的离线事件
    @PostMapping("/process/device/{deviceId}")
    public ResponseEntity<Map<String, Object>> processDeviceEvents(@PathVariable String deviceId) {
        try {
            offlineEventService.processDeviceEvents(deviceId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "设备离线事件批量处理成功"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "设备离线事件批量处理失败: " + e.getMessage()
            );
            
            return ResponseEntity.status(500).body(response);
        }
    }
    
    // 删除设备的所有事件
    @DeleteMapping("/device/{deviceId}")
    public ResponseEntity<Map<String, Object>> deleteDeviceEvents(@PathVariable String deviceId) {
        try {
            offlineEventService.deleteDeviceEvents(deviceId);
            
            Map<String, Object> response = Map.of(
                "success", true,
                "message", "设备离线事件删除成功"
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = Map.of(
                "success", false,
                "message", "设备离线事件删除失败: " + e.getMessage()
            );
            
            return ResponseEntity.status(500).body(response);
        }
    }
}