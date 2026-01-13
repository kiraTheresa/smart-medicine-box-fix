import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Button } from 'antd';
import {
  MedicineBoxOutlined,
  SyncOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import './App.css';
import MedicineList from './components/MedicineList';
import NodeMCUSync from './components/NodeMCUSync';
import NotificationComponent from './components/NotificationComponent';
import { useAuth } from './context/AuthContext';
import Login from './components/Login';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App = () => {
  const [currentPage, setCurrentPage] = useState('medicines');
  const { user, logout, isAdmin, isAuthenticated } = useAuth();

  // 如果用户未登录，显示登录页面
  if (!isAuthenticated()) {
    return <Login />;
  }

  // 管理员端菜单
  const adminMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '系统概览',
    },
    {
      key: 'medicines',
      icon: <MedicineBoxOutlined />,
      label: '药品管理',
    },
    {
      key: 'devices',
      icon: <ToolOutlined />,
      label: '设备管理',
    },
    {
      key: 'sync',
      icon: <SyncOutlined />,
      label: '同步设置',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
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
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '使用状态',
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
      case 'sync':
        return <NodeMCUSync />;
      case 'devices':
        return (
          <div style={{ padding: '20px' }}>
            <Title level={3}>设备管理</Title>
            <p>设备管理功能 - 仅管理员可见</p>
          </div>
        );
      case 'dashboard':
        if (isAdmin()) {
          return (
            <div style={{ padding: '20px' }}>
              <Title level={3}>系统概览</Title>
              <p>系统概览 - 仅管理员可见</p>
            </div>
          );
        } else {
          return (
            <div style={{ padding: '20px' }}>
              <Title level={3}>使用状态</Title>
              <p>您的药盒使用情况概览</p>
            </div>
          );
        }
      case 'settings':
        return (
          <div style={{ padding: '20px' }}>
            <Title level={3}>系统设置</Title>
            <p>系统设置功能 - 仅管理员可见</p>
          </div>
        );
      default:
        return (
          <div style={{ padding: '20px' }}>
            <Title level={3}>智能药盒管理系统</Title>
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