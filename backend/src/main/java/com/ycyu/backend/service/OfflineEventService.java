package com.ycyu.backend.service;

import com.ycyu.backend.entity.OfflineEvent;
import com.ycyu.backend.repository.OfflineEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OfflineEventService {
    
    @Autowired
    private OfflineEventRepository offlineEventRepository;
    
    @Autowired
    private MqttService mqttService;
    
    // 记录离线事件
    public OfflineEvent recordEvent(String deviceId, String eventType, String eventData, String description) {
        OfflineEvent event = new OfflineEvent();
        event.setDeviceId(deviceId);
        event.setEventTime(LocalDateTime.now());
        event.setEventType(eventType);
        event.setEventData(eventData);
        event.setDescription(description);
        event.setProcessed(false);
        
        OfflineEvent savedEvent = offlineEventRepository.save(event);
        
        // 更新设备状态中的离线事件计数
        mqttService.recordOfflineEvent(deviceId);
        
        System.out.println("📝 记录离线事件: 设备ID=" + deviceId + ", 类型=" + eventType + ", ID=" + savedEvent.getId());
        return savedEvent;
    }
    
    // 获取设备的离线事件列表
    public List<OfflineEvent> getDeviceEvents(String deviceId) {
        return offlineEventRepository.findByDeviceIdOrderByEventTimeDesc(deviceId);
    }
    
    // 获取未处理的离线事件
    public List<OfflineEvent> getUnprocessedEvents() {
        return offlineEventRepository.findByProcessedFalseOrderByEventTimeAsc();
    }
    
    // 获取设备的未处理离线事件
    public List<OfflineEvent> getDeviceUnprocessedEvents(String deviceId) {
        return offlineEventRepository.findByDeviceIdAndProcessedFalseOrderByEventTimeAsc(deviceId);
    }
    
    // 处理离线事件
    public void processEvent(Long eventId) {
        OfflineEvent event = offlineEventRepository.findById(eventId).orElse(null);
        if (event != null) {
            event.setProcessed(true);
            offlineEventRepository.save(event);
            System.out.println("✅ 处理离线事件: ID=" + eventId + ", 设备ID=" + event.getDeviceId());
        }
    }
    
    // 批量处理设备的离线事件
    public void processDeviceEvents(String deviceId) {
        List<OfflineEvent> events = offlineEventRepository.findByDeviceIdAndProcessedFalseOrderByEventTimeAsc(deviceId);
        for (OfflineEvent event : events) {
            event.setProcessed(true);
        }
        offlineEventRepository.saveAll(events);
        System.out.println("✅ 批量处理设备离线事件: 设备ID=" + deviceId + ", 数量=" + events.size());
    }
    
    // 获取指定时间范围内的设备事件
    public List<OfflineEvent> getDeviceEventsByTimeRange(String deviceId, LocalDateTime startTime, LocalDateTime endTime) {
        return offlineEventRepository.findByDeviceIdAndEventTimeBetweenOrderByEventTimeDesc(deviceId, startTime, endTime);
    }
    
    // 获取设备的指定类型事件
    public List<OfflineEvent> getDeviceEventsByType(String deviceId, String eventType) {
        return offlineEventRepository.findByDeviceIdAndEventTypeOrderByEventTimeDesc(deviceId, eventType);
    }
    
    // 删除设备的所有事件
    public void deleteDeviceEvents(String deviceId) {
        List<OfflineEvent> events = offlineEventRepository.findByDeviceIdOrderByEventTimeDesc(deviceId);
        offlineEventRepository.deleteAll(events);
        System.out.println("🗑️ 删除设备事件: 设备ID=" + deviceId + ", 数量=" + events.size());
    }
}