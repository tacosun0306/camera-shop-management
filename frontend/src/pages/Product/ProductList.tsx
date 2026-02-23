import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, message, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { productApi } from '../../api/product';
import { inventoryApi } from '../../api/inventory';
import { useAuth } from '../../contexts/AuthContext';

const { Search } = Input;

const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (search?: string, category?: string) => {
    try {
      setLoading(true);
      const data: any = await productApi.getAll({ 
        search, 
        category,
        branch_id: user?.branch_id,
        role: user?.role
      });
      
      // 同時取得庫存資料
      const inventory: any = await inventoryApi.getAll({
        branch_id: user?.branch_id,
        role: user?.role
      });
      const inventoryMap = new Map(inventory.map((item: any) => [item.product_id, item]));
      
      const productsWithInventory = data.map((product: any) => ({
        ...product,
        inventory: inventoryMap.get(product.id),
      }));
      
      setProducts(productsWithInventory);
    } catch (error) {
      message.error('載入商品列表失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    loadProducts(value, selectedCategory);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    loadProducts(searchText, value);
  };

  const handleDelete = async (id: number) => {
    try {
      await productApi.delete(id);
      message.success('商品刪除成功');
      loadProducts();
    } catch (error) {
      message.error('商品刪除失敗');
    }
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
      title: '所屬分店',
      dataIndex: 'owner_branch_name',
      key: 'owner_branch_name',
      render: (name: string) => name && <Tag color="purple">{name}</Tag>,
    },
    {
      title: '型號',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '成本價',
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
      title: '庫存',
      key: 'inventory',
      render: (record: any) => {
        const qty = record.inventory?.quantity || 0;
        const minLevel = record.min_stock_level || 0;
        const isLow = qty <= minLevel;
        return <Tag color={isLow ? 'red' : 'green'}>{qty}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: any) => {
        // 檢查是否為自己分店的商品
        const isOwnBranch = record.owner_branch_id === user?.branch_id;
        const canEdit = user?.role === 'admin' || (isStaff && isOwnBranch);
        
        return (
          <Space>
            {canEdit ? (
              <>
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/products/edit/${record.id}`)}
                >
                  編輯
                </Button>
                <Popconfirm
                  title="確定要刪除這個商品嗎？"
                  onConfirm={() => handleDelete(record.id!)}
                  okText="確定"
                  cancelText="取消"
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    刪除
                  </Button>
                </Popconfirm>
              </>
            ) : (
              <span className="text-gray-400">不可編輯</span>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">商品管理</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products/new')}
        >
          新增商品
        </Button>
      </div>

      <Space className="mb-4" size="middle">
        <Search
          placeholder="搜尋商品名稱、條碼或品牌"
          allowClear
          onSearch={handleSearch}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Select
          placeholder="選擇分類"
          allowClear
          style={{ width: 150 }}
          onChange={handleCategoryChange}
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
      </Space>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 項` }}
      />
    </div>
  );
};

export default ProductList;
