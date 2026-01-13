/**
 * 特质类型和特质值常量定义
 * 根据干部全量模型需求规划文档中的特质类型映射表定义
 */

export interface TraitValueConfig {
  value: string;
  description: string;
  display: string;
}

export interface TraitTypeConfig {
  code: string;
  name: string;
  description: string;
  values: Record<string, string>;
}

// 特质类型和特质值映射表（包含描述）
export const TRAITS_CONFIG: Record<string, TraitTypeConfig> = {
  personality: {
    code: 'personality',
    name: '性格特质',
    description: '核心反映干部内在心理倾向，影响工作态度与行为表现',
    values: {
      '沉稳型': '情绪稳定、处事冷静，适配复杂攻坚场景',
      '积极型': '心态开放、主动作为，适配团队激励场景',
      '坚韧型': '意志坚定、抗压强韧，适配长期攻坚场景',
      '细致型': '注重细节、追求完美，适配精细化管理场景',
      '开拓型': '敢于尝试、思维活跃，适配创新突破场景',
    },
  },
  management: {
    code: 'management',
    name: '管理风格',
    description: '核心反映干部带领团队、推进工作的方式',
    values: {
      '指令型': '目标明确、指令清晰，强调执行力，适配紧急任务推进',
      '赋能型': '充分授权、激发潜力，强调团队成长，适配创新团队管理',
      '协作型': '民主协商、群策群力，强调共识达成，适配跨部门协同',
      '结果导向型': '目标导向、紧盯结果，强调交付质量，适配项目交付管理',
      '教练型': '因材施教、指导细致，强调能力传递，适配新团队培养场景',
    },
  },
  communication: {
    code: 'communication',
    name: '沟通风格',
    description: '核心反映干部信息传递与互动的方式',
    values: {
      '直接型': '表达简洁、直击重点，沟通效率高，适配内部快速协同',
      '委婉型': '表达含蓄、注重方式，沟通体验好，适配对外商务洽谈',
      '综合型': '面面俱到、逻辑严密，沟通完整性强，适配复杂方案汇报',
      '数据型': '以数据为支撑、理性客观，沟通说服力强，适配数据分析论证',
      '故事型': '善于举例、生动易懂，沟通感染力强，适配团队动员与文化传递',
    },
  },
  decision: {
    code: 'decision',
    name: '决策偏向',
    description: '核心反映干部制定决策时的思维倾向',
    values: {
      '稳健型': '充分调研、权衡利弊，降低决策风险，适配重大战略决策',
      '果断型': '快速判断、及时落地，把握市场机遇，适配紧急场景决策',
      '谨慎型': '多方论证、规避风险，适配高风险项目决策',
      '创新型': '突破常规、尝试新方案，适配业务创新场景决策',
      '务实型': '立足实际、优先落地，适配基础业务优化决策',
    },
  },
};

// 获取所有特质类型列表（value 为中文名称，用于存储到数据库）
export const TRAIT_TYPE_LIST = Object.keys(TRAITS_CONFIG).map(code => ({
  label: TRAITS_CONFIG[code].name,
  value: TRAITS_CONFIG[code].name,
}));

// 获取特质类型英文代码到中文名称的映射
export const TRAIT_TYPE_CODE_TO_NAME: Record<string, string> = Object.keys(TRAITS_CONFIG).reduce((acc, code) => {
  acc[code] = TRAITS_CONFIG[code].name;
  return acc;
}, {} as Record<string, string>);

// 获取特质类型中文名称到英文代码的映射
export const TRAIT_TYPE_NAME_TO_CODE: Record<string, string> = Object.keys(TRAITS_CONFIG).reduce((acc, code) => {
  acc[TRAITS_CONFIG[code].name] = code;
  return acc;
}, {} as Record<string, string>);

// 根据特质类型获取特质值列表（包含描述）
export const getTraitValues = (traitType: string): TraitValueConfig[] => {
  // 如果 traitType 是中文名称，转换为英文代码
  const code = TRAIT_TYPE_NAME_TO_CODE[traitType] || traitType;
  const config = TRAITS_CONFIG[code];
  if (!config) return [];

  return Object.entries(config.values).map(([value, description]) => ({
    value,
    description,
    display: `${value}(${description})`,
  }));
};

// 获取特质值的显示文本
export const getTraitValueDisplay = (traitType: string, traitValue: string): string => {
  const values = getTraitValues(traitType);
  const found = values.find(v => v.value === traitValue);
  return found ? found.display : traitValue;
};
