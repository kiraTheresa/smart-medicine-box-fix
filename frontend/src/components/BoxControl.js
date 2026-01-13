import React, { useState, useEffect } from 'react';
import { Card, Button, Select, Space, message, Spin, Row, Col, Typography, Badge, Alert } from 'antd';
import { PoweroffOutlined, PlayCircleOutlined, ReloadOutlined, WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { nodemcuApi } from '../services/api';

const { Option } = Select;
const { Title, Text } = Typography;

const BoxControl = () => {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedBox, setSelectedBox] = useState(1);
  const [loading, setLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(true);

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

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const onlineCount = devices.filter(d => d.online).length;
  const offlineCount = devices.length - onlineCount;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>药格子控制</Title>
          <span style={{ color: 'var(--text-secondary)' }}>远程控制智能药盒的药格子开关</span>
        </div>
        <div className="page-header-actions">
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDevices}
            loading={devicesLoading}
            size="large"
          >
            刷新设备
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="stat-label">设备总数</div>
            <div className="stat-value">{devices.length}</div>
            <div className="stat-description">当前连接的设备数量</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)' }}>
            <div className="stat-label">在线设备</div>
            <div className="stat-value">{onlineCount}</div>
            <div className="stat-description">当前在线的设备数量</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)' }}>
            <div className="stat-label">离线设备</div>
            <div className="stat-value">{offlineCount}</div>
            <div className="stat-description">当前离线的设备数量</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <WifiOutlined />
                <span>设备选择</span>
              </Space>
            }
            loading={devicesLoading}
            className="control-card"
          >
            {devicesLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" />
              </div>
            ) : devices.length === 0 ? (
              <Alert
                message="暂无设备"
                description="请检查设备连接状态或添加新设备"
                type="warning"
                showIcon
              />
            ) : (
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Select
                  placeholder="选择药盒设备"
                  style={{ width: '100%' }}
                  value={selectedDevice}
                  onChange={setSelectedDevice}
                  size="large"
                >
                  {devices.map((device) => (
                    <Option key={device.deviceId} value={device.deviceId}>
                      <Space>
                        {device.online ? (
                          <Badge status="success" text={<Text strong>{device.deviceId}</Text>} />
                        ) : (
                          <Badge status="error" text={<Text strong>{device.deviceId}</Text>} />
                        )}
                        <Text type={device.online ? 'success' : 'danger'}>
                          ({device.online ? '在线' : '离线'})
                        </Text>
                      </Space>
                    </Option>
                  ))}
                </Select>

                {selectedDevice && (
                  <Alert
                    message={
                      <Space>
                        {devices.find(d => d.deviceId === selectedDevice)?.online ? (
                          <>
                            <WifiOutlined />
                            <span>设备在线，可以正常控制</span>
                          </>
                        ) : (
                          <>
                            <DisconnectOutlined />
                            <span>设备离线，无法发送控制命令</span>
                          </>
                        )}
                      </Space>
                    }
                    type={devices.find(d => d.deviceId === selectedDevice)?.online ? 'success' : 'warning'}
                    showIcon
                  />
                )}
              </Space>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <PlayCircleOutlined />
                <span>药格子操作</span>
              </Space>
            }
            loading={loading}
            className="control-card"
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text strong style={{ fontSize: 16 }}>选择药格子:</Text>
                <div style={{ marginTop: 12 }}>
                  <Select
                    placeholder="选择药格子编号"
                    style={{ width: '100%' }}
                    value={selectedBox}
                    onChange={setSelectedBox}
                    size="large"
                  >
                    {[1, 2, 3, 4, 5, 6].map((boxNum) => (
                      <Option key={boxNum} value={boxNum}>
                        <Space>
                          <Badge 
                            count={boxNum} 
                            style={{ backgroundColor: 'var(--primary-color)' }}
                          />
                          <span>药格子 {boxNum}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </div>
              </div>

              <div style={{ padding: '16px 0' }}>
                <Row gutter={[12, 12]}>
                  <Col xs={12}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<PlayCircleOutlined />}
                      onClick={() => sendCommand('open')}
                      loading={loading}
                      block
                      style={{ 
                        height: 56,
                        fontSize: 16,
                        fontWeight: 600
                      }}
                    >
                      打开药格子 {selectedBox}
                    </Button>
                  </Col>
                  <Col xs={12}>
                    <Button
                      danger
                      size="large"
                      icon={<PoweroffOutlined />}
                      onClick={() => sendCommand('close')}
                      loading={loading}
                      block
                      style={{ 
                        height: 56,
                        fontSize: 16,
                        fontWeight: 600
                      }}
                    >
                      关闭药格子 {selectedBox}
                    </Button>
                  </Col>
                </Row>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card 
        title="操作说明" 
        style={{ marginTop: 16 }}
        className="info-card"
      >
        <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
          <li><strong>选择设备：</strong>从下拉列表中选择要控制的药盒设备</li>
          <li><strong>选择药格子：</strong>选择要操作的药格子编号（1-6）</li>
          <li><strong>打开药格子：</strong>点击打开按钮发送打开命令到设备</li>
          <li><strong>关闭药格子：</strong>点击关闭按钮发送关闭命令到设备</li>
          <li><strong>命令发送：</strong>所有命令通过MQTT协议发送到设备</li>
          <li><strong>设备状态：</strong>设备在线状态会实时更新，离线设备无法接收命令</li>
        </ul>
      </Card>
    </div>
  );
};

export default BoxControl;
