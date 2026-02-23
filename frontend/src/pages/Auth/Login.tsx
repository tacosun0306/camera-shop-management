import React, { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      await login(values.username, values.password);
      message.success('登入成功');
      navigate('/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.error || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📷 相機店管理系統</h1>
          <p className="text-gray-500">請登入您的帳號</p>
        </div>

        <Form
          name="login"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="帳號"
            name="username"
            rules={[{ required: true, message: '請輸入帳號' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="請輸入帳號"
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="請輸入密碼"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              登入
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center text-gray-500 text-sm mt-4">
          <p>預設帳號：admin</p>
          <p>預設密碼：admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
