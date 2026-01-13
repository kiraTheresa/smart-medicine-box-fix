import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Switch, Modal, message, Alert, Card, Typography, Row, Col, Statistic } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined,
  MedicineBoxOutlined,
  PlusOutlined,
  ReloadOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { medicineApi } from '../services/api';
import MedicineForm from './MedicineForm';
import dayjs from 'dayjs';

const { Title } = Typography;

const MedicineList = ({ onSync }) => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  const columns = [
    {
      title: '药品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <MedicineBoxOutlined style={{ color: 'var(--primary-color)', fontSize: 18 }} />
          <span style={{ fontWeight: 500 }}>{text}</span>
          {record.enabled ? (
            <Tag color="success" style={{ borderRadius: 12 }}>启用</Tag>
          ) : (
            <Tag color="error" style={{ borderRadius: 12 }}>停用</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '剂量',
      dataIndex: 'dosage',
      key: 'dosage',
      render: (text) => (
        <Tag color="blue" style={{ borderRadius: 8 }}>{text}</Tag>
      ),
    },
    {
      title: '服药时间',
      key: 'time',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined style={{ color: 'var(--warning-color)' }} />
          <span style={{ fontWeight: 500 }}>
            {`${record.hour.toString().padStart(2, '0')}:${record.minute.toString().padStart(2, '0')}`}
          </span>
        </Space>
      ),
    },
    {
      title: '药格',
      dataIndex: 'boxNum',
      key: 'boxNum',
      render: (boxNum) => (
        <Tag 
          color={boxNum === 1 ? 'geekblue' : boxNum === 2 ? 'purple' : 'cyan'} 
          style={{ borderRadius: 8, fontWeight: 500 }}
        >
          第{boxNum}格
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled, record) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggleStatus(record.id)}
          checkedChildren="启用"
          unCheckedChildren="停用"
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            style={{ borderRadius: 6 }}
          >
            编辑
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
            style={{ borderRadius: 6 }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await medicineApi.getAll();
      setMedicines(response.data);
    } catch (error) {
      message.error('获取药品列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleToggleStatus = async (id) => {
    try {
      await medicineApi.toggleStatus(id);
      message.success('状态更新成功');
      fetchMedicines();
    } catch (error) {
      message.error('状态更新失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEdit = (medicine) => {
    setEditingMedicine(medicine);
    setFormVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个药品吗？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await medicineApi.delete(id);
          message.success('删除成功');
          fetchMedicines();
        } catch (error) {
          message.error('删除失败: ' + (error.response?.data?.message || error.message));
        }
      },
    });
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingMedicine) {
        await medicineApi.update(editingMedicine.id, values);
        message.success('更新成功');
      } else {
        await medicineApi.create(values);
        message.success('创建成功');
      }
      setFormVisible(false);
      setEditingMedicine(null);
      fetchMedicines();
    } catch (error) {
      message.error('操作失败: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFormCancel = () => {
    setFormVisible(false);
    setEditingMedicine(null);
  };

  const enabledCount = medicines.filter(m => m.enabled).length;
  const totalCount = medicines.length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <Title level={2} style={{ margin: 0 }}>药品管理</Title>
          <span style={{ color: 'var(--text-secondary)' }}>管理您的药品信息和服药提醒</span>
        </div>
        <div className="page-header-actions">
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setFormVisible(true)}
            size="large"
          >
            添加药品
          </Button>
          <Button 
            icon={<SyncOutlined />}
            onClick={onSync}
            size="large"
          >
            同步到设备
          </Button>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchMedicines}
            loading={loading}
            size="large"
          >
            刷新
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Statistic
              title="药品总数"
              value={totalCount}
              prefix={<MedicineBoxOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            <Statistic
              title="启用药品"
              value={enabledCount}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            <Statistic
              title="停用药品"
              value={totalCount - enabledCount}
              valueStyle={{ color: '#fff' }}
            />
          </Card>
        </Col>
      </Row>

      {medicines.length === 0 && !loading && (
        <Alert
          message="暂无药品数据"
          description="点击添加药品按钮来添加第一个药品"
          type="info"
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      <Card className="medicine-table-card">
        <Table
          columns={columns}
          dataSource={medicines}
          rowKey="id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <MedicineForm
        open={formVisible}
        editingMedicine={editingMedicine}
        onSubmit={handleFormSubmit}
        onCancel={handleFormCancel}
      />
    </div>
  );
};

export default MedicineList;
