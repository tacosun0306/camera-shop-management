import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { Spin } from 'antd';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/Product/ProductList';
import ProductForm from './pages/Product/ProductForm';
import InventoryList from './pages/Inventory/InventoryList';
import StockMovement from './pages/StockMovement/StockMovement';
import StocktakingList from './pages/Stocktaking/StocktakingList';
import StocktakingDetail from './pages/Stocktaking/StocktakingDetail';
import MobileStocktaking from './pages/Stocktaking/MobileStocktaking';
import RepairList from './pages/Repair/RepairList';
import RepairForm from './pages/Repair/RepairForm';
import Reports from './pages/Reports/Reports';
import BranchManagement from './pages/Branch/BranchManagement';
import UserManagement from './pages/User/UserManagement';

// 路由守衛組件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        <Route path="products">
          <Route index element={<ProductList />} />
          <Route path="new" element={<ProductForm />} />
          <Route path="edit/:id" element={<ProductForm />} />
        </Route>
        
        <Route path="inventory" element={<InventoryList />} />
        <Route path="stock-movement" element={<StockMovement />} />
        
        <Route path="stocktaking">
          <Route index element={<StocktakingList />} />
          <Route path=":id" element={<StocktakingDetail />} />
        </Route>
        
        <Route path="repairs">
          <Route index element={<RepairList />} />
          <Route path="new" element={<RepairForm />} />
          <Route path="edit/:id" element={<RepairForm />} />
        </Route>
        
        <Route path="branches" element={<BranchManagement />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      
      {/* 手機盤點頁面 - 獨立路由 */}
      <Route 
        path="/stocktaking/mobile/:id" 
        element={
          <ProtectedRoute>
            <MobileStocktaking />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

export default App;
