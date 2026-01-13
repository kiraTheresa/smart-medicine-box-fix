package com.ycyu.backend.repository;

import com.ycyu.backend.entity.OfflineEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OfflineEventRepository extends JpaRepository<OfflineEvent, Long> {
    // 查询指定设备的离线事件
    List<OfflineEvent> findByDeviceIdOrderByEventTimeDesc(String deviceId);
    
    // 查询未处理的离线事件
    List<OfflineEvent> findByProcessedFalseOrderByEventTimeAsc();
    
    // 查询指定设备的未处理离线事件
    List<OfflineEvent> findByDeviceIdAndProcessedFalseOrderByEventTimeAsc(String deviceId);
    
    // 查询指定时间范围内的离线事件
    List<OfflineEvent> findByDeviceIdAndEventTimeBetweenOrderByEventTimeDesc(
            String deviceId, LocalDateTime startTime, LocalDateTime endTime);
    
    // 查询指定类型的离线事件
    List<OfflineEvent> findByDeviceIdAndEventTypeOrderByEventTimeDesc(
            String deviceId, String eventType);
}