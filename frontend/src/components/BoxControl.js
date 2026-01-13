import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Space, message, Spin, Row, Col, Typography } from 'antd';
import { PoweroffOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { nodemcuApi } from '../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const BoxControl = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedBox, setSelectedBox] = useState(1);
  const [loading, setLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(true);

  // 加载设备列表
  const loadDevices = async () => {
    try {
      setDevicesLoading(true);
      const response = await nodemcuApi.getDevices();
      if (response.data.success) {
        setDevices(response.data.devices);
        // 默认选择第一个设备
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

  useEffect(() => {
    loadDevices();
    // 每30秒刷新一次设备列表
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  // 发送命令到设备
  const sendCommand = async (action) => {
    if (!selectedDevice) {
      message.warning('请先选择设备');
      return;
    }

    try {
      setLoading(true);
      const command = action === 'open' ? 'OPEN_BOX' : 'CLOSE_BOX';
      const data = { boxNum: selectedBox };
      
      const response = await nodemcuApi.sendCommand(selectedDevice, command, data);
      
      if (response.data.success) {
        message.success(`${action === 'open' ? '打开' : '关闭'}药格子${selectedBox}命令已发送`);
      } else {
        message.error(response.data.message || `${action === 'open' ? '打开' : '关闭'}药格子失败`);
      }
    } catch (error) {
      message.error(`${action === 'open' ? '打开' : '关闭'}药格子失败: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3}>药格子控制</Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDevices}
            loading={devicesLoading}
          >
            刷新设备列表
          </Button>
        </div>

        <Card title="设备选择" loading={devicesLoading}>
          <Select
            placeholder="选择药盒设备"
            style={{ width: 300 }}
            value={selectedDevice}
            onChange={setSelectedDevice}
          >
            {devices.map((device) => (
              <Option key={device.deviceId} value={device.deviceId}>
                <Space>
                  <Text strong>{device.deviceId}</Text>
                  <Text type={device.online ? 'success' : 'danger'}>
                    ({device.online ? '在线' : '离线'})
                  </Text>
                </Space>
              </Option>
            ))}
          </Select>
          {devices.length === 0 && !devicesLoading && (
            <Text type="warning" style={{ marginLeft: '10px' }}>
              暂无设备，请检查设备连接
            </Text>
          )}
        </Card>

        <Card title="药格子操作" loading={loading}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>选择药格子:</Text>
              <Select
                placeholder="选择药格子编号"
                style={{ width: 200, marginLeft: '10px' }}
                value={selectedBox}
                onChange={setSelectedBox}
              >
                {[1, 2, 3, 4, 5, 6].map((boxNum) => (
                  <Option key={boxNum} value={boxNum}>
                    药格子 {boxNum}
                  </Option>
                ))}
              </Select>
            </div>

            <Row gutter={[16, 16]}>
              <Col>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlayCircleOutlined />}
                  onClick={() => sendCommand('open')}
                  loading={loading}
                >
                  打开药格子 {selectedBox}
                </Button>
              </Col>
              <Col>
                <Button
                  danger
                  size="large"
                  icon={<PoweroffOutlined />}
                  onClick={() => sendCommand('close')}
                  loading={loading}
                >
                  关闭药格子 {selectedBox}
                </Button>
              </Col>
            </Row>
          </Space>
        </Card>

        <Card title="操作说明">
          <ul>
            <li>选择要控制的药盒设备</li>
            <li>选择要操作的药格子编号</li>
            <li>点击对应的按钮发送打开或关闭命令</li>
            <li>命令将通过MQTT发送到设备</li>
            <li>设备在线状态会实时更新</li>
          </ul>
        </Card>
      </Space>
    </div>
  );
};

export default BoxControl;