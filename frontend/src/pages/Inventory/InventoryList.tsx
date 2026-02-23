import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, message, Input, Select, Space } from 'antd';
import { WarningOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { inventoryApi } from '../../api/inventory';
import { useAuth } from '../../contexts/AuthContext';

const InventoryList: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user } = useAuth();

  useEffect(() => {
    loadInventory();
  }, []);

  useEffect(() => {
    filterInventory();
  }, [inventory, searchText, selectedBranch, selectedCategory]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data: any = await inventoryApi.getAll();
      setInventory(data);
    } catch (error) {
      message.error('載入庫存列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const filterInventory = () => {
    let filtered = [...inventory];

    // 文字搜尋：條碼、商品名稱、品牌
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(item => 
        item.barcode?.toLowerCase().includes(search) ||
        item.name?.toLowerCase().includes(search) ||
        item.brand?.toLowerCase().includes(search)
      );
    }

    // 分店篩選
    if (selectedBranch !== 'all') {
      filtered = filtered.filter(item => item.branch_name === selectedBranch);
    }

    // 分類篩選
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredInventory(filtered);
  };

  // 取得所有分店選項
  const getBranchOptions = () => {
    const branches = Array.from(new Set(inventory.map(item => item.branch_name).filter(Boolean)));
    return [
      { label: '全部分店', value: 'all' },
      ...branches.map(branch => ({ label: branch, value: branch }))
    ];
  };

  // 取得所有分類選項
  const getCategoryOptions = () => {
    const categories = Array.from(new Set(inventory.map(item => item.category).filter(Boolean)));
    return [
      { label: '全部分類', value: 'all' },
      ...categories.map(cat => ({ label: cat, value: cat }))
    ];
  };

  const columns = [
    {
      title: '條碼',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
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
      render: (category: string) => category && <Tag color="blue">{category}</Tag>,
    },
    {
      title: '成本',
      dataIndex: 'cost_price',
      key: 'cost_price',
      render: (price: number) => `$${price?.toLocaleString() || 0}`,
    },
    {
      title: '售價',
      dataIndex: 'selling_price',
      key: 'selling_price',
      render: (price: number) => `$${price?.toLocaleString() || 0}`,
    },
    {
      title: '所屬分店',
      dataIndex: 'owner_branch_name',
      key: 'owner_branch_name',
      render: (name: string) => name && <Tag color="purple">{name}</Tag>,
    },
    {
      title: '庫存分店',
      dataIndex: 'branch_name',
      key: 'branch_name',
      render: (name: string) => name && <Tag color="orange">{name}</Tag>,
    },
    {
      title: '現有庫存',
      dataIndex: 'quantity',
      key: 'quantity',
      sorter: (a: any, b: any) => a.quantity - b.quantity,
      render: (qty: number, record: any) => {
        const isLow = qty <= record.min_stock_level;
        return (
          <Tag color={isLow ? 'red' : 'green'} icon={isLow ? <WarningOutlined /> : null}>
            {qty}
          </Tag>
        );
      },
    },
    {
      title: '最低庫存',
      dataIndex: 'min_stock_level',
      key: 'min_stock_level',
    },
    {
      title: '庫存成本',
      key: 'cost_value',
      render: (record: any) => {
        const value = record.quantity * (record.cost_price || 0);
        return `$${value.toLocaleString()}`;
      },
    },
    {
      title: '庫存價值',
      key: 'value',
      render: (record: any) => {
        const value = record.quantity * (record.selling_price || 0);
        return `$${value.toLocaleString()}`;
      },
    },
    {
      title: '儲位',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '更新時間',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => date ? new Date(date).toLocaleString('zh-TW') : '-',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">庫存管理</h1>
        <Button icon={<ReloadOutlined />} onClick={loadInventory}>
          重新載入
        </Button>
      </div>

      {/* 搜尋和篩選區域 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            placeholder="搜尋條碼、商品名稱或品牌"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            size="large"
          />
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="選擇分店"
              value={selectedBranch}
              onChange={setSelectedBranch}
              options={getBranchOptions()}
            />
            <Select
              style={{ width: 200 }}
              placeholder="選擇分類"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={getCategoryOptions()}
            />
            <Button 
              onClick={() => {
                setSearchText('');
                setSelectedBranch('all');
                setSelectedCategory('all');
              }}
            >
              清除篩選
            </Button>
          </Space>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredInventory}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 項`,
        }}
        rowClassName={(record: any) =>
          record.quantity <= record.min_stock_level ? 'bg-red-50' : ''
        }
      />
    </div>
  );
};

export default InventoryList;
