import api from './axios';

export interface Stocktaking {
  id?: number;
  stocktaking_date: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  created_by?: string;
  created_at?: string;
  completed_at?: string;
  details?: StocktakingDetail[];
}

export interface StocktakingDetail {
  id?: number;
  stocktaking_id: number;
  product_id: number;
  system_quantity: number;
  actual_quantity: number;
  difference: number;
  notes?: string;
  // 關聯商品資訊
  barcode?: string;
  name?: string;
  brand?: string;
  category?: string;
}

export const stocktakingApi = {
  // 取得所有盤點單
  getAll: (params?: { branch_id?: number; role?: string }) => {
    return api.get('/stocktaking', { params });
  },

  // 取得單一盤點單（包含明細）
  getById: (id: number) => {
    return api.get(`/stocktaking/${id}`);
  },

  // 建立新盤點單
  create: (data: { branch_id: number; stocktaking_date: string; notes?: string; created_by?: string; categories?: string[] }) => {
    return api.post('/stocktaking', data);
  },

  // 更新盤點明細
  updateDetail: (detailId: number, data: { actual_quantity: number; notes?: string }) => {
    return api.put(`/stocktaking/details/${detailId}`, data);
  },

  // 完成盤點
  complete: (id: number) => {
    return api.post(`/stocktaking/${id}/complete`);
  },

  // 刪除盤點單
  delete: (id: number) => {
    return api.delete(`/stocktaking/${id}`);
  },
};
