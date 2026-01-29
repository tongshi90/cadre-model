import { EDUCATION_OPTIONS } from './constants';

// 指标类型配置
export const INDICATOR_TYPES = {
  mandatory: [  // 硬性要求可选指标
    { value: 'education', label: '学历' },
    { value: 'major', label: '专业' },
    { value: 'certificate', label: '证书' },
    { value: 'experience', label: '岗位经验年限' },
  ],
  bonus: [  // 加分项可选指标
    { value: 'education', label: '学历' },
    { value: 'major', label: '专业' },
    { value: 'certificate', label: '证书' },
    { value: 'experience', label: '岗位经验年限' },
    { value: 'performance_avg', label: '最近三年绩效平均分' },
    { value: 'kpi_completion', label: 'KPI达成率' },
    { value: 'avg_tenure', label: '岗位平均任职年限' },
    { value: 'job_hopping_freq', label: '跳槽频率' },
    { value: 'project_count', label: '项目经验数' },
  ]
};

// 要求分类
export const REQUIREMENT_TYPES = [
  { value: 'mandatory', label: '硬性要求' },
  { value: 'bonus', label: '加分项' },
];

// 学历选项（从 constants.ts 导入，确保两处使用同一规则）
export { EDUCATION_OPTIONS };

// 操作符选项
export const OPERATOR_OPTIONS = [
  { value: '>=', label: '大于等于' },
  { value: '<', label: '小于' },
];

// 指标类型标签映射
export const INDICATOR_TYPE_LABELS: Record<string, string> = {
  education: '学历',
  major: '专业',
  certificate: '证书',
  experience: '岗位经验年限',
  performance_avg: '最近三年绩效平均分',
  kpi_completion: 'KPI达成率',
  avg_tenure: '岗位平均任职年限',
  job_hopping_freq: '跳槽频率',
  project_count: '项目经验数',
};

// 要求分类标签映射
export const REQUIREMENT_TYPE_LABELS: Record<string, string> = {
  mandatory: '硬性要求',
  bonus: '加分项',
};
