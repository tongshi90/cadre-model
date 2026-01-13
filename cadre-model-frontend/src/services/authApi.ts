import apiClient from '@/utils/request';
import type { ApiResponse, LoginRequest, LoginResponse, User } from '@/types';

// 认证API
export const authApi = {
  // 登录
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data),

  // 获取当前用户信息
  getCurrentUser: () =>
    apiClient.get<ApiResponse<User>>('/auth/user'),

  // 修改密码
  changePassword: (data: { old_password: string; new_password: string }) =>
    apiClient.post<ApiResponse>('/auth/change-password', data),
};
