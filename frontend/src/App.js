import React, { useState } from 'react';
import { Layout, Menu, Typography, Space } from 'antd';
import {
  MedicineBoxOutlined,
  SyncOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import './App.css';
import MedicineList from './components/MedicineList';
import NodeMCUSync from './components/NodeMCUSync';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App = () => {
  const [currentPage, setCurrentPage] = useState('medicines');
  const [syncVisible, setSyncVisible] = useState(false);

  const menuItems = [
    {
      key: 'medicines',
      icon: <MedicineBoxOutlined />,
      label: '药品管理',
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

  const handleMenuClick = (e) => {
    setCurrentPage(e.key);
    if (e.key === 'sync') {
      setSyncVisible(true);
    }
  };

  const handleSyncClick = () => {
    setCurrentPage('sync');
    setSyncVisible(true);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'medicines':
        return <MedicineList onSync={handleSyncClick} />;
      case 'sync':
        return <NodeMCUSync />;
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
      <Header style={{ background: '#fff', padding: '0 20px', boxShadow: '0 2px 8px #f0f1f2' }}>
        <Space>
          <MedicineBoxOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>智能药盒管理系统</Title>
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