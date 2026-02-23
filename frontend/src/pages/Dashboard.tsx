import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, message } from 'antd';
import {
  ShoppingOutlined,
  InboxOutlined,
  WarningOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { inventoryApi } from '../api/inventory';
import { reportApi } from '../api/report';
import { repairApi } from '../api/repair';

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [pendingRepairs, setPendingRepairs] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [inventorySummary, lowStock, repairs]: any = await Promise.all([
        reportApi.getInventorySummary(),
        inventoryApi.getLowStock(),
        repairApi.getAll({ status: 'RECEIVED' }),
      ]);

      setStats(inventorySummary);
      setLowStockItems(lowStock);
      setPendingRepairs(repairs);
    } catch (error) {
      message.error('載入儀表板資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const lowStockColumns = [
    { title: '商品名稱', dataIndex: 'name', key: 'name' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '現有庫存', dataIndex: 'quantity', key: 'quantity' },
    { title: '最低庫存', dataIndex: 'min_stock_level', key: 'min_stock_level' },
  ];

  const repairColumns = [
    { title: '維修單號', dataIndex: 'repair_no', key: 'repair_no' },
    { title: '客戶', dataIndex: 'customer_name', key: 'customer_name' },
    { title: '物品', dataIndex: 'item_name', key: 'item_name' },
    { title: '收件日期', dataIndex: 'received_date', key: 'received_date' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">儀表板</h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="總商品數"
              value={stats.total_products || 0}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="總庫存量"
              value={stats.total_stock || 0}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="低庫存商品"
              value={stats.low_stock_count || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="待處理維修"
              value={pendingRepairs.length}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card title="低庫存商品" loading={loading}>
            <Table
              dataSource={lowStockItems}
              columns={lowStockColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="待處理維修品" loading={loading}>
            <Table
              dataSource={pendingRepairs}
              columns={repairColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
