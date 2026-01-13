import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Input, message, Space, List, Tag, Typography, Row, Col, Alert, Badge } from 'antd';
import { BellOutlined, SendOutlined, DeleteOutlined, CheckOutlined, WarningOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { nodemcuApi, notificationApi } from '../services/api';
import webSocketService from '../services/websocket';

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

  useEffect(() => {
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
    };

    webSocketService.registerCallback(handleNotification);
    setConnected(webSocketService.isConnected);
    loadDevices();

    const checkConnection = setInterval(() => {
      setConnected(webSocketService.isConnected);
    }, 1000);

    return () => {
      webSocketService.unregisterCallback(handleNotification);
      clearInterval(checkConnection);
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
      case 'reminder':
        return <BellOutlined style={{ color: '#1890ff' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getNotificationTypeText = (eventType) => {
    switch (eventType) {
      case 'EMERGENCY':
        return '紧急报警';
      case 'EMERGENCY_CANCEL':
        return '紧急取消';
      case 'MEDICATION_REMINDER':
        return '服药提醒';
      case 'MEDICINE_TAKEN':
        return '服药确认';
      case 'DEVICE_WARNING':
        return '设备警告';
      case 'DEVICE_ERROR':
        return '设备错误';
      case 'DEVICE_ONLINE':
        return '设备上线';
      case 'DEVICE_OFFLINE':
        return '设备离线';
      case 'TEST_EMERGENCY':
        return '紧急报警测试';
      case 'TEST_MEDICATION_REMINDER':
        return '服药提醒测试';
      case 'TEST_WARNING':
        return '警告测试';
      case 'TEST_ERROR':
        return '错误测试';
      case 'TEST_ONLINE':
        return '上线测试';
      case 'TEST_OFFLINE':
        return '离线测试';
      case 'TEST_NOTIFICATION':
        return '测试通知';
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
          <Badge 
            status={connected ? 'success' : 'error'} 
            text={connected ? 'WebSocket已连接' : 'WebSocket未连接'} 
          />
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
                  {devices.length === 0 && !devicesLoading && (
                    <Text type="warning" style={{ marginTop: '8px' }}>
                      暂无设备，请检查设备连接
                    </Text>
                  )}
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
                  </div>
                )}

                {notificationType === 'MEDICATION_REMINDER' && (
                  <div>
                    <Text strong>服药时间:</Text>
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
                  <Badge count={notifications.length} showZero />
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
                  renderItem={(item) => (
                    <List.Item
                      style={{ 
                        backgroundColor: item.read ? 'transparent' : '#f0f8ff',
                        borderRadius: 4
                      }}
                      actions={[
                        !item.read && (
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckOutlined />}
                            onClick={() => {
                              setNotifications(prev => prev.map(n => 
                                n.id === item.id ? { ...n, read: true } : n
                              ));
                            }}
                          >
                            已读
                          </Button>
                        ),
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          danger
                          onClick={() => {
                            setNotifications(prev => prev.filter(n => n.id !== item.id));
                          }}
                        >
                          删除
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={getNotificationIcon(item.type)}
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: item.read ? 'normal' : 'bold' }}>
                              {item.title}
                            </span>
                            <Tag color={item.type === 'error' ? 'red' : item.type === 'warning' ? 'orange' : item.type === 'success' ? 'green' : 'blue'}>
                              {getNotificationTypeText(item.eventType)}
                            </Tag>
                          </div>
                        }
                        description={
                          <div>
                            <div style={{ marginBottom: 8 }}>
                              {item.message}
                            </div>
                            {item.deviceId && (
                              <div style={{ fontSize: 12, color: '#1890ff' }}>
                                设备: {item.deviceId}
                              </div>
                            )}
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {formatTime(item.timestamp)}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
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
            <li>通知会通过WebSocket实时推送到通知历史列表</li>
            <li>实际使用中，设备端触发紧急报警或服药时间到时，会自动发送通知</li>
          </ol>
        </Card>
      </Space>
    </div>
  );
};

export default NotificationTest;
