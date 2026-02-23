import api from './axios';

export const authApi = {
  // 登入
  login: (data: { username: string; password: string }) => 
    api.post('/auth/login', data),

  // 取得當前用戶資訊
  getMe: (userId: number) => 
    api.get(`/auth/me/${userId}`),

  // 取得所有用戶
  getUsers: () => 
    api.get('/auth/users'),

  // 新增用戶
  createUser: (data: any) => 
    api.post('/auth/users', data),

  // 更新用戶
  updateUser: (id: number, data: any) => 
    api.put(`/auth/users/${id}`, data),

  // 刪除用戶
  deleteUser: (id: number) => 
    api.delete(`/auth/users/${id}`),
};
