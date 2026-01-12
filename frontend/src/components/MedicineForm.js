import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, Row, Col, Space } from 'antd';
import { ClockCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';

const { Option } = Select;

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

  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
  };

  return (
    <Modal
      title={editingMedicine ? '编辑药品' : '添加药品'}
      open={open}
      onOk={handleSubmit}
      onCancel={onCancel}
      width={600}
      destroyOnHidden
    >
      <Form form={form} {...formItemLayout}>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="药品名称"
              rules={[
                { required: true, message: '请输入药品名称' },
                { max: 50, message: '名称最多50个字符' }
              ]}
            >
              <Input 
                placeholder="例如：降压药" 
                prefix={<MedicineBoxOutlined />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="dosage"
              label="剂量"
              rules={[
                { required: true, message: '请输入剂量' },
                { max: 20, message: '剂量最多20个字符' }
              ]}
            >
              <Input placeholder="例如：1片" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="hour"
              label="小时"
              rules={[
                { required: true, message: '请选择小时' },
                { type: 'number', min: 0, max: 23, message: '小时必须在0-23之间' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                placeholder="0-23"
                min={0}
                max={23}
                addonBefore={<ClockCircleOutlined />}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="minute"
              label="分钟"
              rules={[
                { required: true, message: '请选择分钟' },
                { type: 'number', min: 0, max: 59, message: '分钟必须在0-59之间' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                placeholder="0-59"
                min={0}
                max={59}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="boxNum"
              label="药格编号"
              rules={[{ required: true, message: '请选择药格' }]}
            >
              <Select placeholder="选择药格">
                <Option value={1}>第1格</Option>
                <Option value={2}>第2格</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="enabled"
              label="启用状态"
              valuePropName="checked"
            >
              <Select placeholder="选择状态">
                <Option value={true}>启用</Option>
                <Option value={false}>停用</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default MedicineForm;