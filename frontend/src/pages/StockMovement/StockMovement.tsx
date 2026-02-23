import React, { useEffect, useState, useRef } from 'react';
import {
  Card,
  Form,
  Select,
  Input,
  InputNumber,
  Button,
  Table,
  DatePicker,
  Space,
  message,
  Modal,
  Tag,
} from 'antd';
import {
  PlusOutlined,
  ScanOutlined,
  CameraOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Html5Qrcode } from 'html5-qrcode';
import { productApi } from '../../api/product';
import { stockMovementApi } from '../../api/stockMovement';
import { branchApi } from '../../api/branch';
import { useAuth } from '../../contexts/AuthContext';

const { RangePicker } = DatePicker;

const StockMovementPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadMovements();
    loadProducts();
    loadBranches();
    // 預設設定當前分店
    if (user) {
      form.setFieldsValue({ 
        from_branch_id: user.branch_id,
        to_branch_id: user.branch_id 
      });
    }
  }, [user]);

  const loadMovements = async (filters?: any) => {
    try {
      setLoading(true);
      const data: any = await stockMovementApi.getAll(filters);
      setMovements(data);
    } catch (error) {
      message.error('載入出入庫記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const data: any = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      message.error('載入商品列表失敗');
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

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await stockMovementApi.create(values);
      message.success('出入庫記錄新增成功');
      form.resetFields();
      loadMovements();
    } catch (error: any) {
      message.error(error.response?.data?.error || '新增失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (values: any) => {
    const filters: any = {};
    if (values.dateRange) {
      filters.startDate = values.dateRange[0].format('YYYY-MM-DD');
      filters.endDate = values.dateRange[1].format('YYYY-MM-DD');
    }
    if (values.type) {
      filters.type = values.type;
    }
    if (values.category) {
      filters.category = values.category;
    }
    if (values.branchId) {
      filters.branchId = values.branchId;
    }
    loadMovements(filters);
  };

  const startScanner = async () => {
    setScannerVisible(true);
    
    setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('scanner-container');
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            // 掃描成功
            await stopScanner();
            
            try {
              const product: any = await productApi.getByBarcode(decodedText);
              form.setFieldsValue({ product_id: product.id });
              message.success(`已掃描商品: ${product.name}`);
            } catch (error) {
              message.error('找不到該商品條碼');
            }
          },
          () => {
            // 掃描錯誤（可忽略）
          }
        );
      } catch (error) {
        message.error('無法啟動相機');
        setScannerVisible(false);
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (error) {
        console.error('停止掃描器失敗:', error);
      }
    }
    setScannerVisible(false);
    scannerRef.current = null;
  };

  const columns = [
    {
      title: '日期時間',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-TW'),
    },
    {
      title: '類型',
      dataIndex: 'movement_type',
      key: 'movement_type',
      render: (type: string) => {
        const colorMap: any = { IN: 'green', TRANSFER: 'blue', SALE: 'purple', ADJUST: 'orange' };
        const nameMap: any = { IN: '入庫', TRANSFER: '調貨', SALE: '售出', ADJUST: '調整' };
        return <Tag color={colorMap[type]}>{nameMap[type]}</Tag>;
      },
    },
    {
      title: '商品',
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
      title: '數量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '來源分店',
      dataIndex: 'from_branch_name',
      key: 'from_branch_name',
      render: (name: string) => name || '-',
    },
    {
      title: '目標分店',
      dataIndex: 'to_branch_name',
      key: 'to_branch_name',
      render: (name: string) => name || '-',
    },
    {
      title: '成本',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost: number) => cost ? `$${cost.toLocaleString()}` : '-',
    },
    {
      title: '售出金額',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => amount ? `$${amount.toLocaleString()}` : '-',
    },
    {
      title: '參考單號',
      dataIndex: 'reference_no',
      key: 'reference_no',
    },
    {
      title: '操作人員',
      dataIndex: 'operator',
      key: 'operator',
    },
    {
      title: '備註',
      dataIndex: 'notes',
      key: 'notes',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">出入庫管理</h1>

      <Card title="新增出入庫記錄" className="mb-6">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label="商品"
              name="product_id"
              rules={[{ required: true, message: '請選擇商品' }]}
            >
              <Select
                showSearch
                placeholder="請選擇商品"
                optionFilterProp="children"
                filterOption={(input, option: any) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
                options={products.map((p) => ({
                  label: `${p.barcode} - ${p.name}`,
                  value: p.id,
                }))}
              />
            </Form.Item>

            <Form.Item>
              <label className="block mb-2">掃描條碼</label>
              <Button icon={<ScanOutlined />} onClick={startScanner}>
                開始掃描
              </Button>
            </Form.Item>

            <Form.Item
              label="類型"
              name="movement_type"
              rules={[{ required: true, message: '請選擇類型' }]}
            >
              <Select
                placeholder="請選擇類型"
                onChange={() => form.setFieldsValue({ cost: undefined, amount: undefined, from_branch_id: undefined, to_branch_id: undefined })}
                options={[
                  { label: '入庫', value: 'IN' },
                  { label: '分店調貨', value: 'TRANSFER' },
                  { label: '售出', value: 'SALE' },
                  { label: '調整', value: 'ADJUST' },
                ]}
              />
            </Form.Item>

            <Form.Item
              label="數量"
              name="quantity"
              rules={[{ required: true, message: '請輸入數量' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="請輸入數量" />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.movement_type !== curr.movement_type}>
              {({ getFieldValue }) => {
                const movementType = getFieldValue('movement_type');
                
                if (movementType === 'IN') {
                  return (
                    <Form.Item
                      label="入庫到分店"
                      name="to_branch_id"
                      rules={[{ required: true, message: '請選擇分店' }]}
                    >
                      <Select
                        placeholder="請選擇分店"
                        options={branches.map((b) => ({ label: b.name, value: b.id }))}
                      />
                    </Form.Item>
                  );
                }
                
                if (movementType === 'SALE' || movementType === 'ADJUST') {
                  return (
                    <>
                      <Form.Item
                        label="分店"
                        name="from_branch_id"
                        rules={[{ required: true, message: '請選擇分店' }]}
                      >
                        <Select
                          placeholder="請選擇分店"
                          options={branches.map((b) => ({ label: b.name, value: b.id }))}
                        />
                      </Form.Item>
                      {movementType === 'SALE' && (
                        <Form.Item
                          label="售出金額"
                          name="amount"
                          rules={[{ required: true, message: '請輸入售出金額' }]}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="請輸入售出金額"
                            prefix="$"
                          />
                        </Form.Item>
                      )}
                    </>
                  );
                }
                
                if (movementType === 'TRANSFER') {
                  return (
                    <>
                      <Form.Item
                        label="來源分店"
                        name="from_branch_id"
                        rules={[{ required: true, message: '請選擇來源分店' }]}
                      >
                        <Select
                          placeholder="請選擇來源分店"
                          options={branches.map((b) => ({ label: b.name, value: b.id }))}
                        />
                      </Form.Item>
                      <Form.Item
                        label="目標分店"
                        name="to_branch_id"
                        rules={[{ required: true, message: '請選擇目標分店' }]}
                      >
                        <Select
                          placeholder="請選擇目標分店"
                          options={branches.map((b) => ({ label: b.name, value: b.id }))}
                        />
                      </Form.Item>
                    </>
                  );
                }
                
                return null;
              }}
            </Form.Item>

            <Form.Item label="參考單號" name="reference_no">
              <Input placeholder="請輸入參考單號" />
            </Form.Item>

            <Form.Item label="操作人員" name="operator">
              <Input placeholder="請輸入操作人員" />
            </Form.Item>

            <Form.Item label="備註" name="notes" className="md:col-span-2 lg:col-span-3">
              <Input.TextArea rows={2} placeholder="請輸入備註" />
            </Form.Item>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} loading={loading}>
              新增記錄
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="出入庫記錄">
        <Form layout="inline" onFinish={handleFilter} className="mb-4">
          <Form.Item name="dateRange">
            <RangePicker placeholder={['開始日期', '結束日期']} />
          </Form.Item>
          <Form.Item name="type">
            <Select
              placeholder="選擇類型"
              allowClear
              style={{ width: 120 }}
              options={[
                { label: '入庫', value: 'IN' },
                { label: '調貨', value: 'TRANSFER' },
                { label: '售出', value: 'SALE' },
                { label: '調整', value: 'ADJUST' },
              ]}
            />
          </Form.Item>
          <Form.Item name="branchId">
            <Select
              placeholder="選擇分店"
              allowClear
              style={{ width: 150 }}
              options={branches.map((b) => ({ label: b.name, value: b.id }))}
            />
          </Form.Item>
          <Form.Item name="category">
            <Select
              placeholder="選擇分類"
              allowClear
              style={{ width: 150 }}
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
          <Form.Item>
            <Button type="primary" htmlType="submit">
              篩選
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={movements}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 筆` }}
        />
      </Card>

      <Modal
        title={<Space><CameraOutlined />條碼掃描</Space>}
        open={scannerVisible}
        onCancel={stopScanner}
        footer={[
          <Button key="close" onClick={stopScanner} icon={<CloseOutlined />}>
            關閉
          </Button>
        ]}
        width={600}
      >
        <div id="scanner-container" style={{ width: '100%' }}></div>
      </Modal>
    </div>
  );
};

export default StockMovementPage;
