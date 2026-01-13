import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, message, Space, List, Tag, Typography, Row, Col, Alert, Badge } from 'antd';
import { BellOutlined, SendOutlined, DeleteOutlined, CheckOutlined, WarningOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { nodemcuApi, notificationApi } from '../services/api';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const NotificationTest = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [notificationType, setNotificationType] = useState('EMERGENCY');
  const [customMessage, setCustomMessage] = useState('');
  const [medicineName, setMedicineName] = useState('');
  const [notificationTime, setNotificationTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [connected, setConnected] = useState(false);
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    loadDevices();
    connectWebSocket();
    return () => {
      if (stompClient && stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, []);

  const loadDevices = async () => {
    try {
      setDevicesLoading(true);
      const response = await nodemcuApi.getDevices();
      if (response.data.success) {
        setDevices(response.data.devices);
        if (response.data.devices.length > 0) {
          setSelectedDevice(response.data.devices[0].deviceId);
        }
      } else {
        message.error('获取设备列表失败');
      }
    } catch (error) {
      message.error('获取设备列表失败: ' + error.message);
    } finally {
      setDevicesLoading(false);
    }
  };

  const connectWebSocket = () => {
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('WebSocket连接成功');
      setConnected(true);
      setStompClient(client);

      client.subscribe('/topic/notifications', (message) => {
        const notification = JSON.parse(message.body);
        console.log('收到通知:', notification);
        addNotification(notification);
      });

      client.subscribe('/topic/device/' + selectedDevice + '/notifications', (message) => {
        const notification = JSON.parse(message.body);
        console.log('收到设备通知:', notification);
        addNotification(notification);
      });
    };

    client.onStompError = (frame) => {
      console.error('WebSocket连接失败:', frame);
      setConnected(false);
      message.error('WebSocket连接失败，请检查后端服务');
    };

    client.activate();
  };

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50));
  };

  const sendTestNotification = async () => {
    if (!selectedDevice) {
      message.warning('请先选择设备');
      return;
    }

    try {
      setLoading(true);
      let command = '';
      let data = {};

      switch (notificationType) {
        case 'EMERGENCY':
          command = 'TEST_EMERGENCY';
          data = { message: customMessage || '紧急报警测试' };
          break;
        case 'MEDICATION_REMINDER':
          if (!medicineName) {
            message.warning('请输入药品名称');
            setLoading(false);
            return;
          }
          command = 'TEST_MEDICATION_REMINDER';
          data = { 
            medicineName: medicineName,
            time: notificationTime || new Date().toLocaleTimeString()
          };
          break;
        case 'DEVICE_WARNING':
          command = 'TEST_WARNING';
          data = { message: customMessage || '设备警告测试' };
          break;
        case 'DEVICE_ERROR':
          command = 'TEST_ERROR';
          data = { message: customMessage || '设备错误测试' };
          break;
        case 'DEVICE_ONLINE':
          command = 'TEST_ONLINE';
          data = {};
          break;
        case 'DEVICE_OFFLINE':
          command = 'TEST_OFFLINE';
          data = {};
          break;
        default:
          command = 'TEST_NOTIFICATION';
          data = { message: customMessage || '测试通知' };
      }

      const response = await notificationApi.sendTest(selectedDevice, command, data);
      
      if (response.data.success) {
        message.success('测试通知已发送');
        setCustomMessage('');
        setMedicineName('');
        setNotificationTime('');
      } else {
        message.error('发送失败');
      }
    } catch (error) {
      message.error('发送失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    message.success('通知已清空');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'warning':
        return <WarningOutlined style={{ color: '#faad14' }} />;
      case 'success':
        return <CheckOutlined style={{ color: '#52c41a' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getNotificationTypeText = (eventType) => {
    switch (eventType) {
      case 'EMERGENCY':
        return '紧急报警';
      case 'MEDICATION_REMINDER':
        return '服药提醒';
      case 'DEVICE_WARNING':
        return '设备警告';
      case 'DEVICE_ERROR':
        return '设备错误';
      case 'DEVICE_ONLINE':
        return '设备上线';
      case 'DEVICE_OFFLINE':
        return '设备离线';
      case 'MEDICINE_TAKEN':
        return '服药确认';
      case 'CONFIG_SYNC':
        return '配置同步';
      default:
        return '系统通知';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  return (
    <div style={{ padding: '20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>通知测试</Title>
          <Badge status={connected ? 'success' : 'error'} text={connected ? 'WebSocket已连接' : 'WebSocket未连接'} />
        </div>

        <Alert
          message="功能说明"
          description="此页面用于测试通知功能，包括紧急报警、服药提醒、设备状态等通知。所有通知将通过WebSocket实时推送到前端。"
          type="info"
          showIcon
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="发送测试通知" loading={devicesLoading}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <Text strong>选择设备:</Text>
                  <Select
                    placeholder="选择设备"
                    style={{ width: '100%', marginTop: '8px' }}
                    value={selectedDevice}
                    onChange={setSelectedDevice}
                  >
                    {devices.map((device) => (
                      <Option key={device.deviceId} value={device.deviceId}>
                        <Space>
                          <Text strong>{device.deviceId}</Text>
                          <Tag color={device.online ? 'green' : 'default'}>
                            {device.online ? '在线' : '离线'}
                          </Tag>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Text strong>通知类型:</Text>
                  <Select
                    placeholder="选择通知类型"
                    style={{ width: '100%', marginTop: '8px' }}
                    value={notificationType}
                    onChange={setNotificationType}
                  >
                    <Option value="EMERGENCY">紧急报警</Option>
                    <Option value="MEDICATION_REMINDER">服药提醒</Option>
                    <Option value="DEVICE_WARNING">设备警告</Option>
                    <Option value="DEVICE_ERROR">设备错误</Option>
                    <Option value="DEVICE_ONLINE">设备上线</Option>
                    <Option value="DEVICE_OFFLINE">设备离线</Option>
                  </Select>
                </div>

                {notificationType === 'MEDICATION_REMINDER' && (
                  <div>
                    <Text strong>药品名称:</Text>
                    <Input
                      placeholder="输入药品名称"
                      value={medicineName}
                      onChange={(e) => setMedicineName(e.target.value)}
                      style={{ marginTop: '8px' }}
                    />
                    <Text strong style={{ display: 'block', marginTop: '12px' }}>服药时间:</Text>
                    <Input
                      placeholder="例如: 08:00"
                      value={notificationTime}
                      onChange={(e) => setNotificationTime(e.target.value)}
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                )}

                {['EMERGENCY', 'DEVICE_WARNING', 'DEVICE_ERROR'].includes(notificationType) && (
                  <div>
                    <Text strong>自定义消息:</Text>
                    <TextArea
                      placeholder="输入自定义消息内容"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={3}
                      style={{ marginTop: '8px' }}
                    />
                  </div>
                )}

                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={sendTestNotification}
                  loading={loading}
                  size="large"
                  block
                >
                  发送测试通知
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <BellOutlined />
                  <span>通知历史</span>
                  <Badge count={notifications.length} />
                </Space>
              }
              extra={
                <Button 
                  icon={<DeleteOutlined />} 
                  onClick={clearNotifications}
                  size="small"
                >
                  清空
                </Button>
              }
            >
              {notifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <BellOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <p>暂无通知</p>
                </div>
              ) : (
                <List
                  dataSource={notifications}
                  renderItem={(notification) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={getNotificationIcon(notification.type)}
                        title={
                          <Space>
                            <Text strong>{notification.title}</Text>
                            <Tag color={notification.type === 'error' ? 'red' : notification.type === 'warning' ? 'orange' : notification.type === 'success' ? 'green' : 'blue'}>
                              {getNotificationTypeText(notification.eventType)}
                            </Tag>
                          </Space>
                        }
                        description={
                          <div>
                            <Text>{notification.message}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {formatTime(notification.timestamp)}
                              {notification.deviceId && ` | 设备: ${notification.deviceId}`}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                  style={{ maxHeight: '500px', overflow: 'auto' }}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Card title="使用说明">
          <ol>
            <li>选择要测试的设备</li>
            <li>选择通知类型（紧急报警、服药提醒等）</li>
            <li>根据通知类型填写相应信息（药品名称、自定义消息等）</li>
            <li>点击"发送测试通知"按钮</li>
            <li>通知将通过WebSocket实时推送到通知历史列表</li>
            <li>实际使用中，设备端触发紧急报警或服药时间到时，会自动发送通知</li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default NotificationTest;
