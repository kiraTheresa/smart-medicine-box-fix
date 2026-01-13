import React, { useState, useEffect } from 'react';
import { Button, List, Avatar, Popover, Badge, Space, Empty, Typography, Divider, Tag } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ClockCircleOutlined, MedicineBoxOutlined, WifiOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { notificationApi } from '../services/api';
import webSocketService from '../services/websocket';

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + 1);
    };

    webSocketService.registerCallback(handleNotification);

    return () => {
      webSocketService.unregisterCallback(handleNotification);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === id);
      return notification && !notification.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <Avatar icon={<CheckOutlined />} style={{ backgroundColor: '#52c41a' }} />;
      case 'warning':
        return <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#faad14' }} />;
      case 'error':
        return <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#f5222d' }} />;
      case 'reminder':
        return <Avatar icon={<ClockCircleOutlined />} style={{ backgroundColor: '#1890ff' }} />;
      case 'medicine':
        return <Avatar icon={<MedicineBoxOutlined />} style={{ backgroundColor: '#722ed1' }} />;
      case 'device':
        return <Avatar icon={<WifiOutlined />} style={{ backgroundColor: '#13c2c2' }} />;
      default:
        return <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#8c8c8c' }} />;
    }
  };

  const getNotificationTypeTag = (type) => {
    switch (type) {
      case 'success':
        return <Tag color="success">成功</Tag>;
      case 'warning':
        return <Tag color="warning">警告</Tag>;
      case 'error':
        return <Tag color="error">错误</Tag>;
      case 'reminder':
        return <Tag color="blue">提醒</Tag>;
      case 'medicine':
        return <Tag color="purple">药品</Tag>;
      case 'device':
        return <Tag color="cyan">设备</Tag>;
      default:
        return <Tag>通知</Tag>;
    }
  };

  const notificationContent = (
    <div className="notification-content">
      <div className="notification-header">
        <Space>
          <BellOutlined style={{ fontSize: 18, color: 'var(--primary-color)' }} />
          <Title level={5} style={{ margin: 0 }}>通知中心</Title>
        </Space>
        <Space size="small">
          {unreadCount > 0 && (
            <Button 
              type="link" 
              size="small" 
              onClick={markAllAsRead}
              style={{ padding: '0 8px' }}
            >
              全部已读
            </Button>
          )}
          <Button 
            type="link" 
            size="small" 
            onClick={clearAllNotifications} 
            danger
            style={{ padding: '0 8px' }}
          >
            清空
          </Button>
        </Space>
      </div>
      
      <Divider style={{ margin: '12px 0' }} />
      
      {notifications.length === 0 ? (
        <div className="notification-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: 'var(--text-tertiary)' }}>
                暂无通知
              </span>
            }
          />
        </div>
      ) : (
        <div className="notification-list">
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className={`notification-item ${!item.read ? 'unread' : ''}`}
                actions={[
                  !item.read && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => markAsRead(item.id)}
                      style={{ color: 'var(--success-color)' }}
                    >
                      已读
                    </Button>
                  ),
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => clearNotification(item.id)}
                  >
                    删除
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={getNotificationIcon(item.type)}
                  title={
                    <div className="notification-title">
                      <Space>
                        <span style={{ fontWeight: item.read ? 'normal' : '600' }}>
                          {item.title}
                        </span>
                        {getNotificationTypeTag(item.type)}
                      </Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {dayjs(item.timestamp).fromNow()}
                      </Text>
                    </div>
                  }
                  description={
                    <div className="notification-description">
                      <div className="notification-message">{item.message}</div>
                      {item.deviceId && (
                        <div className="notification-device">
                          <WifiOutlined style={{ fontSize: 12 }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            设备: {item.deviceId}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );

  return (
    <Popover
      content={notificationContent}
      title={null}
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      arrow={false}
      overlayClassName="notification-popover"
    >
      <Badge count={unreadCount} showZero offset={[-5, 5]}>
        <Button
          type="text"
          icon={<BellOutlined />}
          onClick={() => setVisible(!visible)}
          className="notification-button"
        />
      </Badge>
    </Popover>
  );
};

export default NotificationComponent;
