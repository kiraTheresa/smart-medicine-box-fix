package com.ycyu.backend.dto;

public class DeviceStatusDTO {
    private String deviceId;
    private boolean online;
    private long lastActiveTime;
    private String statusMessage;
    
    public DeviceStatusDTO() {
    }
    
    public DeviceStatusDTO(String deviceId, boolean online, long lastActiveTime, String statusMessage) {
        this.deviceId = deviceId;
        this.online = online;
        this.lastActiveTime = lastActiveTime;
        this.statusMessage = statusMessage;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }
    
    public boolean isOnline() {
        return online;
    }
    
    public void setOnline(boolean online) {
        this.online = online;
    }
    
    public long getLastActiveTime() {
        return lastActiveTime;
    }
    
    public void setLastActiveTime(long lastActiveTime) {
        this.lastActiveTime = lastActiveTime;
    }
    
    public String getStatusMessage() {
        return statusMessage;
    }
    
    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}