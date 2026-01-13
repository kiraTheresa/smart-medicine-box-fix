import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col, Space, Typography, Divider, Alert } from 'antd';
import { ClockCircleOutlined, MedicineBoxOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title, Text } = Typography;

const MedicineForm = ({ open, editingMedicine, onSubmit, onCancel }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (editingMedicine) {
        form.setFieldsValue(editingMedicine);
      } else {
        form.resetFields();
      }
    }
  }, [open, editingMedicine, form]);

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onSubmit(values);
    });
  };

  return (
    <Modal
      title={
        <Space>
          <MedicineBoxOutlined style={{ fontSize: 20, color: 'var(--primary-color)' }} />
          <Title level={4} style={{ margin: 0 }}>
            {editingMedicine ? '编辑药品' : '添加药品'}
          </Title>
        </Space>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={700}
      destroyOnClose
      okText={editingMedicine ? '更新' : '添加'}
      cancelText="取消"
      okButtonProps={{ size: 'large', style={{ borderRadius: 8 } }}
      cancelButtonProps={{ size: 'large', style={{ borderRadius: 8 } }}
    >
      <Alert
        message="填写说明"
        description="请完整填写药品信息，所有带 * 的字段为必填项"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24, borderRadius: 8 }}
      />

      <Form 
        form={form} 
        layout="vertical"
        requiredMark="optional"
      >
        <Divider orientation="left" style={{ fontSize: 14, fontWeight: 500 }}>
          基本信息
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label={
                <Space>
                  <Text strong>药品名称</Text>
                  <Text type="danger">*</Text>
                </Space>
              }
              rules={[
                { required: true, message: '请输入药品名称' },
                { max: 50, message: '名称最多50个字符' }
              ]}
            >
              <Input 
                placeholder="例如：降压药" 
                prefix={<MedicineBoxOutlined />}
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dosage"
              label={
                <Space>
                  <Text strong>剂量</Text>
                  <Text type="danger">*</Text>
                </Space>
              }
              rules={[
                { required: true, message: '请输入剂量' },
                { max: 20, message: '剂量最多20个字符' }
              ]}
            >
              <Input 
                placeholder="例如：1片" 
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: 14, fontWeight: 500 }}>
          服药时间设置
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="hour"
              label={
                <Space>
                  <Text strong>小时</Text>
                  <Text type="danger">*</Text>
                </Space>
              }
              rules={[
                { required: true, message: '请选择小时' },
                { type: 'number', min: 0, max: 23, message: '小时必须在0-23之间' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%', borderRadius: 8 }} 
                placeholder="0-23"
                min={0}
                max={23}
                size="large"
                addonBefore={<ClockCircleOutlined />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="minute"
              label={
                <Space>
                  <Text strong>分钟</Text>
                  <Text type="danger">*</Text>
                </Space>
              }
              rules={[
                { required: true, message: '请选择分钟' },
                { type: 'number', min: 0, max: 59, message: '分钟必须在0-59之间' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%', borderRadius: 8 }} 
                placeholder="0-59"
                min={0}
                max={59}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left" style={{ fontSize: 14, fontWeight: 500 }}>
          药格子设置
        </Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="boxNum"
              label={
                <Space>
                  <Text strong>药格编号</Text>
                  <Text type="danger">*</Text>
                </Space>
              }
              rules={[{ required: true, message: '请选择药格' }]}
            >
              <Select 
                placeholder="选择药格" 
                size="large"
                style={{ borderRadius: 8 }}
              >
                <Option value={1}>
                  <Space>
                    <span style={{ fontWeight: 500 }}>第1格</span>
                    <Text type="secondary">（左侧）</Text>
                  </Space>
                </Option>
                <Option value={2}>
                  <Space>
                    <span style={{ fontWeight: 500 }}>第2格</span>
                    <Text type="secondary">（右侧）</Text>
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="enabled"
              label={
                <Space>
                  <Text strong>启用状态</Text>
                  <Text type="danger">*</Text>
                </Space>
              }
              initialValue={true}
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select 
                placeholder="选择状态" 
                size="large"
                style={{ borderRadius: 8 }}
              >
                <Option value={true}>
                  <Space>
                    <span style={{ color: 'var(--success-color)', fontWeight: 500 }}>启用</span>
                    <Text type="secondary">（正常提醒）</Text>
                  </Space>
                </Option>
                <Option value={false}>
                  <Space>
                    <span style={{ color: 'var(--error-color)', fontWeight: 500 }}>停用</span>
                    <Text type="secondary">（暂停提醒）</Text>
                  </Space>
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Alert
          message="温馨提示"
          description={
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
              <li>请确保服药时间设置准确，系统将按此时间提醒您</li>
              <li>药格编号对应智能药盒的实际格子位置</li>
              <li>停用状态的药品不会触发提醒通知</li>
              <li>添加后可随时编辑或删除药品信息</li>
            </ul>
          }
          type="success"
          showIcon
          style={{ marginTop: 16, borderRadius: 8 }}
        />
      </Form>
    </Modal>
  );
};

export default MedicineForm;
