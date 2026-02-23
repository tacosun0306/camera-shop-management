import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, DatePicker, message } from 'antd';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { reportApi } from '../../api/report';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [inventorySummary, setInventorySummary] = useState<any>({});
  const [stockMovementStats, setStockMovementStats] = useState<any[]>([]);
  const [repairStats, setRepairStats] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<any>([dayjs().subtract(30, 'days'), dayjs()]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async (dates?: any) => {
    try {
      setLoading(true);
      const params = dates
        ? { startDate: dates[0].format('YYYY-MM-DD'), endDate: dates[1].format('YYYY-MM-DD') }
        : undefined;

      const [inventory, movements, repairs, products, categories]: any = await Promise.all([
        reportApi.getInventorySummary(),
        reportApi.getStockMovementStats(params),
        reportApi.getRepairStats(params),
        reportApi.getTopProducts(10),
        reportApi.getCategoryStats(),
      ]);

      setInventorySummary(inventory);
      setStockMovementStats(movements);
      setRepairStats(repairs);
      setTopProducts(products);
      setCategoryStats(categories);
    } catch (error) {
      message.error('載入報表資料失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates: any) => {
    setDateRange(dates);
    if (dates) {
      loadReports(dates);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const movementTypeMap: any = {
    IN: '入庫',
    OUT: '出庫',
    ADJUST: '調整',
  };

  const repairStatusMap: any = {
    RECEIVED: '已收件',
    IN_REPAIR: '維修中',
    WAITING_PARTS: '待料中',
    COMPLETED: '已完成',
    DELIVERED: '已取件',
    CANCELLED: '已取消',
  };

  const topProductColumns = [
    { title: '商品名稱', dataIndex: 'name', key: 'name' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '銷售次數', dataIndex: 'sales_count', key: 'sales_count' },
    { title: '銷售總量', dataIndex: 'total_sold', key: 'total_sold' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">報表分析</h1>
        <RangePicker
          value={dateRange}
          onChange={handleDateChange}
          format="YYYY-MM-DD"
        />
      </div>

      {/* 庫存總覽 */}
      <Card title="庫存總覽" loading={loading} className="mb-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title="總商品數" value={inventorySummary.total_products || 0} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title="總庫存量" value={inventorySummary.total_stock || 0} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="庫存成本價值"
              value={inventorySummary.total_cost_value || 0}
              prefix="$"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic
              title="庫存售價價值"
              value={inventorySummary.total_selling_value || 0}
              prefix="$"
            />
          </Col>
        </Row>
      </Card>

      {/* 出入庫統計 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="出入庫統計" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stockMovementStats.map((item) => ({
                ...item,
                name: movementTypeMap[item.movement_type],
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="次數" />
                <Bar dataKey="total_quantity" fill="#82ca9d" name="總數量" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="分類庫存價值" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.category}: $${entry.total_value?.toLocaleString()}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total_value"
                >
                  {categoryStats.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* 維修品統計 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="維修品狀態統計" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={repairStats.map((item) => ({
                ...item,
                name: repairStatusMap[item.status],
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="數量" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="熱銷商品 TOP 10" loading={loading}>
            <Table
              columns={topProductColumns}
              dataSource={topProducts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
