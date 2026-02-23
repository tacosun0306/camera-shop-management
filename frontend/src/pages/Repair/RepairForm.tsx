import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, message, Select, DatePicker, Space } from 'antd';
import { ArrowLeftOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { repairApi } from '../../api/repair';

const { TextArea } = Input;

const RepairForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadRepair();
    } else {
      // 自動生成維修單號
      const repairNo = `R${Date.now().toString().slice(-8)}`;
      form.setFieldValue('repair_no', repairNo);
    }
  }, [id]);

  const loadRepair = async () => {
    try {
      setLoading(true);
      const data: any = await repairApi.getById(Number(id));
      
      // 轉換日期格式
      const formData: any = { ...data };
      if (data.received_date) formData.received_date = dayjs(data.received_date);
      if (data.estimated_completion_date) formData.estimated_completion_date = dayjs(data.estimated_completion_date);
      if (data.completed_date) formData.completed_date = dayjs(data.completed_date);
      if (data.delivered_date) formData.delivered_date = dayjs(data.delivered_date);
      
      form.setFieldsValue(formData);
    } catch (error) {
      message.error('載入維修資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 轉換日期格式
      const submitData = { ...values };
      if (values.received_date) submitData.received_date = values.received_date.format('YYYY-MM-DD');
      if (values.estimated_completion_date) submitData.estimated_completion_date = values.estimated_completion_date.format('YYYY-MM-DD');
      if (values.completed_date) submitData.completed_date = values.completed_date.format('YYYY-MM-DD');
      if (values.delivered_date) submitData.delivered_date = values.delivered_date.format('YYYY-MM-DD');
      
      if (isEdit) {
        await repairApi.update(Number(id), submitData);
        message.success('維修資料更新成功');
      } else {
        await repairApi.create(submitData);
        message.success('維修品登記成功');
      }
      navigate('/repairs');
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await repairApi.delete(Number(id));
      message.success('維修品刪除成功');
      navigate('/repairs');
    } catch (error) {
      message.error('刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Space className="mb-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/repairs')}>
          返回列表
        </Button>
        {isEdit && (
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete} loading={loading}>
            刪除
          </Button>
        )}
      </Space>

      <Card title={isEdit ? '編輯維修品' : '新增維修品'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'RECEIVED',
            received_date: dayjs(),
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              label="維修單號"
              name="repair_no"
              rules={[{ required: true, message: '請輸入維修單號' }]}
            >
              <Input placeholder="維修單號" disabled={isEdit} />
            </Form.Item>

            <Form.Item
              label="狀態"
              name="status"
              rules={[{ required: true, message: '請選擇狀態' }]}
            >
              <Select
                options={[
                  { label: '已收件', value: 'RECEIVED' },
                  { label: '維修中', value: 'IN_REPAIR' },
                  { label: '待料中', value: 'WAITING_PARTS' },
                  { label: '已完成', value: 'COMPLETED' },
                  { label: '已取件', value: 'DELIVERED' },
                  { label: '已取消', value: 'CANCELLED' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="客戶姓名"
              name="customer_name"
              rules={[{ required: true, message: '請輸入客戶姓名' }]}
            >
              <Input placeholder="客戶姓名" />
            </Form.Item>

            <Form.Item
              label="客戶電話"
              name="customer_phone"
              rules={[{ required: true, message: '請輸入客戶電話' }]}
            >
              <Input placeholder="客戶電話" />
            </Form.Item>

            <Form.Item
              label="物品名稱"
              name="item_name"
              rules={[{ required: true, message: '請輸入物品名稱' }]}
            >
              <Input placeholder="例如：Canon EOS R6" />
            </Form.Item>

            <Form.Item label="物品品牌" name="item_brand">
              <Input placeholder="品牌" />
            </Form.Item>

            <Form.Item label="物品型號" name="item_model">
              <Input placeholder="型號" />
            </Form.Item>

            <Form.Item
              label="收件日期"
              name="received_date"
              rules={[{ required: true, message: '請選擇收件日期' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="預估完成日期" name="estimated_completion_date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="實際完成日期" name="completed_date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="取件日期" name="delivered_date">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="預估費用" name="estimated_cost">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="預估費用"
                prefix="$"
              />
            </Form.Item>

            <Form.Item label="實際費用" name="actual_cost">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="實際費用"
                prefix="$"
              />
            </Form.Item>
          </div>

          <Form.Item label="問題描述" name="problem_description">
            <TextArea rows={4} placeholder="請描述物品的問題" />
          </Form.Item>

          <Form.Item label="備註" name="notes">
            <TextArea rows={3} placeholder="其他備註" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEdit ? '更新' : '新增'}
              </Button>
              <Button onClick={() => navigate('/repairs')}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RepairForm;
