import apiClient from '@/utils/request';

export const certificateApi = {
  // 获取证书树
  getTree: () => {
    return apiClient.get('/certificate/tree');
  },

  // 获取证书列表
  getList: (params?: any) => {
    return apiClient.get('/certificate', { params });
  },

  // 获取单个证书详情
  getById: (id: number) => {
    return apiClient.get(`/certificate/${id}`);
  },

  // 创建证书
  create: (data: any) => {
    return apiClient.post('/certificate', data);
  },

  // 更新证书
  update: (id: number, data: any) => {
    return apiClient.put(`/certificate/${id}`, data);
  },

  // 删除证书
  delete: (id: number) => {
    return apiClient.delete(`/certificate/${id}`);
  },
};
