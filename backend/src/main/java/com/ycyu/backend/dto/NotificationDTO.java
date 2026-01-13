package com.ycyu.backend.dto;

import java.util.UUID;

public class NotificationDTO {
    private String id;
    private String title;
    private String message;
    private String type;
    private String deviceId;
    private long timestamp;
    private boolean read;
    private String eventType;
    private String eventData;
    
    public NotificationDTO() {
        this.id = UUID.randomUUID().toString();
        this.timestamp = System.currentTimeMillis();
        this.read = false;
    }
    
    public NotificationDTO(String title, String message, String type, String deviceId, String eventType, String eventData) {
        this.id = UUID.randomUUID().toString();
        this.title = title;
        this.message = message;
        this.type = type;
        this.deviceId = deviceId;
        this.timestamp = System.currentTimeMillis();
        this.read = false;
        this.eventType = eventType;
        this.eventData = eventData;
    }
    
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }
    
    public boolean isRead() {
        return read;
    }
    
    public void setRead(boolean read) {
        this.read = read;
    }
    
    public String getEventType() {
        return eventType;
    }
    
    public void setEventType(String eventType) {
        this.eventType = eventType;
    }
    
    public String getEventData() {
        return eventData;
    }
    
    public void setEventData(String eventData) {
        this.eventData = eventData;
    }

    @Override
    public String toString() {
        return String.format("{\"id\":\"%s\",\"title\":\"%s\",\"message\":\"%s\",\"type\":\"%s\",\"deviceId\":\"%s\",\"timestamp\":%d,\"read\":%b,\"eventType\":\"%s\",\"eventData\":\"%s\"}",
            id,
            title,
            message,
            type,
            deviceId,
            timestamp,
            read,
            eventType,
            eventData);
    }
}