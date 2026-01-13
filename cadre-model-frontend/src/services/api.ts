import apiClient from '@/utils/request';
import type { ApiResponse, PaginatedResponse, CadreBasicInfo } from '@/types';

// 干部API
export const cadreApi = {
  // 获取干部列表
  getList: (params: {
    page?: number;
    page_size?: number;
    name?: string;
    status?: number;
    department?: string;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<CadreBasicInfo>>>(
      '/cadres',
      { params }
    ),

  // 获取干部详情
  getDetail: (id: number) =>
    apiClient.get<ApiResponse<CadreBasicInfo>>(`/cadres/${id}`),

  // 创建干部
  create: (data: Partial<CadreBasicInfo>) =>
    apiClient.post<ApiResponse<CadreBasicInfo>>('/cadres', data),

  // 更新干部
  update: (id: number, data: Partial<CadreBasicInfo>) =>
    apiClient.put<ApiResponse<CadreBasicInfo>>(`/cadres/${id}`, data),

  // 删除干部
  delete: (id: number) =>
    apiClient.delete<ApiResponse>(`/cadres/${id}`),

  // 获取干部特质
  getTraits: (id: number) =>
    apiClient.get<ApiResponse<any[]>>(`/cadres/${id}/traits`),

  // 更新干部特质
  updateTraits: (id: number, traits: any[]) =>
    apiClient.put<ApiResponse>(`/cadres/${id}/traits`, { traits }),

  // 获取干部能力评分
  getAbilities: (id: number) =>
    apiClient.get<ApiResponse<any[]>>(`/cadres/${id}/abilities`),

  // 更新干部能力评分
  updateAbilities: (id: number, abilities: any[]) =>
    apiClient.put<ApiResponse>(`/cadres/${id}/abilities`, { abilities }),
};

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

// 导出matchApi
export { matchApi } from './matchApi';
