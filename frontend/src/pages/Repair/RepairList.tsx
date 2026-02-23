import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Tag, message, Select, Space } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { repairApi, Repair } from '../../api/repair';

const RepairList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [repairs, setRepairs] = useState<Repair[]>([]);

  useEffect(() => {
    loadRepairs();
  }, []);

  const loadRepairs = async (filters?: any) => {
    try {
      setLoading(true);
      const data: any = await repairApi.getAll(filters);
      setRepairs(data);
    } catch (error) {
      message.error('載入維修列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (status: string) => {
    loadRepairs(status ? { status } : {});
  };

  const statusConfig: any = {
    RECEIVED: { color: 'blue', label: '已收件' },
    IN_REPAIR: { color: 'processing', label: '維修中' },
    WAITING_PARTS: { color: 'warning', label: '待料中' },
    COMPLETED: { color: 'success', label: '已完成' },
    DELIVERED: { color: 'default', label: '已取件' },
    CANCELLED: { color: 'error', label: '已取消' },
  };

  const columns = [
    {
      title: '維修單號',
      dataIndex: 'repair_no',
      key: 'repair_no',
      width: 120,
    },
    {
      title: '客戶姓名',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: '客戶電話',
      dataIndex: 'customer_phone',
      key: 'customer_phone',
    },
    {
      title: '物品',
      dataIndex: 'item_name',
      key: 'item_name',
    },
    {
      title: '品牌/型號',
      key: 'brand_model',
      render: (record: Repair) => {
        const parts = [record.item_brand, record.item_model].filter(Boolean);
        return parts.join(' / ') || '-';
      },
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = statusConfig[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: '預估費用',
      dataIndex: 'estimated_cost',
      key: 'estimated_cost',
      render: (cost: number) => cost ? `$${cost.toLocaleString()}` : '-',
    },
    {
      title: '收件日期',
      dataIndex: 'received_date',
      key: 'received_date',
    },
    {
      title: '預計完成',
      dataIndex: 'estimated_completion_date',
      key: 'estimated_completion_date',
      render: (date: string) => date || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (record: Repair) => (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => navigate(`/repairs/edit/${record.id}`)}
        >
          編輯
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">維修品管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/repairs/new')}>
          新增維修品
        </Button>
      </div>

      <Space className="mb-4">
        <Select
          placeholder="篩選狀態"
          allowClear
          style={{ width: 150 }}
          onChange={handleStatusChange}
          options={Object.entries(statusConfig).map(([key, value]: any) => ({
            label: value.label,
            value: key,
          }))}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={repairs}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆` }}
      />
    </div>
  );
};

export default RepairList;
