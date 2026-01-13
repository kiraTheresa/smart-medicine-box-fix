import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Space, message, Divider } from 'antd';
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (values) => {
    setLoading(true);
    const success = await login(values.username, values.password);
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="login-content">
        <Card className="login-card animate-scale-in">
          <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 32 }}>
            <div className="login-icon">
              <MedicineBoxOutlined />
            </div>
            <Title level={2} className="login-title">智能药盒管理系统</Title>
            <Text className="login-subtitle">欢迎回来，请登录您的账户</Text>
          </Space>
          
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            size="large"
            className="login-form"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名!' }]}
            >
              <Input 
                prefix={<UserOutlined className="input-icon" />} 
                placeholder="用户名"
                className="login-input"
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className="input-icon" />} 
                placeholder="密码"
                className="login-input"
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                className="login-button"
                block
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Form.Item>
          </Form>
          
          <Divider className="login-divider">
            <Text type="secondary">系统功能</Text>
          </Divider>
          
          <div className="login-features">
            <div className="feature-item">
              <MedicineBoxOutlined className="feature-icon" />
              <Text>药品管理</Text>
            </div>
            <div className="feature-item">
              <MedicineBoxOutlined className="feature-icon" />
              <Text>智能提醒</Text>
            </div>
            <div className="feature-item">
              <MedicineBoxOutlined className="feature-icon" />
              <Text>远程控制</Text>
            </div>
          </div>
        </Card>
        
        <div className="login-footer">
          <Text type="secondary">© 2024 智能药盒管理系统. 保留所有权利.</Text>
        </div>
      </div>
    </div>
  );
};

export default Login;
