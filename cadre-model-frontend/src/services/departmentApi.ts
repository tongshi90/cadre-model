import apiClient from '@/utils/request';
import type { ApiResponse } from '@/types';

// 部门API
export const departmentApi = {
  // 获取部门树
  getTree: () =>
    apiClient.get<ApiResponse<any[]>>('/departments/tree'),

  // 获取部门列表
  getList: () =>
    apiClient.get<ApiResponse<any[]>>('/departments/list'),

  // 获取部门详情
  getDetail: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/departments/${id}`),

  // 创建部门
  create: (data: any) =>
    apiClient.post<ApiResponse<any>>('/departments', data),

  // 更新部门
  update: (id: number, data: any) =>
    apiClient.put<ApiResponse<any>>(`/departments/${id}`, data),

  // 删除部门
  delete: (id: number) =>
    apiClient.delete<ApiResponse>(`/departments/${id}`),
};
