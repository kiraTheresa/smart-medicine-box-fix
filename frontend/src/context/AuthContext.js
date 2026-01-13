import React, { createContext, useState, useContext, useEffect } from 'react';
import { message } from 'antd';
import axios from 'axios';

const AuthContext = createContext();

const API_BASE_URL = '';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 检查本地存储中的用户信息（简化版，不使用JWT）
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUser(user);
    } else {
      setLoading(false);
    }
  }, []);

  // 获取当前用户信息（简化版，直接返回存储的用户信息）
  const fetchCurrentUser = async (token) => {
    // 直接从本地存储获取用户信息
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
    setLoading(false);
  };

  // 登录（简化版，不使用JWT）
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password,
      });
      const { success, user, message, errorType } = response.data;
      
      if (success) {
        // 直接存储用户信息，不存储令牌
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        message.success('登录成功');
        return true;
      } else {
        // 根据错误类型显示不同的错误信息
        if (errorType === 'USER_NOT_FOUND') {
          message.error('用户名不存在，请检查用户名');
        } else if (errorType === 'PASSWORD_INCORRECT') {
          message.error('密码错误，请检查密码');
        } else {
          message.error('登录失败，请检查用户名和密码');
        }
        return false;
      }
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

  // 登出（简化版，不使用JWT）
  const logout = () => {
    localStorage.removeItem('user');
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