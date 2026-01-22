/**
 * 字典常量定义
 * 用于干部信息中的各种下拉选项配置
 */

// 管理层级
export const MANAGEMENT_LEVEL: Record<string, string> = {
  '基层': '基层管理岗位，负责具体业务执行',
  '中层': '中层管理岗位，负责部门或团队管理',
  '经营层': '经营管理岗位，负责业务板块经营管理',
  '战略层': '战略管理岗位，负责企业战略规划与决策',
};

export const MANAGEMENT_LEVEL_LIST = Object.keys(MANAGEMENT_LEVEL).map(key => ({
  label: key,
  value: key,
  description: MANAGEMENT_LEVEL[key],
}));

// 管理归属
export const MANAGEMENT_ATTRIBUTION: Record<string, string> = {
  '集团直管人才': '由集团直接管理的人才',
  '体系直管人才': '由各体系直接管理的人才',
};

export const MANAGEMENT_ATTRIBUTION_LIST = Object.keys(MANAGEMENT_ATTRIBUTION).map(key => ({
  label: key,
  value: key,
  description: MANAGEMENT_ATTRIBUTION[key],
}));

// 学历
export const EDUCATION: Record<string, string> = {
  '大专': '大专学历',
  '本科': '本科学历',
  '硕士': '硕士学历',
  '博士': '博士学历',
};

export const EDUCATION_LIST = Object.keys(EDUCATION).map(key => ({
  label: key,
  value: key,
  description: EDUCATION[key],
}));

// 政治面貌
export const POLITICAL_STATUS: Record<string, string> = {
  '中共党员': '中国共产党党员',
  '中共预备党员': '中国共产党预备党员',
  '共青团员': '中国共产主义青年团团员',
  '民主党派': '各民主党派成员',
  '群众': '无党派人士',
  '其他': '其他政治面貌',
};

export const POLITICAL_STATUS_LIST = Object.keys(POLITICAL_STATUS).map(key => ({
  label: key,
  value: key,
  description: POLITICAL_STATUS[key],
}));

// 获取管理层级描述
export const getManagementLevelDesc = (level: string): string => {
  return MANAGEMENT_LEVEL[level] || '';
};

// 获取管理归属描述
export const getManagementAttributionDesc = (attribution: string): string => {
  return MANAGEMENT_ATTRIBUTION[attribution] || '';
};

// 获取学历描述
export const getEducationDesc = (education: string): string => {
  return EDUCATION[education] || '';
};

// 获取政治面貌描述
export const getPoliticalStatusDesc = (status: string): string => {
  return POLITICAL_STATUS[status] || '';
};
