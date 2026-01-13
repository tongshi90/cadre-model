/**
 * 干部动态信息类型常量
 */

// 动态信息类型选项
export const DYNAMIC_INFO_TYPE_OPTIONS = [
  { label: '培训记录', value: 1, icon: 'BookOutlined' },
  { label: '项目经历', value: 2, icon: 'ProjectOutlined' },
  { label: '绩效数据', value: 3, icon: 'BarChartOutlined' },
  { label: '奖惩记录', value: 4, icon: 'TrophyOutlined' },
  { label: '岗位变更', value: 5, icon: 'UserSwitchOutlined' },
  { label: '工作经历', value: 6, icon: 'ProfileOutlined' },
];

// 奖惩类型选项
export const REWARD_TYPE_OPTIONS = [
  { label: '奖励', value: '奖励' },
  { label: '处分', value: '处分' },
];

// 奖惩等级选项
export const REWARD_LEVEL_OPTIONS = [
  { label: '特等', value: '特等' },
  { label: '一等', value: '一等' },
  { label: '二等', value: '二等' },
  { label: '三等', value: '三等' },
  { label: '通报表扬', value: '通报表扬' },
  { label: '通报批评', value: '通报批评' },
  { label: '警告', value: '警告' },
  { label: '记过', value: '记过' },
];

// 项目评级选项
export const PROJECT_RATING_OPTIONS = [
  { label: '优秀', value: '优秀' },
  { label: '良好', value: '良好' },
  { label: '合格', value: '合格' },
  { label: '需改进', value: '需改进' },
];

// 任命类型选项
export const APPOINTMENT_TYPE_OPTIONS = [
  { label: '任命', value: '任命' },
  { label: '免职', value: '免职' },
  { label: '调任', value: '调任' },
  { label: '兼任', value: '兼任' },
  { label: '代理', value: '代理' },
];

// 考核周期选项
export const ASSESSMENT_CYCLE_OPTIONS = [
  { label: '年度', value: '年度' },
  { label: '半年度', value: '半年度' },
  { label: '季度', value: '季度' },
];

// 考核等级选项
export const ASSESSMENT_GRADE_OPTIONS = [
  { label: 'S', value: 'S' },
  { label: 'A', value: 'A' },
  { label: 'B+', value: 'B+' },
  { label: 'B', value: 'B' },
  { label: 'B-', value: 'B-' },
  { label: 'C', value: 'C' },
];

// 年份选项（当前年份及过去19年，倒序排列，共20年）
export const getCurrentYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // 从当前年份开始，往前20年（倒序）
  for (let i = 0; i < 20; i++) {
    const year = currentYear - i;
    years.push({ label: `${year}年`, value: year });
  }
  return years;
};

// 半年度选项
export const HALF_YEAR_OPTIONS = [
  { label: '上半年', value: '上半年' },
  { label: '下半年', value: '下半年' },
];

// 季度选项
export const QUARTER_OPTIONS = [
  { label: '第一季度', value: '第一季度' },
  { label: '第二季度', value: '第二季度' },
  { label: '第三季度', value: '第三季度' },
  { label: '第四季度', value: '第四季度' },
];

// 月份选项
export const MONTH_OPTIONS = [
  { label: '1月', value: '1月' },
  { label: '2月', value: '2月' },
  { label: '3月', value: '3月' },
  { label: '4月', value: '4月' },
  { label: '5月', value: '5月' },
  { label: '6月', value: '6月' },
  { label: '7月', value: '7月' },
  { label: '8月', value: '8月' },
  { label: '9月', value: '9月' },
  { label: '10月', value: '10月' },
  { label: '11月', value: '11月' },
  { label: '12月', value: '12月' },
];

// 获取类型的标签
export const getDynamicInfoTypeLabel = (type: number): string => {
  const option = DYNAMIC_INFO_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.label || '未知类型';
};

// 获取类型的图标
export const getDynamicInfoTypeIcon = (type: number): string => {
  const option = DYNAMIC_INFO_TYPE_OPTIONS.find(opt => opt.value === type);
  return option?.icon || 'FileTextOutlined';
};
