import React, { useState, useEffect } from 'react';
import { Layout, Menu, Typography, Space, Button } from 'antd';
import {
  MedicineBoxOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ControlOutlined,
  BellOutlined,
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
const { Title } = Typography;

const App = () => {
  const [currentPage, setCurrentPage] = useState('medicines');
  const { user, logout, isAdmin, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      webSocketService.connect((connected) => {
        if (connected) {
          console.log('WebSocket连接已建立');
        } else {
          console.error('WebSocket连接失败');
        }
      });
    }

    return () => {
      webSocketService.disconnect();
    };
  }, [isAuthenticated]);

  // 如果用户未登录，显示登录页面
  if (!isAuthenticated()) {
    return <Login />;
  }

  // 管理员端菜单
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

  // 用户端菜单（面向老年人，简化操作）
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

  // 根据用户角色选择菜单
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
          <div style={{ padding: '20px' }}>
            <Typography.Title level={3}>智能药盒管理系统</Typography.Title>
            <p>请选择左侧菜单进行操作</p>
          </div>
        );
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 20px', boxShadow: '0 2px 8px #f0f1f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <MedicineBoxOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>
            {isAdmin() ? '智能药盒管理系统 - 管理员端' : '智能药盒管理系统 - 用户端'}
          </Title>
        </Space>
        <Space>
          <NotificationComponent />
          <Space size="small">
            <UserOutlined />
            <span>{user?.name}</span>
            <Button type="text" danger icon={<LogoutOutlined />} onClick={logout}>
              登出
            </Button>
          </Space>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: '24px' }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default App;