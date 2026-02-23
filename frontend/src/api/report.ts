import api from './axios';

export const reportApi = {
  // 庫存總覽報表
  getInventorySummary: () => {
    return api.get('/reports/inventory-summary');
  },

  // 出入庫統計
  getStockMovementStats: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/reports/stock-movement-stats', { params });
  },

  // 維修品統計
  getRepairStats: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/reports/repair-stats', { params });
  },

  // 每日出入庫趨勢
  getDailyMovements: (params?: { startDate?: string; endDate?: string }) => {
    return api.get('/reports/daily-movements', { params });
  },

  // 熱銷商品
  getTopProducts: (limit?: number) => {
    return api.get('/reports/top-products', { params: { limit } });
  },

  // 分類統計
  getCategoryStats: () => {
    return api.get('/reports/category-stats');
  },
};
