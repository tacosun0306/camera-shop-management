import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { authApi } from '../../api/auth';
import { branchApi } from '../../api/branch';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data: any = await authApi.getUsers();
      setUsers(data);
    } catch (error) {
      message.error('載入用戶列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      const data: any = await branchApi.getAll();
      setBranches(data);
    } catch (error) {
      message.error('載入分店列表失敗');
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingUser(record);
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      branch_id: record.branch_id,
      role: record.role,
      is_active: record.is_active,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await authApi.deleteUser(id);
      message.success('用戶刪除成功');
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingUser) {
        // 如果沒有輸入新密碼，則不更新密碼
        const updateData = { ...values };
        if (!updateData.password) {
          delete updateData.password;
        }
        await authApi.updateUser(editingUser.id, updateData);
        message.success('用戶更新成功');
      } else {
        await authApi.createUser(values);
        message.success('用戶新增成功');
      }
      setModalVisible(false);
      loadUsers();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '帳號',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '所屬分店',
      dataIndex: 'branch_name',
      key: 'branch_name',
      render: (name: string) => <Tag color="blue">{name}</Tag>,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: any = {
          admin: { color: 'red', text: '管理員' },
          staff: { color: 'green', text: '員工' },
        };
        const config = roleMap[role] || { color: 'default', text: role };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: number) => (
        <Tag color={active ? 'green' : 'red'}>{active ? '啟用' : '停用'}</Tag>
      ),
    },
    {
      title: '建立時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString('zh-TW'),
    },
    {
      title: '操作',
      key: 'actions',
      render: (text: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          {record.id !== 1 && record.id !== currentUser?.id && (
            <Popconfirm
              title="確定要刪除此用戶嗎？"
              onConfirm={() => handleDelete(record.id)}
              okText="確定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                刪除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">用戶管理</h1>

      <Card>
        <div className="mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用戶
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 位用戶` }}
        />
      </Card>

      <Modal
        title={editingUser ? '編輯用戶' : '新增用戶'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="帳號"
            name="username"
            rules={[{ required: true, message: '請輸入帳號' }]}
          >
            <Input
              placeholder="請輸入帳號"
              disabled={!!editingUser}
              prefix={<UserOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="密碼"
            name="password"
            rules={[
              {
                required: !editingUser,
                message: '請輸入密碼',
              },
            ]}
          >
            <Input.Password
              placeholder={editingUser ? '留空則不修改密碼' : '請輸入密碼'}
            />
          </Form.Item>

          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '請輸入姓名' }]}
          >
            <Input placeholder="請輸入姓名" />
          </Form.Item>

          <Form.Item
            label="所屬分店"
            name="branch_id"
            rules={[{ required: true, message: '請選擇分店' }]}
          >
            <Select
              placeholder="請選擇分店"
              options={branches.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '請選擇角色' }]}
            initialValue="staff"
          >
            <Select
              placeholder="請選擇角色"
              options={[
                { label: '管理員', value: 'admin' },
                { label: '員工', value: 'staff' },
              ]}
            />
          </Form.Item>

          {editingUser && (
            <Form.Item
              label="狀態"
              name="is_active"
              rules={[{ required: true, message: '請選擇狀態' }]}
            >
              <Select
                placeholder="請選擇狀態"
                options={[
                  { label: '啟用', value: 1 },
                  { label: '停用', value: 0 },
                ]}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingUser ? '更新' : '新增'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
