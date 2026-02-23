import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, message, Modal, Select, Form, Space, Popconfirm } from 'antd';
import { PlusOutlined, EyeOutlined, DeleteOutlined, MobileOutlined } from '@ant-design/icons';
import { stocktakingApi, Stocktaking } from '../../api/stocktaking';
import { useAuth } from '../../contexts/AuthContext';

const StocktakingList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stocktakings, setStocktakings] = useState<Stocktaking[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const categories = [
    '相機', '鏡頭', '電池', '充電器', '記憶卡',
    '拍立得', '底片', '拍立得底片', '腳架', '閃光燈',
    '空拍機', '攝影機', '配件'
  ];

  useEffect(() => {
    loadStocktakings();
  }, []);

  const loadStocktakings = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (user?.role === 'staff') {
        params.branch_id = user.branch_id;
        params.role = user.role;
      }
      const data: any = await stocktakingApi.getAll(params);
      setStocktakings(data);
    } catch (error) {
      message.error('載入盤點列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const showCreateModal = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await stocktakingApi.delete(id);
      message.success('盤點單已刪除');
      loadStocktakings();
    } catch (error) {
      message.error('刪除盤點單失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (values: any) => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      let selectedCategories = values.categories || [];
      
      // 如果選擇了"全部"，則不傳遞 categories 參數
      if (selectedCategories.includes('全部')) {
        selectedCategories = [];
      }
      
      const notes = selectedCategories.length > 0
        ? `類別盤點: ${selectedCategories.join(', ')}`
        : '全部商品盤點';
      
      const data: any = await stocktakingApi.create({
        branch_id: user?.branch_id || 1,
        stocktaking_date: today,
        created_by: user?.username || '系統管理員',
        notes,
        categories: selectedCategories,
      });
      
      message.success('盤點單建立成功');
      setModalVisible(false);
      navigate(`/stocktaking/${data.id}`);
    } catch (error) {
      message.error('建立盤點單失敗');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '盤點單號',
      dataIndex: 'id',
      key: 'id',
      render: (id: number) => `#${id}`,
    },
    {
      title: '分店',
      dataIndex: 'branch_name',
      key: 'branch_name',
      render: (name: string) => name || '-',
    },
    {
      title: '盤點日期',
      dataIndex: 'stocktaking_date',
      key: 'stocktaking_date',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: any = { IN_PROGRESS: 'processing', COMPLETED: 'success' };
        const nameMap: any = { IN_PROGRESS: '進行中', COMPLETED: '已完成' };
        return <Tag color={colorMap[status]}>{nameMap[status]}</Tag>;
      },
    },
    {
      title: '備註',
      dataIndex: 'notes',
      key: 'notes',
    },
    {
      title: '建立人員',
      dataIndex: 'created_by',
      key: 'created_by',
    },
    {
      title: '建立時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-TW'),
    },
    {
      title: '完成時間',
      dataIndex: 'completed_at',
      key: 'completed_at',
      render: (date: string) => date ? new Date(date).toLocaleString('zh-TW') : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Stocktaking) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/stocktaking/${record.id}`)}
          >
            查看詳情
          </Button>
          {record.status === 'IN_PROGRESS' && (
            <Button
              type="link"
              icon={<MobileOutlined />}
              onClick={() => navigate(`/stocktaking/mobile/${record.id}`)}
            >
              手機盤點
            </Button>
          )}
          {user?.role === 'admin' && (
            <Popconfirm
              title="確定要刪除此盤點單嗎？"
              description="刪除後將無法恢復"
              onConfirm={() => handleDelete(record.id!)}
              okText="確定"
              cancelText="取消"
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
              >
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">盤點管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateModal}>
          建立新盤點單
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={stocktakings}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆` }}
      />

      <Modal
        title="建立新盤點單"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="建立"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="選擇盤點類別"
            name="categories"
            tooltip="選擇全部將盤點所有商品類別"
          >
            <Select
              mode="multiple"
              placeholder="請選擇要盤點的類別（可多選）"
              allowClear
              options={[
                { label: '全部', value: '全部' },
                ...categories.map((cat: string) => ({ label: cat, value: cat }))
              ]}
            />
          </Form.Item>
          <div className="text-gray-500 text-sm">
            💡 提示：選擇「全部」或不選擇任何類別，將盤點所有商品；選擇特定類別可針對該類型商品進行盤點
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default StocktakingList;
