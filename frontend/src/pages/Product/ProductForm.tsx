import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, message, Select } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { productApi, Product } from '../../api/product';
import { useAuth } from '../../contexts/AuthContext';

const { TextArea } = Input;

const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const data: any = await productApi.getById(Number(id));
      form.setFieldsValue(data);
    } catch (error) {
      message.error('載入商品資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: Product) => {
    try {
      setLoading(true);
      if (isEdit) {
        await productApi.update(Number(id), values);
        message.success('商品更新成功');
      } else {
        // 新增時帶入當前分店ID
        await productApi.create({ ...values, branch_id: user?.branch_id });
        message.success('商品新增成功');
      }
      navigate('/products');
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/products')}
        className="mb-4"
      >
        返回列表
      </Button>

      <Card title={isEdit ? '編輯商品' : '新增商品'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            cost_price: 0,
            selling_price: 0,
            min_stock_level: 0,
          }}
        >
          <Form.Item
            label="條碼"
            name="barcode"
            rules={[{ required: true, message: '請輸入條碼' }]}
          >
            <Input placeholder="請輸入商品條碼" disabled={isEdit} />
          </Form.Item>

          <Form.Item
            label="商品名稱"
            name="name"
            rules={[{ required: true, message: '請輸入商品名稱' }]}
          >
            <Input placeholder="請輸入商品名稱" />
          </Form.Item>

          <Form.Item label="品牌" name="brand">
            <Input placeholder="請輸入品牌" />
          </Form.Item>

          <Form.Item label="分類" name="category">
            <Select
              placeholder="請選擇分類"
              options={[
                { label: '相機', value: '相機' },
                { label: '鏡頭', value: '鏡頭' },
                { label: '電池', value: '電池' },
                { label: '充電器', value: '充電器' },
                { label: '記憶卡', value: '記憶卡' },
                { label: '拍立得', value: '拍立得' },
                { label: '底片', value: '底片' },
                { label: '拍立得底片', value: '拍立得底片' },
                { label: '腳架', value: '腳架' },
                { label: '閃光燈', value: '閃光燈' },
                { label: '空拍機', value: '空拍機' },
                { label: '攝影機', value: '攝影機' },
                { label: '配件', value: '配件' },
              ]}
            />
          </Form.Item>

          <Form.Item label="型號" name="model">
            <Input placeholder="請輸入型號" />
          </Form.Item>

          <Form.Item label="商品描述" name="description">
            <TextArea rows={4} placeholder="請輸入商品描述" />
          </Form.Item>

          <Form.Item label="成本價" name="cost_price">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="請輸入成本價"
              prefix="$"
            />
          </Form.Item>

          <Form.Item label="售價" name="selling_price">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="請輸入售價"
              prefix="$"
            />
          </Form.Item>

          <Form.Item label="最低庫存量" name="min_stock_level">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="請輸入最低庫存量"
            />
          </Form.Item>

          {!isEdit && (
            <Form.Item 
              label="初始庫存量" 
              name="initial_quantity"
              tooltip="新增商品時可直接設定初始庫存，若不填寫則預設為 0"
            >
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="請輸入初始庫存量（選填）"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '更新' : '新增'}
            </Button>
            <Button onClick={() => navigate('/products')} className="ml-2">
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProductForm;
