import axios from 'axios';

// 支持環境變數配置 API 網址（用於雲端部署）
const apiURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    // 自動添加 JWT Token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // Token 過期或無效
      if (error.response.status === 401 || error.response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // 伺服器回應錯誤
      console.error('API 錯誤:', error.response.data);
    } else if (error.request) {
      // 請求已發送但沒有收到回應
      console.error('網路錯誤:', error.request);
    } else {
      // 其他錯誤
      console.error('錯誤:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
