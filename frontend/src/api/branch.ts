import api from './axios';

export const branchApi = {
  // 取得所有分店
  getAll: () => api.get('/branches'),

  // 取得單一分店
  getById: (id: number) => api.get(`/branches/${id}`),

  // 新增分店
  create: (data: any) => api.post('/branches', data),

  // 更新分店
  update: (id: number, data: any) => api.put(`/branches/${id}`, data),

  // 刪除分店
  delete: (id: number) => api.delete(`/branches/${id}`),

  // 取得分店庫存
  getInventory: (id: number) => api.get(`/branches/${id}/inventory`),
};
