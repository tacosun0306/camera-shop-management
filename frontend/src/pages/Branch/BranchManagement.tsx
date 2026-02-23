import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Tag,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { branchApi } from '../../api/branch';

const BranchManagement: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [inventoryModal, setInventoryModal] = useState<{
    visible: boolean;
    branchId: number | null;
    branchName: string;
    inventory: any[];
  }>({ visible: false, branchId: null, branchName: '', inventory: [] });

  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const data: any = await branchApi.getAll();
      setBranches(data);
    } catch (error) {
      message.error('載入分店列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingBranch(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingBranch(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await branchApi.delete(id);
      message.success('分店刪除成功');
      loadBranches();
    } catch (error: any) {
      message.error(error.response?.data?.error || '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (editingBranch) {
        await branchApi.update(editingBranch.id, values);
        message.success('分店更新成功');
      } else {
        await branchApi.create(values);
        message.success('分店新增成功');
      }
      setModalVisible(false);
      loadBranches();
    } catch (error: any) {
      message.error(error.response?.data?.error || '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleViewInventory = async (branch: any) => {
    try {
      setLoading(true);
      const data: any = await branchApi.getInventory(branch.id);
      setInventoryModal({
        visible: true,
        branchId: branch.id,
        branchName: branch.name,
        inventory: data,
      });
    } catch (error) {
      message.error('載入庫存資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '分店代碼',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: '分店名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: '電話',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '負責人',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '狀態',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: number) => (
        <Tag color={active ? 'green' : 'red'}>{active ? '營業中' : '已停用'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<ShopOutlined />}
            onClick={() => handleViewInventory(record)}
          >
            查看庫存
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          {record.id !== 1 && (
            <Popconfirm
              title="確定要刪除此分店嗎？"
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

  const inventoryColumns = [
    {
      title: '條碼',
      dataIndex: 'barcode',
      key: 'barcode',
    },
    {
      title: '商品名稱',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: '分類',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '庫存數量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty: number) => (
        <span style={{ color: qty > 0 ? 'green' : 'red', fontWeight: 'bold' }}>
          {qty}
        </span>
      ),
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '售價',
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (price: number) => `$${price?.toLocaleString() || 0}`,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">分店管理</h1>

      <Card>
        <div className="mb-4">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增分店
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={branches}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 間分店` }}
        />
      </Card>

      <Modal
        title={editingBranch ? '編輯分店' : '新增分店'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="分店代碼"
            name="code"
            rules={[{ required: true, message: '請輸入分店代碼' }]}
          >
            <Input placeholder="例如：MAIN, BR01, BR02" />
          </Form.Item>

          <Form.Item
            label="分店名稱"
            name="name"
            rules={[{ required: true, message: '請輸入分店名稱' }]}
          >
            <Input placeholder="請輸入分店名稱" />
          </Form.Item>

          <Form.Item label="地址" name="address">
            <Input placeholder="請輸入地址" />
          </Form.Item>

          <Form.Item label="電話" name="phone">
            <Input placeholder="請輸入電話" />
          </Form.Item>

          <Form.Item label="負責人" name="manager">
            <Input placeholder="請輸入負責人姓名" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingBranch ? '更新' : '新增'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`${inventoryModal.branchName} - 庫存清單`}
        open={inventoryModal.visible}
        onCancel={() => setInventoryModal({ ...inventoryModal, visible: false })}
        footer={null}
        width={1000}
      >
        <Table
          columns={inventoryColumns}
          dataSource={inventoryModal.inventory}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 項商品` }}
        />
      </Modal>
    </div>
  );
};

export default BranchManagement;
