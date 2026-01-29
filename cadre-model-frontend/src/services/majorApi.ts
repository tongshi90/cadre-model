import apiClient from '@/utils/request';

export const majorApi = {
  // 获取专业树
  getTree: () => {
    return apiClient.get('/major/tree');
  },

  // 获取专业列表
  getList: (params?: any) => {
    return apiClient.get('/major', { params });
  },

  // 获取单个专业详情
  getById: (id: number) => {
    return apiClient.get(`/major/${id}`);
  },

  // 创建专业
  create: (data: any) => {
    return apiClient.post('/major', data);
  },

  // 更新专业
  update: (id: number, data: any) => {
    return apiClient.put(`/major/${id}`, data);
  },

  // 删除专业
  delete: (id: number) => {
    return apiClient.delete(`/major/${id}`);
  },
};
