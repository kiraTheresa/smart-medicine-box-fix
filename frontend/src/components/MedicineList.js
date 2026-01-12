import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Tag, Switch, Modal, message, Alert } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  ClockCircleOutlined,
  MedicineBoxOutlined 
} from '@ant-design/icons';
import { medicineApi } from '../services/api';
import MedicineForm from './MedicineForm';
import dayjs from 'dayjs';

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
          <MedicineBoxOutlined />
          <span>{text}</span>
          {record.enabled ? (
            <Tag color="green">启用</Tag>
          ) : (
            <Tag color="red">停用</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '剂量',
      dataIndex: 'dosage',
      key: 'dosage',
    },
    {
      title: '服药时间',
      key: 'time',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          {`${record.hour.toString().padStart(2, '0')}:${record.minute.toString().padStart(2, '0')}`}
        </Space>
      ),
    },
    {
      title: '药格',
      dataIndex: 'boxNum',
      key: 'boxNum',
      render: (boxNum) => (
        <Tag color={boxNum === 1 ? 'blue' : 'purple'}>
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
          >
            编辑
          </Button>
          <Button
            type="danger"
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
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

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Button type="primary" onClick={() => setFormVisible(true)}>
            添加药品
          </Button>
          <Button onClick={onSync}>
            同步到NodeMCU
          </Button>
          <Button onClick={fetchMedicines} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      {medicines.length === 0 && !loading && (
        <Alert
          message="暂无药品数据"
          description="点击添加药品按钮来添加第一个药品"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      <Table
        columns={columns}
        dataSource={medicines}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

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