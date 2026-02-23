import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Dropdown, Button, Space, Tag } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  InboxOutlined,
  SwapOutlined,
  FileTextOutlined,
  ToolOutlined,
  BarChartOutlined,
  ShopOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Header, Content, Sider } = Layout;

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '儀表板',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: '商品管理',
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: '庫存管理',
    },
    {
      key: '/stock-movement',
      icon: <SwapOutlined />,
      label: '出入庫管理',
    },
    {
      key: '/stocktaking',
      icon: <FileTextOutlined />,
      label: '盤點管理',
    },
    {
      key: '/repairs',
      icon: <ToolOutlined />,
      label: '維修品管理',
    },
    // 僅管理員可見
    ...(user?.role === 'admin' ? [
      {
        key: '/branches',
        icon: <ShopOutlined />,
        label: '分店管理',
      },
      {
        key: '/users',
        icon: <UserOutlined />,
        label: '用戶管理',
      },
      {
        key: '/reports',
        icon: <BarChartOutlined />,
        label: '報表分析',
      },
    ] : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '登出',
        onClick: handleLogout,
      },
    ],
  };

  // 取得當前選中的選單項
  const getSelectedKey = () => {
    const path = location.pathname;
    const item = menuItems.find((item) => path.startsWith(item.key));
    return item ? item.key : '/dashboard';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="flex items-center justify-between px-6 bg-white shadow-sm">
        <div className="flex items-center">
          <h1 className="text-xl font-bold m-0">📷 相機店管理系統</h1>
        </div>
        <Space>
          <Tag color="blue" icon={<ShopOutlined />}>
            {user?.branch_name}
          </Tag>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Button icon={<UserOutlined />}>
              {user?.name}
            </Button>
          </Dropdown>
        </Space>
      </Header>
      <Layout>
        <Sider width={200} theme="light" className="shadow-sm">
          <Menu
            mode="inline"
            selectedKeys={[getSelectedKey()]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>
        <Layout className="p-6">
          <Content
            className="bg-white p-6 rounded-lg shadow-sm"
            style={{ minHeight: 280 }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
