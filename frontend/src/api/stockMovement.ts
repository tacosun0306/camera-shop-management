import api from './axios';

export interface StockMovement {
  id?: number;
  product_id: number;
  movement_type: 'IN' | 'OUT' | 'ADJUST';
  quantity: number;
  reference_no?: string;
  notes?: string;
  operator?: string;
  created_at?: string;
  // 關聯商品資訊
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
}

export const stockMovementApi = {
  // 取得所有出入庫記錄
  getAll: (params?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    productId?: number;
    category?: string;
  }) => {
    return api.get('/stock-movements', { params });
  },

  // 新增出入庫記錄
  create: (data: StockMovement) => {
    return api.post('/stock-movements', data);
  },

  // 根據商品取得出入庫記錄
  getByProductId: (productId: number) => {
    return api.get(`/stock-movements/product/${productId}`);
  },
};
