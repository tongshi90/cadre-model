// 通用响应类型
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

// 分页响应类型
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

// 部门类型
export interface Department {
  id: number;
  name: string;
  parent_id?: number | null;
  sort_order: number;
  status: number;
  description?: string;
  children?: Department[];
}

// 干部相关类型
export interface CadreBasicInfo {
  id: number;
  employee_no: string;
  name: string;
  phone?: string;
  department_id?: number;
  department?: Department;
  position_id?: number;
  position?: PositionInfo;
  job_grade?: number;
  management_level?: string;
  management_attribution?: string;
  gender?: string;
  birth_date?: string;
  graduated_school?: string;
  education?: string;
  political_status?: string;
  entry_date?: string;
  work_province?: string;
  student_soldier_class?: number;
  is_dispatched?: boolean;
  status: number;
  create_time?: string;
  update_time?: string;
}

export interface CadreTrait {
  id?: number;
  cadre_id: number;
  trait_type: string;
  trait_value: string;
  trait_desc?: string;
}

export interface CadreAbilityScore {
  id?: number;
  cadre_id: number;
  ability_layer: string;
  ability_dimension: string;
  ability_tag: string;
  score: number;
  assessor?: string;
  assessment_date?: string;
  comment?: string;
}

// 干部动态信息类型
export type DynamicInfoType = 1 | 2 | 3 | 4 | 5 | 6;

export interface CadreDynamicInfo {
  id?: number;
  cadre_id: number;
  info_type: DynamicInfoType;
  // 工作经历字段
  work_start_date?: string;
  work_end_date?: string;
  work_company?: string;
  work_position?: string;
  // 培训记录字段
  training_name?: string;
  training_date?: string;
  training_content?: string;
  training_result?: string;
  // 项目经历字段
  project_no?: string;
  project_name?: string;
  project_role?: string;
  project_start_date?: string;
  project_end_date?: string;
  project_result?: string;
  project_rating?: string;
  is_core_project?: boolean;
  // 绩效数据字段
  assessment_cycle?: string;
  assessment_year?: string;
  assessment_half_year?: string;
  assessment_quarter?: string;
  assessment_month?: string;
  assessment_dimension?: string;
  assessment_grade?: string;
  assessment_comment?: string;
  // 奖惩记录字段
  reward_type?: string;
  reward_reason?: string;
  reward_date?: string;
  // 职务变更字段
  position_name?: string;
  responsibility?: string;
  appointment_type?: string;
  term_start_date?: string;
  term_end_date?: string;
  approval_record?: string;
  // 通用字段
  remark?: string;
  create_time?: string;
}

// 岗位相关类型
export interface PositionInfo {
  id: number;
  position_code: string;
  position_name: string;
  responsibility?: string;
  status: number;
  is_key_position?: number;
  ability_weights?: PositionAbilityWeight[];
  create_time?: string;
  update_time?: string;
  create_by?: string;
  update_by?: string;
  remark?: string;
}

export interface PositionAbilityWeight {
  id?: number;
  position_id: number;
  ability_dimension: string;
  weight: number;
}

// 匹配相关类型
export interface MatchResult {
  id: number;
  position_id: number;
  cadre_id: number;
  base_score?: number;
  deduction_score?: number;
  final_score?: number;
  match_level?: string;
  is_meet_mandatory?: number;
  match_detail?: string;
  best_match_position_id?: number;
  best_match_score?: number;
  create_time?: string;
  cadre?: CadreBasicInfo;
  position?: PositionInfo;
  best_match_position?: PositionInfo;
}

export interface MatchLevelDistribution {
  count: number;
  percentage: number;
}

export interface MatchStatisticsData {
  total_count: number;
  avg_score: number;
  level_distribution: {
    excellent: MatchLevelDistribution;
    qualified: MatchLevelDistribution;
    unqualified: MatchLevelDistribution;
  };
}

export interface MatchStatistics {
  overall: MatchStatisticsData;
  key_position: MatchStatisticsData;
}

// 年龄段统计数据
export interface AgeGroup {
  label: string;
  count: number;
  percentage: number;
  color?: string;
  personnel?: PyramidPersonnel[];
}

// 干部梯队人员信息
export interface PyramidPersonnel {
  id: number;
  employee_no: string;
  name: string;
  gender?: string;
  age: number;
  birth_date?: string;
  department?: {
    id: number;
    name: string;
  };
  position?: {
    id: number;
    code: string;
    name: string;
  };
  job_grade?: number;
  education?: string;
  political_status?: string;
  entry_date?: string;
  management_attribution?: string;
}

// 管理层级年龄分布
export interface LevelAgeDistribution {
  [key: string]: AgeGroup;
}

// 管理层级数据
export interface ManagementLevelData {
  label: string;
  total: number;
  age_distribution: LevelAgeDistribution;
}

// 梯队金字塔统计数据
export interface PyramidStatistics {
  levels: string[];
  data: {
    [key: string]: ManagementLevelData;
  };
  total_count: number;
}

export interface AgeStructureStatistics {
  le_35: AgeGroup;
  '36_45': AgeGroup;
  '46_55': AgeGroup;
  ge_56: AgeGroup;
}

// 用户相关类型
export interface User {
  id: number;
  username: string;
  real_name?: string;
  email?: string;
  phone?: string;
  department?: string;
  status: number;
  is_admin: number;
  user_type?: 'admin' | 'cadre';
  cadre_id?: number;
  last_login_time?: string;
  last_login_ip?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// 干部来源与流动情况统计
export interface SourceDistribution {
  internal: {
    count: number;
    percentage: number;
    label: string;
  };
  external: {
    count: number;
    percentage: number;
    label: string;
  };
}

export interface SourceByLevel {
  level: string;
  total: number;
  internal: number;
  external: number;
  internal_percentage: number;
  external_percentage: number;
}

export interface FlowTrend {
  year: string;
  total: number;
  internal: number;
  external: number;
}

export interface SourceAndFlowStatistics {
  total_count: number;
  source_distribution: SourceDistribution;
  source_by_level: SourceByLevel[];
  flow_trend: FlowTrend[];
}
