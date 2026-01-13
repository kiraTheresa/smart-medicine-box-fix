package com.ycyu.backend.dto;

public class DeviceStatusDTO {
    private String deviceId;
    private boolean online;
    private long lastActiveTime;
    private String statusMessage;
    private boolean offlineModeEnabled;
    private long lastSyncTime;
    private String localConfigVersion;
    private int offlineEventsCount;
    private long lastEventTime;
    private String deviceType;
    private String firmwareVersion;
    
    public DeviceStatusDTO() {
    }
    
    public DeviceStatusDTO(String deviceId, boolean online, long lastActiveTime, String statusMessage) {
        this.deviceId = deviceId;
        this.online = online;
        this.lastActiveTime = lastActiveTime;
        this.statusMessage = statusMessage;
        this.offlineModeEnabled = false;
        this.lastSyncTime = 0;
        this.localConfigVersion = "1.0";
        this.offlineEventsCount = 0;
        this.lastEventTime = 0;
        this.deviceType = "medicinebox";
        this.firmwareVersion = "V8.3";
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
    
    public boolean isOfflineModeEnabled() {
        return offlineModeEnabled;
    }
    
    public void setOfflineModeEnabled(boolean offlineModeEnabled) {
        this.offlineModeEnabled = offlineModeEnabled;
    }
    
    public long getLastSyncTime() {
        return lastSyncTime;
    }
    
    public void setLastSyncTime(long lastSyncTime) {
        this.lastSyncTime = lastSyncTime;
    }
    
    public String getLocalConfigVersion() {
        return localConfigVersion;
    }
    
    public void setLocalConfigVersion(String localConfigVersion) {
        this.localConfigVersion = localConfigVersion;
    }
    
    public int getOfflineEventsCount() {
        return offlineEventsCount;
    }
    
    public void setOfflineEventsCount(int offlineEventsCount) {
        this.offlineEventsCount = offlineEventsCount;
    }
    
    public long getLastEventTime() {
        return lastEventTime;
    }
    
    public void setLastEventTime(long lastEventTime) {
        this.lastEventTime = lastEventTime;
    }
    
    public String getDeviceType() {
        return deviceType;
    }
    
    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }
    
    public String getFirmwareVersion() {
        return firmwareVersion;
    }
    
    public void setFirmwareVersion(String firmwareVersion) {
        this.firmwareVersion = firmwareVersion;
    }
}