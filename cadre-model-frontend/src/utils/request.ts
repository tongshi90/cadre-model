import axios, { AxiosError } from 'axios';
import { message } from 'antd';
import type { ApiResponse } from '@/types';

// 从运行时配置获取 API 地址，fallback 到环境变量或默认值
const getApiBaseUrl = () => {
  if (window.config?.API_BASE_URL) {
    return window.config.API_BASE_URL;
  }
  return import.meta.env.VITE_API_BASE_URL || '/api';
};

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    // 添加认证token
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

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 不再自动显示成功消息，由组件自己控制
    return response;
  },
  (error: AxiosError<ApiResponse>) => {
    // 处理HTTP错误
    if (error.response) {
      const { status, data, config } = error.response;

      switch (status) {
        case 401:
          // 登录接口的401错误不自动跳转，由登录页面自己处理
          if (config?.url?.includes('/auth/login')) {
            // 显示后端返回的错误消息
            message.error(data?.message || '用户名或密码错误');
            return Promise.reject(error);
          }
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          window.location.href = '/login';
          break;
        case 403:
          message.error(data?.message || '没有权限访问');
          break;
        case 404:
          // AI分析接口的404错误不显示消息，由组件自己处理
          if (config?.url?.includes('/ai-analysis/')) {
            return Promise.reject(error);
          }
          message.error(data?.message || '请求的资源不存在');
          break;
        case 500:
          message.error(data?.message || '服务器错误');
          break;
        default:
          message.error(data?.message || '请求失败');
      }
    } else if (error.request) {
      message.error('网络错误，请检查网络连接');
    } else {
      message.error('请求配置错误');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
