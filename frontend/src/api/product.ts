import api from './axios';

export interface Product {
  id?: number;
  barcode: string;
  name: string;
  brand?: string;
  category?: string;
  model?: string;
  description?: string;
  cost_price?: number;
  selling_price?: number;
  min_stock_level?: number;
  created_at?: string;
  updated_at?: string;
}

export const productApi = {
  // 取得所有商品
  getAll: (params?: { search?: string; category?: string; branch_id?: number; role?: string }) => {
    return api.get('/products', { params });
  },

  // 根據ID取得商品
  getById: (id: number) => {
    return api.get(`/products/${id}`);
  },

  // 根據條碼取得商品
  getByBarcode: (barcode: string) => {
    return api.get(`/products/barcode/${barcode}`);
  },

  // 新增商品
  create: (data: Product) => {
    return api.post('/products', data);
  },

  // 更新商品
  update: (id: number, data: Product) => {
    return api.put(`/products/${id}`, data);
  },

  // 刪除商品
  delete: (id: number) => {
    return api.delete(`/products/${id}`);
  },
};
