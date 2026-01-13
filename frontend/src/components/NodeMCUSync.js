import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message, Alert, Modal, Space, Select, Tag, Descriptions } from 'antd';
import { SyncOutlined, CodeOutlined, WifiOutlined, SendOutlined, InfoCircleOutlined, ClockCircleOutlined, EventOutlined } from '@ant-design/icons';
import { nodemcuApi, offlineEventApi } from '../services/api';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const NodeMCUSync = () => {
  const [deviceId, setDeviceId] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [config, setConfig] = useState('');
  const [loading, setLoading] = useState(false);
  const [configVisible, setConfigVisible] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedCommand, setSelectedCommand] = useState('OPEN_BOX');
  const [onlineCount, setOnlineCount] = useState(0);
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState(null);
  const [deviceEvents, setDeviceEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      const response = await nodemcuApi.getDevices();
      if (response.data.success && response.data.devices) {
        const deviceList = response.data.devices;
        setDevices(deviceList);
        
        // 更新在线设备数量
        setOnlineCount(response.data.onlineCount || 0);
        
        // 如果没有选择设备，自动选择第一个
        if (deviceList.length > 0 && !deviceId) {
          const firstDevice = deviceList[0];
          const firstDeviceId = firstDevice.deviceId || firstDevice;
          setDeviceId(firstDeviceId);
          setSelectedDeviceDetails(firstDevice);
          message.info(`自动选择设备: ${firstDeviceId}`);
          // 获取设备事件
          fetchDeviceEvents(firstDeviceId);
        }
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
      message.error('获取设备列表失败');
    }
  };
  
  // 获取设备事件
  const fetchDeviceEvents = async (deviceId) => {
    if (!deviceId) return;
    
    setEventsLoading(true);
    try {
      const response = await offlineEventApi.getDeviceEvents(deviceId);
      if (response.data.success) {
        setDeviceEvents(response.data.events || []);
      }
    } catch (error) {
      console.error('获取设备事件失败:', error);
    } finally {
      setEventsLoading(false);
    }
  };
  
  // 处理设备选择变化
  const handleDeviceChange = (newDeviceId) => {
    setDeviceId(newDeviceId);
    // 查找选中的设备详情
    const selectedDevice = devices.find(device => 
      (device.deviceId || device) === newDeviceId
    );
    setSelectedDeviceDetails(selectedDevice);
    // 获取设备事件
    fetchDeviceEvents(newDeviceId);
  };

  useEffect(() => {
    fetchDevices();
    // 每30秒刷新一次设备列表
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGetConfig = async () => {
    setLoading(true);
    try {
      const response = await nodemcuApi.getConfig();
      setConfig(response.data);
      setConfigVisible(true);
      message.success('配置生成成功');
    } catch (error) {
      message.error('获取配置失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!deviceId) {
      message.warning('请选择设备');
      return;
    }

    setLoading(true);
    try {
      const response = await nodemcuApi.sync(deviceId, ipAddress);
      if (response.data.success) {
        message.success(response.data.message);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('同步失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommand = async () => {
    if (!deviceId) {
      message.warning('请选择设备');
      return;
    }

    let commandData = {};
    switch (selectedCommand) {
      case 'OPEN_BOX':
        commandData = { boxNum: 1 };
        break;
      case 'CLOSE_BOX':
        commandData = { boxNum: 1 };
        break;
      case 'TEST_BUZZER':
        commandData = { level: 1 };
        break;
      case 'GET_STATUS':
        commandData = {};
        break;
      default:
        commandData = {};
    }

    try {
      const response = await nodemcuApi.sendCommand(deviceId, selectedCommand, commandData);
      if (response.data.success) {
        message.success('命令发送成功');
      } else {
        message.error('命令发送失败');
      }
    } catch (error) {
      message.error('发送命令失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(config)
      .then(() => message.success('配置已复制到剪贴板'))
      .catch(() => message.error('复制失败'));
  };

  return (
    <Card 
      title="NodeMCU同步 (MQTT)" 
      style={{ margin: '20px' }}
      extra={
        <Space>
          <Button 
            icon={<CodeOutlined />} 
            onClick={handleGetConfig}
          >
            查看配置
          </Button>
          <Button 
            type="primary" 
            icon={<SyncOutlined />} 
            onClick={handleSync}
            loading={loading}
          >
            同步配置
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        title="MQTT同步说明"
        description={`当前设备ID: ${deviceId || '未选择'}`}
        style={{ marginBottom: '16px' }}
      />

      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 设备选择 */}
        <div>
          <label>设备ID: </label>
          <Select
            style={{ width: 300, marginLeft: 8 }}
            value={deviceId}
            onChange={handleDeviceChange}
            placeholder="选择设备"
            showSearch
          >
            {devices.map(device => {
              const deviceIdValue = device.deviceId || device;
              const isOnline = device.online || false;
              const offlineModeEnabled = device.offlineModeEnabled || false;
              return (
                <Option 
                  key={deviceIdValue} 
                  value={deviceIdValue}
                  style={{
                    color: isOnline ? '#52c41a' : '#d9d9d9',
                    fontWeight: isOnline ? 'bold' : 'normal'
                  }}
                >
                  {deviceIdValue} 
                  {isOnline ? '(在线)' : '(离线)'}
                  {offlineModeEnabled && ' [离线模式]'}
                </Option>
              );
            })}
          </Select>
          <Button 
            type="link" 
            onClick={fetchDevices}
            style={{ marginLeft: 8 }}
          >
            刷新设备列表
          </Button>
          <span style={{ marginLeft: 16, color: '#1890ff', fontWeight: 'bold' }}>
            在线设备: {onlineCount}/{devices.length}
          </span>
        </div>
        
        {/* 设备详情 */}
        {selectedDeviceDetails && (
          <Card 
            title="设备详情" 
            size="small"
            style={{ marginTop: 16, borderColor: '#f0f0f0' }}
          >
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="设备ID">
                {selectedDeviceDetails.deviceId || deviceId}
              </Descriptions.Item>
              <Descriptions.Item label="在线状态">
                <Tag color={selectedDeviceDetails.online ? 'green' : 'default'}>
                  {selectedDeviceDetails.online ? '在线' : '离线'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="离线模式">
                <Tag color={selectedDeviceDetails.offlineModeEnabled ? 'blue' : 'default'}>
                  {selectedDeviceDetails.offlineModeEnabled ? '已启用' : '已禁用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="固件版本">
                {selectedDeviceDetails.firmwareVersion || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="最后活动时间" span={2}>
                <ClockCircleOutlined /> 
                {selectedDeviceDetails.lastActiveTime ? 
                  dayjs(selectedDeviceDetails.lastActiveTime).format('YYYY-MM-DD HH:mm:ss') : 
                  '从未'}
              </Descriptions.Item>
              <Descriptions.Item label="最后同步时间" span={2}>
                <SyncOutlined /> 
                {selectedDeviceDetails.lastSyncTime ? 
                  dayjs(selectedDeviceDetails.lastSyncTime).format('YYYY-MM-DD HH:mm:ss') : 
                  '从未'}
              </Descriptions.Item>
              <Descriptions.Item label="本地配置版本">
                {selectedDeviceDetails.localConfigVersion || '1.0'}
              </Descriptions.Item>
              <Descriptions.Item label="离线事件数">
                <EventOutlined /> {selectedDeviceDetails.offlineEventsCount || 0}
              </Descriptions.Item>
              <Descriptions.Item label="设备类型" span={2}>
                {selectedDeviceDetails.deviceType || 'medicinebox'}
              </Descriptions.Item>
            </Descriptions>
            
            {/* 离线事件列表 */}
            {deviceEvents.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h5 style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                  <EventOutlined style={{ marginRight: 8 }} />
                  最近离线事件 ({deviceEvents.length})
                </h5>
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}>
                  {deviceEvents.slice(0, 5).map(event => (
                    <div key={event.id} style={{ marginBottom: 8, padding: 8, backgroundColor: '#fafafa', borderRadius: 4 }}>
                      <div style={{ fontSize: 12, color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{event.eventType}</span>
                        <span>{dayjs(event.eventTime).format('HH:mm:ss')}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                        {event.description || event.eventData?.substring(0, 50)}
                        {event.eventData && event.eventData.length > 50 && '...'}
                      </div>
                      {!event.processed && (
                        <Tag color="warning" style={{ marginLeft: 8, fontSize: 10 }}>
                          未处理
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* IP地址（可选） */}
        <Space.Compact style={{ width: '100%' }}>
          <Input
            addonBefore={<WifiOutlined />}
            placeholder="输入设备IP地址（可选）"
            value={ipAddress}
            onChange={(e) => setIpAddress(e.target.value)}
          />
          <Button type="primary" onClick={handleSync} loading={loading}>
            同步
          </Button>
        </Space.Compact>

        {/* 命令控制 */}
        <div style={{ marginTop: '20px' }}>
          <label>发送命令: </label>
          <Select
            style={{ width: 150, marginLeft: 8, marginRight: 8 }}
            value={selectedCommand}
            onChange={setSelectedCommand}
          >
            <Option value="OPEN_BOX">打开药盒</Option>
            <Option value="CLOSE_BOX">关闭药盒</Option>
            <Option value="TEST_BUZZER">测试蜂鸣器</Option>
            <Option value="GET_STATUS">获取状态</Option>
            <Option value="REBOOT">重启设备</Option>
          </Select>
          <Button 
            icon={<SendOutlined />}
            onClick={handleSendCommand}
          >
            发送命令
          </Button>
        </div>
      </Space>

      <div style={{ marginTop: '20px' }}>
        <h4>操作步骤：</h4>
        <ol style={{ color: '#666' }}>
          <li>系统会自动检测设备，选择正确的设备ID: <strong>medicinebox_E8DB8498F9E9</strong></li>
          <li>点击"同步配置"发送药品配置到设备</li>
          <li>使用命令控制面板发送指令</li>
          <li>点击"查看配置"确认药品信息</li>
          <li>设备状态将通过MQTT实时更新</li>
        </ol>
      </div>

      <Modal
        title="NodeMCU配置代码"
        open={configVisible}
        width={800}
        onCancel={() => setConfigVisible(false)}
        footer={[
          <Button key="copy" onClick={handleCopyConfig}>
            复制配置
          </Button>,
          <Button 
            key="close" 
            type="primary" 
            onClick={() => setConfigVisible(false)}
          >
            关闭
          </Button>,
        ]}
      >
        <TextArea
          value={config}
          rows={20}
          readOnly
          style={{ 
            fontFamily: 'monospace',
            fontSize: '12px'
          }}
        />
        <Alert
          type="warning"
          title="使用说明"
          description="配置将通过MQTT自动同步到设备，此代码仅供参考"
          style={{ marginTop: '16px' }}
        />
      </Modal>
    </Card>
  );
};

export default NodeMCUSync;