import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Table,
  InputNumber,
  Input,
  message,
  Tag,
  Space,
  Modal,
  Statistic,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckOutlined,
  SaveOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { stocktakingApi, type Stocktaking, type StocktakingDetail } from '../../api/stocktaking';

const StocktakingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stocktaking, setStocktaking] = useState<Stocktaking | null>(null);
  const [details, setDetails] = useState<StocktakingDetail[]>([]);
  const [editingKey, setEditingKey] = useState<number | null>(null);

  useEffect(() => {
    loadStocktaking();
  }, [id]);

  const loadStocktaking = async () => {
    try {
      setLoading(true);
      const data: any = await stocktakingApi.getById(Number(id));
      setStocktaking(data);
      setDetails(data.details || []);
    } catch (error) {
      message.error('載入盤點資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (detailId: number, actual_quantity: number, notes?: string) => {
    try {
      await stocktakingApi.updateDetail(detailId, { actual_quantity, notes });
      message.success('盤點數量更新成功');
      loadStocktaking();
      setEditingKey(null);
    } catch (error) {
      message.error('更新失敗');
    }
  };

  const handleComplete = () => {
    Modal.confirm({
      title: '確定完成盤點？',
      content: '完成後將自動調整庫存，此操作無法撤銷',
      okText: '確定',
      cancelText: '取消',
      onOk: async () => {
        try {
          setLoading(true);
          await stocktakingApi.complete(Number(id));
          message.success('盤點完成，庫存已調整');
          loadStocktaking();
        } catch (error) {
          message.error('完成盤點失敗');
        } finally {
          setLoading(false);
        }
      },
    });
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
      title: '系統數量',
      dataIndex: 'system_quantity',
      key: 'system_quantity',
    },
    {
      title: '實際數量',
      dataIndex: 'actual_quantity',
      key: 'actual_quantity',
      render: (value: number, record: StocktakingDetail) => {
        if (stocktaking?.status === 'COMPLETED') {
          return value;
        }
        if (editingKey === record.id) {
          return (
            <InputNumber
              min={0}
              defaultValue={value}
              id={`qty-${record.id}`}
              autoFocus
            />
          );
        }
        return value;
      },
    },
    {
      title: '差異',
      dataIndex: 'difference',
      key: 'difference',
      render: (diff: number) => {
        if (diff === 0) return <Tag color="green">{diff}</Tag>;
        if (diff > 0) return <Tag color="blue">+{diff}</Tag>;
        return <Tag color="red">{diff}</Tag>;
      },
    },
    {
      title: '備註',
      dataIndex: 'notes',
      key: 'notes',
      render: (value: string, record: StocktakingDetail) => {
        if (stocktaking?.status === 'COMPLETED') {
          return value;
        }
        if (editingKey === record.id) {
          return (
            <Input
              defaultValue={value}
              id={`note-${record.id}`}
              placeholder="備註"
            />
          );
        }
        return value;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (record: StocktakingDetail) => {
        if (stocktaking?.status === 'COMPLETED') {
          return null;
        }

        if (editingKey === record.id) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                onClick={() => {
                  const qtyInput = document.getElementById(`qty-${record.id}`) as HTMLInputElement;
                  const noteInput = document.getElementById(`note-${record.id}`) as HTMLInputElement;
                  const qty = Number(qtyInput?.value || record.actual_quantity);
                  const note = noteInput?.value || record.notes;
                  handleUpdate(record.id!, qty, note);
                }}
              >
                儲存
              </Button>
              <Button size="small" onClick={() => setEditingKey(null)}>
                取消
              </Button>
            </Space>
          );
        }

        return (
          <Button
            type="link"
            size="small"
            onClick={() => setEditingKey(record.id!)}
          >
            編輯
          </Button>
        );
      },
    },
  ];

  const stats = {
    total: details.length,
    checked: details.filter((d) => d.actual_quantity > 0).length,
    hasDiff: details.filter((d) => d.difference !== 0).length,
  };

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/stocktaking')}
        className="mb-4"
      >
        返回列表
      </Button>

      <Card title={`盤點單 #${id}`} className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Statistic title="盤點日期" value={stocktaking?.stocktaking_date} />
          <Statistic
            title="狀態"
            value={stocktaking?.status === 'COMPLETED' ? '已完成' : '進行中'}
            valueStyle={{ color: stocktaking?.status === 'COMPLETED' ? '#52c41a' : '#1890ff' }}
          />
          <Statistic title="總商品數" value={stats.total} />
          <Statistic
            title="已盤點"
            value={stats.checked}
            suffix={`/ ${stats.total}`}
          />
        </div>

        {stocktaking?.status === 'IN_PROGRESS' && (
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleComplete}
            className="mt-4"
            size="large"
          >
            完成盤點
          </Button>
        )}
      </Card>

      <Card title="盤點明細">
        {stats.hasDiff > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <Space>
              <WarningOutlined style={{ color: '#faad14' }} />
              <span>發現 {stats.hasDiff} 項商品有差異</span>
            </Space>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={details}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
          rowClassName={(record) =>
            record.difference !== 0 ? 'bg-yellow-50' : ''
          }
        />
      </Card>
    </div>
  );
};

export default StocktakingDetail;
