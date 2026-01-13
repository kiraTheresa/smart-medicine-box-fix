import SockJS from 'sockjs-client';
import Stomp from 'stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.callbacks = [];
    this.isConnected = false;
  }

  // 连接到WebSocket服务器
  connect(callback) {
    if (this.isConnected) {
      callback && callback(true);
      return;
    }

    // 创建SockJS连接
    const socket = new SockJS('/ws');
    // 创建STOMP客户端
    this.stompClient = Stomp.over(socket);
    
    // 禁用调试日志
    this.stompClient.debug = null;

    // 连接回调
    this.stompClient.connect({}, (frame) => {
      console.log('✅ WebSocket连接成功', frame);
      this.isConnected = true;
      callback && callback(true);

      // 订阅全局通知主题
      this.stompClient.subscribe('/topic/notifications', (message) => {
        const notification = JSON.parse(message.body);
        console.log('📢 收到通知:', notification);
        // 调用所有注册的回调函数
        this.callbacks.forEach(cb => cb(notification));
      });
    }, (error) => {
      console.error('❌ WebSocket连接失败', error);
      this.isConnected = false;
      callback && callback(false);
      // 尝试重新连接
      setTimeout(() => this.connect(callback), 5000);
    });
  }

  // 断开连接
  disconnect() {
    if (this.stompClient && this.isConnected) {
      this.stompClient.disconnect();
      this.isConnected = false;
      console.log('❌ WebSocket已断开连接');
    }
  }

  // 注册通知回调
  registerCallback(callback) {
    if (typeof callback === 'function' && !this.callbacks.includes(callback)) {
      this.callbacks.push(callback);
    }
  }

  // 取消注册通知回调
  unregisterCallback(callback) {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  // 订阅设备特定的通知
  subscribeToDeviceNotifications(deviceId, callback) {
    if (!this.stompClient || !this.isConnected) {
      console.error('❌ WebSocket未连接');
      return null;
    }

    const subscription = this.stompClient.subscribe(
      `/topic/device/${deviceId}/notifications`,
      (message) => {
        const notification = JSON.parse(message.body);
        console.log(`📢 收到设备 ${deviceId} 通知:`, notification);
        callback && callback(notification);
      }
    );

    return subscription;
  }
}

// 创建单例实例
const webSocketService = new WebSocketService();

export default webSocketService;