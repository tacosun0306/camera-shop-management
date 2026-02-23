import api from './axios';

export interface Repair {
  id?: number;
  repair_no: string;
  customer_name: string;
  customer_phone: string;
  item_name: string;
  item_brand?: string;
  item_model?: string;
  problem_description?: string;
  estimated_cost?: number;
  actual_cost?: number;
  status: 'RECEIVED' | 'IN_REPAIR' | 'WAITING_PARTS' | 'COMPLETED' | 'DELIVERED' | 'CANCELLED';
  received_date: string;
  estimated_completion_date?: string;
  completed_date?: string;
  delivered_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const repairApi = {
  // 取得所有維修品
  getAll: (params?: { status?: string; startDate?: string; endDate?: string }) => {
    return api.get('/repairs', { params });
  },

  // 根據ID取得維修品
  getById: (id: number) => {
    return api.get(`/repairs/${id}`);
  },

  // 根據維修單號取得維修品
  getByRepairNo: (repairNo: string) => {
    return api.get(`/repairs/repair-no/${repairNo}`);
  },

  // 新增維修品
  create: (data: Repair) => {
    return api.post('/repairs', data);
  },

  // 更新維修品
  update: (id: number, data: Repair) => {
    return api.put(`/repairs/${id}`, data);
  },

  // 刪除維修品
  delete: (id: number) => {
    return api.delete(`/repairs/${id}`);
  },
};
