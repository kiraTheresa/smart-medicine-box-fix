import React, { useState, useEffect, useRef } from 'react';
import { Layout, Menu, Typography, Space, Button, Avatar, Dropdown, Badge } from 'antd';
import {
  MedicineBoxOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ControlOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import './App.css';
import MedicineList from './components/MedicineList';
import NotificationComponent from './components/NotificationComponent';
import BoxControl from './components/BoxControl';
import NotificationTest from './components/NotificationTest';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';
import webSocketService from './services/websocket';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const App = () => {
  const [currentPage, setCurrentPage] = useState('medicines');
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAdmin, isAuthenticated } = useAuth();
  const hasConnectedRef = React.useRef(false);

  useEffect(() => {
    if (isAuthenticated() && !hasConnectedRef.current) {
      webSocketService.connect((connected) => {
        if (connected) {
          console.log('WebSocket连接已建立');
          hasConnectedRef.current = true;
        } else {
          console.error('WebSocket连接失败');
          hasConnectedRef.current = false;
        }
      });
    }

    return () => {
      if (hasConnectedRef.current) {
        webSocketService.disconnect();
        hasConnectedRef.current = false;
      }
    };
  }, [isAuthenticated]);

  if (!isAuthenticated()) {
    return <Login />;
  }

  const adminMenuItems = [
    {
      key: 'medicines',
      icon: <MedicineBoxOutlined />,
      label: '药品管理',
    },
    {
      key: 'box-control',
      icon: <ControlOutlined />,
      label: '药格子控制',
    },
    {
      key: 'notification-test',
      icon: <BellOutlined />,
      label: '通知测试',
    },
  ];

  const userMenuItems = [
    {
      key: 'medicines',
      icon: <MedicineBoxOutlined />,
      label: '我的药品',
    },
    {
      key: 'box-control',
      icon: <ControlOutlined />,
      label: '药格子控制',
    },
  ];

  const menuItems = isAdmin() ? adminMenuItems : userMenuItems;

  const handleMenuClick = (e) => {
    setCurrentPage(e.key);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'medicines':
        return <MedicineList />;
      case 'box-control':
        return <BoxControl />;
      case 'notification-test':
        return <NotificationTest />;
      default:
        return (
          <div className="animate-fade-in">
            <div className="page-header">
              <h1>欢迎使用智能药盒管理系统</h1>
            </div>
            <div className="card-grid">
              <div className="stat-card">
                <div className="stat-label">药品总数</div>
                <div className="stat-value">0</div>
                <div className="stat-description">当前系统中的药品数量</div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <div className="stat-label">今日提醒</div>
                <div className="stat-value">0</div>
                <div className="stat-description">今日需要服用的药品</div>
              </div>
              <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <div className="stat-label">在线设备</div>
                <div className="stat-value">0</div>
                <div className="stat-description">当前连接的设备数量</div>
              </div>
            </div>
          </div>
        );
    }
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Text>个人资料</Text>
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <Text>系统设置</Text>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={logout} danger>
        <Text>退出登录</Text>
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="app-sider"
        width={240}
        collapsedWidth={64}
      >
        <div className="logo-container">
          <MedicineBoxOutlined className="logo-icon" />
          {!collapsed && <span className="logo-text">智能药盒</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentPage]}
          items={menuItems}
          onClick={handleMenuClick}
          className="app-menu"
        />
      </Sider>
      
      <Layout className="app-main">
        <Header className="app-header">
          <div className="header-left">
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="collapse-button"
            />
            <Space className="header-title">
              <HomeOutlined />
              <Title level={4} style={{ margin: 0 }}>
                {isAdmin() ? '管理员端' : '用户端'}
              </Title>
            </Space>
          </div>
          
          <div className="header-right">
            <Space size="large">
              <NotificationComponent />
              <Dropdown overlay={userMenu} placement="bottomRight">
                <div className="user-info">
                  <Avatar icon={<UserOutlined />} className="user-avatar" />
                  <span className="user-name">{user?.name}</span>
                </div>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content className="app-content">
          <div className="content-wrapper animate-fade-in">
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
