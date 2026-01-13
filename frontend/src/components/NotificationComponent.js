import React, { useState, useEffect } from 'react';
import { Button, List, Avatar, Popover, Badge, Space } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { notificationApi } from '../services/api';
import webSocketService from '../services/websocket';

const NotificationComponent = () => {
  const [notifications, setNotifications] = useState([]);
  const [visible, setVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 20));
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
        return <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#1890ff' }} />;
      default:
        return <Avatar icon={<BellOutlined />} style={{ backgroundColor: '#8c8c8c' }} />;
    }
  };

  // 通知内容渲染
  const notificationContent = (
    <div style={{ width: 360, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #f0f0f0' }}>
        <h3 style={{ margin: 0, fontSize: 16 }}>通知中心</h3>
        <Space size="small">
          {unreadCount > 0 && (
            <Button type="link" size="small" onClick={markAllAsRead}>
              全部已读
            </Button>
          )}
          <Button type="link" size="small" onClick={clearAllNotifications} danger>
            清空
          </Button>
        </Space>
      </div>
      
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
          暂无通知
        </div>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              actions={[
                !item.read && (
                  <Button
                    type="text"
                    size="small"
                    icon={<CheckOutlined />}
                    onClick={() => markAsRead(item.id)}
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
              style={{ 
                backgroundColor: item.read ? 'transparent' : '#f0f8ff',
                borderRadius: 4
              }}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(item.type)}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: item.read ? 'normal' : 'bold' }}>{item.title}</span>
                    <span style={{ fontSize: 12, color: '#999' }}>
                      {dayjs(item.timestamp).fromNow()}
                    </span>
                  </div>
                }
                description={
                  <div>
                    <div style={{ marginBottom: 8 }}>{item.message}</div>
                    {item.deviceId && (
                      <div style={{ fontSize: 12, color: '#1890ff' }}>
                        设备: {item.deviceId}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={notificationContent}
      title={null}
      trigger="click"
      visible={visible}
      onVisibleChange={setVisible}
      placement="bottomRight"
      arrow={false}
    >
      <Badge count={unreadCount} showZero>
        <Button
          type="text"
          icon={<BellOutlined />}
          onClick={() => setVisible(!visible)}
          style={{ fontSize: 20, padding: 0, minWidth: 'auto' }}
        />
      </Badge>
    </Popover>
  );
};

export default NotificationComponent;