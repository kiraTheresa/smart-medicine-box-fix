import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = '/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 检查本地存储中的令牌
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  // 获取当前用户信息
  const fetchCurrentUser = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      localStorage.removeItem('token');
      setLoading(false);
    }
  };

  // 登录
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setUser(user);
      message.success('登录成功');
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      message.error('登录失败，请检查用户名和密码');
      return false;
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      message.success('注册成功');
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      message.error('注册失败，请稍后重试');
      return false;
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    message.success('登出成功');
  };

  // 检查用户是否为管理员
  const isAdmin = () => {
    return user && user.role === 'ADMIN';
  };

  // 检查用户是否已登录
  const isAuthenticated = () => {
    return !!user;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};