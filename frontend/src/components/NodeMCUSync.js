import React, { useState, useEffect } from 'react';
import { Card, Button, Input, message, Alert, Modal, Space, Select } from 'antd';
import { SyncOutlined, CodeOutlined, WifiOutlined, SendOutlined } from '@ant-design/icons';
import { nodemcuApi } from '../services/api';

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

  // 获取设备列表
  const fetchDevices = async () => {
    try {
      const response = await nodemcuApi.getDevices();
      if (response.data.success && response.data.devices) {
        const deviceList = response.data.devices;
        setDevices(deviceList);
        
        // 如果没有选择设备，自动选择第一个
        if (deviceList.length > 0 && !deviceId) {
          setDeviceId(deviceList[0]);
          message.info(`自动选择设备: ${deviceList[0]}`);
        }
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
      message.error('获取设备列表失败');
    }
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
            onChange={setDeviceId}
            placeholder="选择设备"
            showSearch
          >
            {devices.map(device => (
              <Option key={device} value={device}>
                {device}
              </Option>
            ))}
          </Select>
          <Button 
            type="link" 
            onClick={fetchDevices}
            style={{ marginLeft: 8 }}
          >
            刷新设备列表
          </Button>
        </div>

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