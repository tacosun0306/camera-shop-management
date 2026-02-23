import api from './axios';

export interface Inventory {
  id?: number;
  product_id: number;
  quantity: number;
  location?: string;
  updated_at?: string;
  // 關聯商品資訊
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
  min_stock_level?: number;
  selling_price?: number;
}

export const inventoryApi = {
  // 取得所有庫存
  getAll: (params?: { branch_id?: number; role?: string }) => {
    return api.get('/inventory', { params });
  },

  // 取得低庫存商品
  getLowStock: () => {
    return api.get('/inventory/low-stock');
  },

  // 根據商品ID取得庫存
  getByProductId: (productId: number) => {
    return api.get(`/inventory/product/${productId}`);
  },

  // 更新庫存
  update: (productId: number, data: { quantity: number; location?: string }) => {
    return api.put(`/inventory/product/${productId}`, data);
  },
};
