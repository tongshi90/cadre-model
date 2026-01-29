import apiClient from '@/utils/request';
import type { ApiResponse, PaginatedResponse, PositionInfo } from '@/types';

// 岗位API
export const positionApi = {
  // 获取岗位列表
  getList: (params: {
    page?: number;
    page_size?: number;
    position_level?: string;
    department?: string;
    status?: number;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<PositionInfo>>>(
      '/positions',
      { params }
    ),

  // 获取所有启用的岗位
  getAll: () =>
    apiClient.get<ApiResponse<PositionInfo[]>>('/positions/all'),

  // 获取岗位详情
  getDetail: (id: number) =>
    apiClient.get<ApiResponse<PositionInfo>>(`/positions/${id}`),

  // 创建岗位
  create: (data: Partial<PositionInfo>) =>
    apiClient.post<ApiResponse<PositionInfo>>('/positions', data),

  // 更新岗位
  update: (id: number, data: Partial<PositionInfo>) =>
    apiClient.put<ApiResponse<PositionInfo>>(`/positions/${id}`, data),

  // 删除岗位
  delete: (id: number) =>
    apiClient.delete<ApiResponse>(`/positions/${id}`),

  // 获取岗位能力权重
  getWeights: (id: number) =>
    apiClient.get<ApiResponse<any[]>>(`/positions/${id}/weights`),

  // 更新岗位能力权重
  updateWeights: (id: number, weights: any[]) =>
    apiClient.put<ApiResponse>(`/positions/${id}/weights`, { weights }),

  // 获取岗位要求
  getRequirements: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/positions/${id}/requirements`),

  // 更新岗位要求
  updateRequirements: (id: number, requirements: any) =>
    apiClient.put<ApiResponse>(`/positions/${id}/requirements`, requirements),

  // 获取专业列表（用于岗位要求配置）
  getMajors: () =>
    apiClient.get<ApiResponse<any[]>>('/metadata/majors'),

  // 获取证书列表（用于岗位要求配置）
  getCertificates: () =>
    apiClient.get<ApiResponse<any[]>>('/metadata/certificates'),

  // 获取指标类型配置
  getIndicatorTypes: () =>
    apiClient.get<ApiResponse<any>>('/metadata/indicator-types'),

  // 获取学历选项
  getEducationOptions: () =>
    apiClient.get<ApiResponse<any[]>>('/metadata/education-options'),

  // 获取操作符选项
  getOperatorOptions: () =>
    apiClient.get<ApiResponse<any[]>>('/metadata/operator-options'),
};
