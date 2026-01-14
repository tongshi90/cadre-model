import apiClient from '@/utils/request';
import type { ApiResponse, PaginatedResponse, MatchResult, MatchStatistics, PyramidStatistics, SourceAndFlowStatistics } from '@/types';

// 匹配API
export const matchApi = {
  // 计算单个干部与岗位的匹配度
  calculate: (cadreId: number, positionId: number, saveToDb?: boolean) =>
    apiClient.post<ApiResponse<MatchResult>>('/match/calculate', {
      cadre_id: cadreId,
      position_id: positionId,
      save_to_db: saveToDb,
    }),

  // 批量计算匹配度
  batchCalculate: (positionId: number) =>
    apiClient.post<ApiResponse<{ position_id: number; results: MatchResult[] }>>(
      '/match/batch-calculate',
      { position_id: positionId }
    ),

  // 批量计算干部当前岗位匹配度
  batchCalculateCurrent: () =>
    apiClient.post<ApiResponse<{ total: number; results: MatchResult[] }>>(
      '/match/batch-calculate-current',
      {},
      { timeout: 300000 }  // 设置超时时间为 5 分钟
    ),

  // 获取当前岗位匹配分析进度
  getCurrentPositionProgress: () =>
    apiClient.get<ApiResponse<{ current: number; total: number }>>(
      '/match/current-position-progress'
    ),

  // 批量计算多个干部与岗位的匹配度（自定义匹配）
  batchCalculateCadres: (positionId: number, cadreIds: number[]) =>
    apiClient.post<ApiResponse<{ position_id: number; results: MatchResult[] }>>(
      '/match/batch-calculate-cadres',
      {
        position_id: positionId,
        cadre_ids: cadreIds,
      }
    ),

  // 获取匹配结果列表
  getResults: (params: {
    page?: number;
    page_size?: number;
    position_id?: number;
    cadre_id?: number;
    match_level?: string;
  }) =>
    apiClient.get<ApiResponse<PaginatedResponse<MatchResult>>>(
      '/match/results',
      { params }
    ),

  // 获取干部当前岗位匹配结果（优化查询）
  getCurrentPositionResults: () =>
    apiClient.get<ApiResponse<MatchResult[]>>(
      '/match/results/current-position'
    ),

  // 获取匹配结果详情
  getResultDetail: (id: number) =>
    apiClient.get<ApiResponse<MatchResult>>(`/match/results/${id}`),

  // 生成分析报告
  generateReport: (id: number) =>
    apiClient.get<ApiResponse<any>>(`/match/results/${id}/report`),

  // 多岗位对比
  compare: (cadreId: number, positionIds: number[]) =>
    apiClient.post<ApiResponse<any>>('/match/compare', {
      cadre_id: cadreId,
      position_ids: positionIds,
    }),

  // 获取匹配度统计数据
  getStatistics: () =>
    apiClient.get<ApiResponse<MatchStatistics>>(
      '/match/statistics'
    ),

  // 获取年龄段统计数据
  getAgeStructure: () =>
    apiClient.get<ApiResponse<PyramidStatistics>>(
      '/match/age-structure'
    ),

  // 获取年龄段详情数据（包含人员信息）
  getAgeStructureDetails: () =>
    apiClient.get<ApiResponse<PyramidStatistics>>(
      '/match/age-structure-details'
    ),

  // 获取关键岗位风险数据
  getPositionRisk: () =>
    apiClient.get<ApiResponse<any[]>>(
      '/match/position-risk'
    ),

  // 获取干部质量画像数据
  getQualityPortrait: () =>
    apiClient.get<ApiResponse<any[]>>(
      '/match/quality-portrait'
    ),

  // 获取干部来源与流动情况统计数据
  getSourceAndFlow: () =>
    apiClient.get<ApiResponse<SourceAndFlowStatistics>>(
      '/match/source-and-flow'
    ),

  // 获取流动干部详情列表
  getFlowCadresDetails: (params?: { year?: number; source_type?: string }) =>
    apiClient.get<ApiResponse<{ total: number; cadres: any[] }>>(
      '/match/flow-cadres-details',
      { params }
    ),

  // 获取大屏所有数据（合并接口 - 优化性能）
  getDashboardAll: () =>
    apiClient.get<ApiResponse<{
      match_statistics: MatchStatistics;
      age_structure: PyramidStatistics;
      position_risk: any[];
      quality_portrait: any[];
      source_and_flow: SourceAndFlowStatistics;
    }>>('/match/dashboard-all'),
};
