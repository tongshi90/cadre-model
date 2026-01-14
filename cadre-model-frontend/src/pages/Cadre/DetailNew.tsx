import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Modal, Form, Input, DatePicker, Select, InputNumber, Popconfirm, message, Tabs } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  BookOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  ProjectOutlined,
  BarChartOutlined,
  TrophyOutlined,
  UserSwitchOutlined,
  RobotOutlined,
  CalendarOutlined,
  ProfileOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { cadreApi, matchApi, aiAnalysisApi } from '@/services/api';
import { positionApi } from '@/services/positionApi';
import type { CadreBasicInfo, CadreDynamicInfo } from '@/types';
import dayjs from 'dayjs';
import { ABILITY_DIMENSION_LIST, getTagsByDimension } from '@/utils/abilityConstants';
import { TRAIT_TYPE_LIST, getTraitValues } from '@/utils/traitConstants';
import {
  DYNAMIC_INFO_TYPE_OPTIONS,
  REWARD_TYPE_OPTIONS,
  PROJECT_RATING_OPTIONS,
  APPOINTMENT_TYPE_OPTIONS,
  ASSESSMENT_CYCLE_OPTIONS,
  ASSESSMENT_GRADE_OPTIONS,
  getCurrentYearOptions,
  HALF_YEAR_OPTIONS,
  QUARTER_OPTIONS,
  MONTH_OPTIONS,
} from '@/utils/dynamicInfoConstants';
import ReactECharts from 'echarts-for-react';
import './DetailNew.css';

const { TextArea } = Input;

// 计算年龄
const calculateAge = (birthDate: string | undefined): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 计算司龄
const calculateWorkYears = (entryDate: string | undefined): number | null => {
  if (!entryDate) return null;
  const entry = new Date(entryDate);
  const today = new Date();
  let years = today.getFullYear() - entry.getFullYear();
  const monthDiff = today.getMonth() - entry.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < entry.getDate())) {
    years--;
  }
  return years;
};

const CadreDetailNew = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CadreBasicInfo | null>(null);
  const [fromMatch, setFromMatch] = useState(false);
  const hasFetchedRef = useRef(false);
  const [mainTab, setMainTab] = useState('ability'); // 新的主tab: ability | ai | career
  const [matchResult, setMatchResult] = useState<any>(null); // 岗位匹配结果

  // 干部履历相关
  const [careerModalVisible, setCareerModalVisible] = useState(false);
  const [careerData, setCareerData] = useState<CadreDynamicInfo[]>([]);
  const [activeTab, setActiveTab] = useState('1');
  const [editingCareer, setEditingCareer] = useState<CadreDynamicInfo | null>(null);
  const [careerForm] = Form.useForm();

  // 岗位列表
  const [positionList, setPositionList] = useState<any[]>([]);

  // 能力评分相关
  const [abilityData, setAbilityData] = useState<any[]>([]);
  const [abilityForm] = Form.useForm();
  const [abilitySubmitting, setAbilitySubmitting] = useState(false);
  const [abilityModalVisible, setAbilityModalVisible] = useState(false);

  // 特质分析相关
  const [traitData, setTraitData] = useState<any[]>([]);
  const [traitForm] = Form.useForm();
  const [traitSubmitting, setTraitSubmitting] = useState(false);
  const [traitModalVisible, setTraitModalVisible] = useState(false);

  // AI分析相关
  const [aiResult, setAiResult] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  // 调用硅基流动API进行AI分析
  const handleAIAnalysis = async () => {
    if (!data) {
      message.warning('干部数据未加载完成，请稍后重试');
      return;
    }

    setAiLoading(true);

    // 构建干部完整数据JSON
    const cadreData = {
      // 基本信息
      basicInfo: {
        employee_no: data.employee_no,
        name: data.name,
        gender: data.gender,
        birth_date: data.birth_date,
        age: calculateAge(data.birth_date),
        graduated_school: data.graduated_school,
        education: data.education,
        political_status: data.political_status,
        entry_date: data.entry_date,
        work_years: calculateWorkYears(data.entry_date),
        work_province: data.work_province,
        student_soldier_class: data.student_soldier_class,
        is_dispatched: data.is_dispatched,
        status: data.status,
      },
      // 岗位信息
      position: data.position ? {
        id: data.position.id,
        position_code: data.position.position_code,
        position_name: data.position.position_name,
        job_grade: data.job_grade,
        management_level: data.management_level,
        management_attribution: data.management_attribution,
      } : null,
      // 部门信息
      department: data.department ? {
        id: data.department.id,
        name: data.department.name,
      } : null,
      // 岗位匹配情况
      matchResult: matchResult ? {
        score: matchResult.score,
        level: matchResult.level,
        base_score: matchResult.base_score,
        deducted_score: matchResult.deducted_score,
        hard_requirements_met: matchResult.hard_requirements_met,
        failed_requirements: matchResult.failed_requirements,
        suggested_requirements_met: matchResult.suggested_requirements_met,
        failed_suggestions: matchResult.failed_suggestions,
      } : null,
      // 能力评估
      abilityScores: abilityData.length > 0 ? abilityData.map(item => ({
        dimension: item.dimension,
        dimension_name: item.dimension,
        score: item.score,
        tags: item.tags ? item.tags.split(',').map((tag: string) => tag.trim()) : [],
      })) : null,
      // 特质分析
      traits: traitData.length > 0 ? traitData.map(item => ({
        trait_type: item.trait_type,
        trait_type_name: TRAIT_TYPE_LIST.find(t => t.value === item.trait_type)?.label || item.trait_type,
        trait_value: item.trait_value,
        trait_desc: item.trait_desc,
      })) : null,
      // 干部履历
      career: careerData.length > 0 ? careerData.map(item => ({
        info_type: item.info_type,
        info_type_name: DYNAMIC_INFO_TYPE_OPTIONS.find(t => t.value === item.info_type)?.label || String(item.info_type),
        remark: item.remark,
        // 各类型的特定字段
        ...(item.info_type === 1 && { training_name: item.training_name }),
        ...(item.info_type === 2 && { project_name: item.project_name }),
        ...(item.info_type === 3 && { assessment_cycle: item.assessment_cycle, assessment_grade: item.assessment_grade }),
        ...(item.info_type === 4 && { reward_type: item.reward_type }),
        ...(item.info_type === 5 && { position_name: item.position_name }),
        ...(item.info_type === 6 && { work_company: item.work_company, work_position: item.work_position }),
      })) : null,
    };

    // 构建AI提示词 - 面向干部个人的分析报告
    const prompt = `你是一位资深的职业发展导师和人才成长顾问。请基于以下干部的完整数据，生成一份面向干部个人发展的分析报告。

【干部数据JSON】
${JSON.stringify(cadreData, null, 2)}

【输出格式要求】
请严格按照以下格式输出，每个维度必须完整呈现，指标内容可根据实际数据调整：

📋 一、个人综合画像
- 基本特征：（姓名、性别、年龄、学历、司龄、政治面貌等）
- 性格特质：（基于特质分析，描述性格特点、管理风格、沟通风格）
- 职业标签：（3-5个关键词概括个人特点）

💪 二、能力深度解析
✓ 核心优势：（3-5项最强能力，结合具体数据说明）
⚠ 待提升项：（2-3项短板，分析对职业发展的影响）
🎯 能力均衡度：（各维度能力均衡性分析及建议）

📈 三、成长轨迹回顾
- 职业历程：（工作经历和岗位变更梳理）
- 能量积累：（培训、项目经历评估）
- 成绩单：（绩效考核、项目评级、获奖情况）
- 成长曲线：（判断处于上升期/平台期/转型期）

🎯 四、岗位适配洞察
- 当前适配度：（与现任岗位的匹配度及评价）
- 发挥空间：（当前岗位是否充分发挥个人优势）
- 潜在挑战：（能力与岗位要求的差距及应对）

🚀 五、个人发展路径
- 推荐方向：（2-3个适合个人特质的发展方向）
- 发展路径：（每个方向的具体成长路径）
- 关键能力：（每个方向需要重点培养的能力）

📌 六、自我提升行动指南
- 短期突破（6个月内）：
  ✓ 目标1：（具体行动建议）
  ✓ 目标2：（具体行动建议）
- 中期成长（1-2年）：
  ✓ 重点1：（能力提升计划）
  ✓ 重点2：（发展机会把握）
- 长期规划（3年+）：
  ✓ 职业定位：（长期发展方向）
  ✓ 持续学习：（需要持续投入的能力领域）

💡 七、个性化建议
- 学习建议：（基于个人特点的培训和学习方向）
- 实践建议：（如何在工作中锻炼和提升）
- 资源利用：（如何利用现有平台和机会）

【内容要求】
- 这是一份给干部个人看的报告，请站在个人发展角度给出建议
- 每个维度必须完整输出，不得省略
- 每个指标一行，以"-"、"✓"、"⚠"、"🎯"开头
- 内容精炼，每点控制在1句话内，建议要具体可执行
- 只输出分析结论，不要重复原始数据
- 不要添加任何分隔线、装饰性内容
- 直接给出确定性结论，不要说"信息不足"、"需要进一步分析"等
- 不要出现"如果..."、"假设..."等假设性表述
- 重点关注"我该怎么做"而非"组织该做什么"

请严格按照上述格式开始分析：`;

    try {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-pjdyzooethndmyauyzjbopafxxqogayzhjopheijtwgkgras',
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-7B-Instruct',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result = await response.json();
      const aiMessage = result.choices?.[0]?.message?.content || '无法获取AI响应';
      setAiResult(aiMessage);

      // 保存AI分析结果到数据库
      if (id) {
        try {
          await aiAnalysisApi.saveResult({
            cadre_id: Number(id),
            analysis_result: aiMessage,
            analysis_data: JSON.stringify(cadreData),
          });
          message.success('AI分析完成');
        } catch (saveError) {
          console.error('Failed to save AI analysis:', saveError);
          message.warning('AI分析完成，但保存失败');
        }
      }
    } catch (error) {
      console.error('Failed to call AI API:', error);
      setAiResult('AI分析请求失败，请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 获取AI分析历史结果
  const fetchAIAnalysisResult = async () => {
    if (!id) return;
    try {
      // 直接使用 fetch 避免 axios 拦截器显示错误
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/ai-analysis/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.code === 200 && result.data) {
          setAiResult(result.data.analysis_result);
        }
      }
      // 404 或其他错误时不做任何处理，不显示错误提示
    } catch (error) {
      // 静默处理错误
      console.log('No AI analysis history found');
    }
  };

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await cadreApi.getDetail(Number(id));
      setData(response.data.data || null);
      // 数据加载完成后获取匹配结果
      const cadreData = response.data.data;
      if (cadreData?.position?.id) {
        fetchMatchResultByPosition(cadreData.position.id);
      }
    } catch (error) {
      console.error('Failed to fetch cadre detail:', error);
    } finally {
      setLoading(false);
    }
  };

  // 根据岗位ID获取匹配结果
  const fetchMatchResultByPosition = async (positionId: number) => {
    if (!id) return;
    try {
      const response = await matchApi.getResults({ cadre_id: Number(id), position_id: positionId });
      console.log('Match result response:', response);
      const result = response.data.data?.items?.[0];
      console.log('Parsed match result:', result);
      if (result) {
        setMatchResult(result);
      }
    } catch (error) {
      console.error('Failed to fetch match result:', error);
    }
  };

  useEffect(() => {
    if (hasFetchedRef.current) return;

    fetchData();
    if (id) {
      fetchCareerData();
      fetchAbilityData();
      fetchTraitData();
      fetchPositionList();
      fetchAIAnalysisResult(); // 获取AI分析历史结果
    }
    // 检查是否来自匹配分析页面
    if (location.state?.fromMatch) {
      setFromMatch(true);
    } else {
      setFromMatch(false);
    }
    hasFetchedRef.current = true;
  }, [id, location.state]);

  // 获取岗位列表
  const fetchPositionList = async () => {
    try {
      const response = await positionApi.getAll();
      setPositionList(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch position list:', error);
    }
  };

  // 干部履历相关函数
  const fetchCareerData = async () => {
    if (!id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/cadres/${id}/dynamic-info`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      setCareerData(result.data || []);

      // 重置tab滚动位置到最左边
      setTimeout(() => {
        const navWrap = document.querySelector('.career-tabs .ant-tabs-nav-wrap');
        if (navWrap) {
          (navWrap as HTMLElement).scrollLeft = 0;
        }
      }, 100);
    } catch (error) {
      console.error('Failed to fetch career data:', error);
    }
  };

  const handleCareerAdd = (infoType: number) => {
    setEditingCareer(null);
    careerForm.resetFields();
    careerForm.setFieldsValue({ info_type: infoType });
    setCareerModalVisible(true);
  };

  const handleCareerEdit = (record: CadreDynamicInfo) => {
    setEditingCareer(record);
    const formData: any = { ...record };
    // 格式化日期字段
    const dateFields = ['training_date', 'project_start_date', 'project_end_date', 'reward_date', 'term_start_date', 'term_end_date', 'start_date', 'end_date', 'work_start_date', 'work_end_date'];
    dateFields.forEach(field => {
      if (formData[field]) {
        formData[field] = dayjs(formData[field]);
      }
    });

    // 解析绩效数据的 assessment_dimension 字段
    if (formData.info_type === 3 && formData.assessment_dimension) {
      const dimension = formData.assessment_dimension;
      const yearMatch = dimension.match(/(\d{4})年/);
      if (yearMatch) {
        formData.assessment_year = yearMatch[1];
      }
      if (dimension.includes('季度')) {
        const quarterMatch = dimension.match(/(第[一二三四]季度)/);
        if (quarterMatch) {
          formData.assessment_quarter = quarterMatch[1];
        }
      } else if (dimension.includes('半年度')) {
        const halfYearMatch = dimension.match(/([上下]半年)/);
        if (halfYearMatch) {
          formData.assessment_half_year = halfYearMatch[1];
        }
      } else if (dimension.match(/\d+月/)) {
        const monthMatch = dimension.match(/(\d+)月/);
        if (monthMatch) {
          formData.assessment_month = monthMatch[1] + '月';
        }
      }
    }

    careerForm.setFieldsValue(formData);
    setCareerModalVisible(true);
  };

  const handleCareerDelete = async (recordId: number) => {
    try {
      await fetch(`http://localhost:5000/api/cadres/dynamic-info/${recordId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      message.success('删除成功');
      fetchCareerData();
    } catch (error) {
      message.error('删除失败');
      console.error('Failed to delete career:', error);
    }
  };

  const handleCareerSubmit = async () => {
    try {
      const values = await careerForm.validateFields();
      const infoType = values.info_type;

      const submitData: any = { info_type: infoType };

      // 根据类型设置对应字段
      if (infoType === 1) {
        submitData.training_name = values.training_name;
        submitData.training_date = values.training_date ? values.training_date.format('YYYY-MM-DD') : null;
        submitData.training_content = values.training_content;
        submitData.training_result = values.training_result;
      } else if (infoType === 6) {
        submitData.work_start_date = values.work_start_date ? values.work_start_date.format('YYYY-MM-DD') : null;
        submitData.work_end_date = values.work_end_date ? values.work_end_date.format('YYYY-MM-DD') : null;
        submitData.work_company = values.work_company;
        submitData.work_position = values.work_position;
      } else if (infoType === 2) {
        submitData.project_no = values.project_no;
        submitData.project_name = values.project_name;
        submitData.project_role = values.project_role;
        submitData.project_start_date = values.project_start_date ? values.project_start_date.format('YYYY-MM-DD') : null;
        submitData.project_end_date = values.project_end_date ? values.project_end_date.format('YYYY-MM-DD') : null;
        submitData.project_result = values.project_result;
        submitData.project_rating = values.project_rating;
        submitData.is_core_project = values.is_core_project || false;
      } else if (infoType === 3) {
        submitData.assessment_cycle = values.assessment_cycle;
        submitData.assessment_grade = values.assessment_grade;
        submitData.assessment_comment = values.assessment_comment;

        const cycle = values.assessment_cycle;
        const year = values.assessment_year;
        let timeDesc = `${year}年`;

        if (cycle === '半年度') {
          timeDesc += ` ${values.assessment_half_year}`;
        } else if (cycle === '季度') {
          timeDesc += ` ${values.assessment_quarter}`;
        } else if (cycle === '月度') {
          timeDesc += ` ${values.assessment_month}`;
        }

        submitData.assessment_dimension = timeDesc;
      } else if (infoType === 4) {
        submitData.reward_type = values.reward_type;
        submitData.reward_reason = values.reward_reason;
        submitData.reward_date = values.reward_date ? values.reward_date.format('YYYY-MM-DD') : null;
      } else if (infoType === 5) {
        submitData.position_name = values.position_name;
        submitData.responsibility = values.responsibility;
        submitData.appointment_type = values.appointment_type;
        submitData.term_start_date = values.term_start_date ? values.term_start_date.format('YYYY-MM-DD') : null;
        submitData.term_end_date = values.term_end_date ? values.term_end_date.format('YYYY-MM-DD') : null;
        submitData.approval_record = values.approval_record;
      }

      submitData.remark = values.remark;

      if (editingCareer) {
        await fetch(`http://localhost:5000/api/cadres/dynamic-info/${editingCareer.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(submitData),
        });
      } else {
        await fetch(`http://localhost:5000/api/cadres/${id}/dynamic-info`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify(submitData),
        });
      }
      message.success(editingCareer ? '更新成功' : '创建成功');
      setCareerModalVisible(false);
      fetchCareerData();
    } catch (error) {
      message.error('保存失败');
      console.error('Failed to save career:', error);
    }
  };

  // 能力评分相关函数
  const fetchAbilityData = async () => {
    if (!id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/cadres/${id}/abilities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      const abilities = result.data || [];
      setAbilityData(abilities);
    } catch (error) {
      console.error('Failed to fetch ability data:', error);
    }
  };

  const handleAbilityEdit = () => {
    const formData: any = {};
    abilityData.forEach((item: any) => {
      const key = `${item.ability_dimension}_${item.ability_tag}`;
      formData[key] = {
        score: item.score,
        comment: item.comment || '',
      };
    });
    abilityForm.setFieldsValue(formData);
    setAbilityModalVisible(true);
  };

  const handleAbilitySubmit = async () => {
    if (!id) return;
    setAbilitySubmitting(true);
    try {
      const values = await abilityForm.validateFields();

      const unfilledFields: string[] = [];
      ABILITY_DIMENSION_LIST.forEach((dimension) => {
        const tags = getTagsByDimension(dimension);
        tags.forEach((tag) => {
          const key = `${dimension}_${tag}`;
          const fieldValue = values[key];
          if (!fieldValue || !fieldValue.score) {
            unfilledFields.push(`${dimension}-${tag}`);
          }
        });
      });

      if (unfilledFields.length > 0) {
        message.error(`以下字段未填写评分：${unfilledFields.join('、')}`);
        setAbilitySubmitting(false);
        return;
      }

      const abilities: any[] = [];
      Object.entries(values).forEach(([key, value]: [string, any]) => {
        if (value && value.score) {
          const [dimension, tag] = key.split('_');
          abilities.push({
            ability_dimension: dimension,
            ability_tag: tag,
            score: value.score,
            comment: value.comment || '',
          });
        }
      });

      await fetch(`http://localhost:5000/api/cadres/${id}/abilities`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ abilities }),
      });
      message.success('保存成功');
      setAbilityModalVisible(false);
      fetchAbilityData();
    } catch (error) {
      message.error('保存失败');
      console.error('Failed to save ability:', error);
    } finally {
      setAbilitySubmitting(false);
    }
  };

  // 生成能力雷达图配置
  const getAbilityRadarOption = () => {
    const dimensionScores: any = {};
    ABILITY_DIMENSION_LIST.forEach((dimension) => {
      const tags = getTagsByDimension(dimension);
      let totalScore = 0;
      let count = 0;
      tags.forEach((tag) => {
        const found = abilityData.find(
          (item: any) => item.ability_dimension === dimension && item.ability_tag === tag
        );
        if (found) {
          totalScore += found.score;
          count++;
        }
      });
      dimensionScores[dimension] = count > 0 ? (totalScore / count).toFixed(1) : 0;
    });

    return {
      tooltip: {
        trigger: 'item',
        confine: true,
        appendToBody: true,
        className: 'echarts-tooltip-custom',
        extraCssText: 'z-index: 9999;'
      },
      radar: {
        indicator: ABILITY_DIMENSION_LIST.map(dimension => ({
          name: dimension,
          max: 5
        })),
        radius: 80,
        axisName: {
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: 12,
          fontWeight: 500
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.15)'
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.15)'
          }
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(212, 175, 55, 0.08)', 'rgba(212, 175, 55, 0.02)']
          }
        }
      },
      series: [
        {
          name: '能力评分',
          type: 'radar',
          data: [
            {
              value: ABILITY_DIMENSION_LIST.map(dimension => parseFloat(dimensionScores[dimension])),
              name: '能力评分',
              areaStyle: {
                color: 'rgba(212, 175, 55, 0.35)'
              },
              lineStyle: {
                color: '#d4af37',
                width: 2.5
              },
              itemStyle: {
                color: '#d4af37'
              }
            }
          ]
        }
      ]
    };
  };

  // 特质分析相关函数
  const fetchTraitData = async () => {
    if (!id) return;
    try {
      const response = await fetch(`http://localhost:5000/api/cadres/${id}/traits`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      const traits = result.data || [];

      const formData: any = {};
      traits.forEach((item: any) => {
        formData[item.trait_type] = item.trait_value;
      });
      traitForm.setFieldsValue(formData);
      setTraitData(traits);
    } catch (error) {
      console.error('Failed to fetch trait data:', error);
    }
  };

  const handleTraitEdit = () => {
    setTraitModalVisible(true);
  };

  const handleTraitSubmit = async () => {
    if (!id) return;
    setTraitSubmitting(true);
    try {
      const values = await traitForm.validateFields();

      const unfilledTypes: string[] = [];
      TRAIT_TYPE_LIST.forEach((typeConfig) => {
        if (!values[typeConfig.value]) {
          unfilledTypes.push(typeConfig.label);
        }
      });

      if (unfilledTypes.length > 0) {
        message.error(`以下特质类型未选择：${unfilledTypes.join('、')}`);
        setTraitSubmitting(false);
        return;
      }

      const traits: any[] = [];
      Object.entries(values).forEach(([traitType, traitValue]: [string, any]) => {
        if (traitValue) {
          traits.push({
            trait_type: traitType,
            trait_value: traitValue,
          });
        }
      });

      await fetch(`http://localhost:5000/api/cadres/${id}/traits`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ traits }),
      });
      message.success('保存成功');
      setTraitModalVisible(false);
      fetchTraitData();
    } catch (error) {
      message.error('保存失败');
      console.error('Failed to save trait:', error);
    } finally {
      setTraitSubmitting(false);
    }
  };

  if (!data || loading) {
    return (
      <div className="detail-loading">
        <LoadingOutlined style={{ fontSize: 48, color: '#d4af37' }} />
        <p>加载中...</p>
      </div>
    );
  }

  const statusConfig = {
    1: { label: '在职', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
    2: { label: '离职', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
    3: { label: '退休', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  };
  const statusInfo = statusConfig[data.status as keyof typeof statusConfig] || statusConfig[3];

  // 主Tab项配置
  const mainTabItems = [
    {
      key: 'ability',
      label: '能力分析',
      icon: <ThunderboltOutlined />,
      children: (
        <div className="ability-analysis-content">
          {/* 第一行：岗位匹配 + 能力评估 */}
          <div className="ability-top-row">
            {/* 岗位匹配情况卡片 */}
            <div className="info-card match-card">
              <div className="card-header">
                <BarChartOutlined className="card-icon" />
                <h3 className="card-title">岗位匹配</h3>
              </div>
              <div className="card-body">
                {data.position ? (
                  <div className="match-info">
                    <div className="match-position">{data.position.position_name}</div>
                    {matchResult ? (
                      <>
                        <div className="match-score-section">
                          <div className="match-score-label">匹配得分</div>
                          <div className="match-score-value">{matchResult.final_score || '--'}</div>
                        </div>
                        <div className="match-level-section">
                          <div className="match-level-label">匹配等级</div>
                          <div className={`match-level-value match-level-${matchResult.match_level}`}>
                            {matchResult.match_level === 'excellent' && '优质匹配'}
                            {matchResult.match_level === 'qualified' && '合格匹配'}
                            {matchResult.match_level === 'unqualified' && '不合格匹配'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="match-score-section">
                          <div className="match-score-label">匹配得分</div>
                          <div className="match-score-value">--</div>
                        </div>
                        <div className="match-level-section">
                          <div className="match-level-label">匹配等级</div>
                          <div className="match-level-value match-level-pending">暂无数据</div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <CalendarOutlined />
                    <p>该干部未分配岗位</p>
                  </div>
                )}
              </div>
            </div>

            {/* 能力评估卡片 */}
            <div className="info-card ability-card">
              <div className="card-header">
                <ThunderboltOutlined className="card-icon" />
                <h3 className="card-title">能力评估</h3>
                <button className="add-btn" onClick={handleAbilityEdit}>
                  <EditOutlined /> 设置
                </button>
              </div>
              <div className="card-body">
                {abilityData.length > 0 ? (
                  <div className="ability-chart-container">
                    <ReactECharts
                      option={getAbilityRadarOption()}
                      style={{ width: '100%', height: '220px' }}
                      opts={{ renderer: 'canvas' }}
                    />
                  </div>
                ) : (
                  <div className="empty-state">
                    <ThunderboltOutlined />
                    <p>暂无能力评估数据</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 特质分析卡片 */}
          <div className="info-card trait-card">
            <div className="card-header">
              <BulbOutlined className="card-icon" />
              <h3 className="card-title">特质分析</h3>
              <button className="add-btn" onClick={handleTraitEdit}>
                <EditOutlined /> 设置
              </button>
            </div>
            <div className="card-body">
              {traitData.length > 0 ? (
                <div className="trait-grid">
                  {TRAIT_TYPE_LIST.map((typeConfig) => {
                    const trait = traitData.find((t: any) => t.trait_type === typeConfig.value);
                    return (
                      <div key={typeConfig.value} className="trait-item">
                        <div className="trait-type">{typeConfig.label}</div>
                        <div className="trait-value">
                          {trait ? (
                            <>
                              <span className="value-text">{trait.trait_value}</span>
                              {trait.trait_desc && (
                                <span className="value-desc">({trait.trait_desc})</span>
                              )}
                            </>
                          ) : (
                            <span className="value-empty">未设置</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <BulbOutlined />
                  <p>暂无特质分析数据</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'ai',
      label: 'AI分析',
      icon: <RobotOutlined />,
      children: (
        <div className="ai-analysis-content">
          <div className="info-card ai-card">
            {aiResult ? (
              // 有分析结果时，按钮在header
              <>
                <div className="card-header">
                  <RobotOutlined className="card-icon" />
                  <h3 className="card-title">AI智能分析</h3>
                  <Button
                    type="primary"
                    icon={<RobotOutlined />}
                    onClick={handleAIAnalysis}
                    loading={aiLoading}
                  >
                    重新分析
                  </Button>
                </div>
                <div className="card-body">
                  {aiLoading ? (
                    <div className="ai-loading-container">
                      <div className="ai-loading-icon">
                        <RobotOutlined />
                      </div>
                      <h4 className="ai-loading-title">AI正在分析中...</h4>
                      <p className="ai-loading-desc">正在综合评估您的能力、特质和发展潜力，请稍候</p>
                      <div className="ai-loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="ai-result-content">
                      <div className="ai-result-text">{aiResult}</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // 无分析结果时，按钮在内容区域
              <>
                <div className="card-header">
                  <RobotOutlined className="card-icon" />
                  <h3 className="card-title">AI智能分析</h3>
                </div>
                <div className="card-body">
                  {aiLoading ? (
                    <div className="ai-loading-container">
                      <div className="ai-loading-icon">
                        <RobotOutlined />
                      </div>
                      <h4 className="ai-loading-title">AI正在分析中...</h4>
                      <p className="ai-loading-desc">正在综合评估您的能力、特质和发展潜力，请稍候</p>
                      <div className="ai-loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  ) : (
                    <div className="ai-intro-container">
                      <Button
                        type="primary"
                        icon={<RobotOutlined />}
                        onClick={handleAIAnalysis}
                        loading={aiLoading}
                        size="large"
                        className="ai-start-btn"
                      >
                        启动AI分析
                      </Button>
                      <p className="ai-intro-desc">
                        基于您的基本信息、能力评估、特质分析和成长履历，AI将为您生成一份个性化的职业发展分析报告，帮助您深入了解自身优势、发现提升空间、规划发展路径。
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'career',
      label: '干部履历',
      icon: <CalendarOutlined />,
      children: (
        <div className="career-content">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabPosition="top"
            items={DYNAMIC_INFO_TYPE_OPTIONS.map((type) => {
              const typeData = careerData.filter((item) => item.info_type === type.value);
              let IconComponent = BookOutlined;
              if (type.icon === 'ProjectOutlined') IconComponent = ProjectOutlined;
              else if (type.icon === 'BarChartOutlined') IconComponent = BarChartOutlined;
              else if (type.icon === 'TrophyOutlined') IconComponent = TrophyOutlined;
              else if (type.icon === 'UserSwitchOutlined') IconComponent = UserSwitchOutlined;
              else if (type.icon === 'ProfileOutlined') IconComponent = ProfileOutlined;

              return {
                key: String(type.value),
                label: (
                  <span className="career-tab-label">
                    <IconComponent />
                    {type.label}
                    {typeData.length > 0 && <span className="tab-count">{typeData.length}</span>}
                  </span>
                ),
                children: (
                  <div className="career-tab-content">
                    <div className="career-actions">
                      <span className="tab-description">
                        {type.value === 1 && '记录干部参加培训学习的情况'}
                        {type.value === 2 && '记录干部参与项目工作的经历'}
                        {type.value === 3 && '记录干部绩效考核的等级和评价'}
                        {type.value === 4 && '记录干部获得的奖励或处分情况'}
                        {type.value === 5 && '记录干部岗位任免和变更信息'}
                        {type.value === 6 && '记录干部过往的工作经历'}
                      </span>
                      <button className="add-btn-sm" onClick={() => handleCareerAdd(type.value)}>
                        <EditOutlined /> 添加{type.label}
                      </button>
                    </div>
                    {typeData.length > 0 ? (
                      <div className="career-list">
                        {typeData.map((item) => (
                          <div key={item.id} className="career-item">
                            <div className="career-header">
                              <span className="career-title">
                                {type.value === 1 && (
                                  <>
                                    {item.training_name}
                                    {item.training_date && <span className="career-date"> {item.training_date}</span>}
                                  </>
                                )}
                                {type.value === 6 && (
                                  <>
                                    {item.work_company}
                                    {(item.work_start_date || item.work_end_date) && (
                                      <span className="career-date">
                                        {' '}({item.work_start_date || '开始'} ~ {item.work_end_date || '结束'})
                                      </span>
                                    )}
                                  </>
                                )}
                                {type.value === 2 && (
                                  <>
                                    {item.project_name}
                                    {item.is_core_project && (
                                      <span className="core-project-badge">核心</span>
                                    )}
                                    {(item.project_start_date || item.project_end_date) && (
                                      <span className="career-date">
                                        {' '}({item.project_start_date || '开始'} ~ {item.project_end_date || '结束'})
                                      </span>
                                    )}
                                  </>
                                )}
                                {type.value === 3 && (
                                  <>
                                    {item.assessment_grade && <span className="grade-badge-inline grade-{item.assessment_grade.toLowerCase()}">{item.assessment_grade}</span>}
                                    {item.assessment_dimension && <span> {item.assessment_dimension}</span>}
                                  </>
                                )}
                                {type.value === 4 && (
                                  <>
                                    {item.reward_type && <span>{item.reward_type}</span>}
                                    {item.reward_date && <span className="career-date"> {item.reward_date}</span>}
                                  </>
                                )}
                                {type.value === 5 && (
                                  <>
                                    {item.position_name}
                                    {(item.term_start_date || item.term_end_date) && (
                                      <span className="career-date">
                                        {' '}({item.term_start_date || '开始'} ~ {item.term_end_date || '结束'})
                                      </span>
                                    )}
                                  </>
                                )}
                              </span>
                              <div className="career-actions-inline">
                                <button
                                  className="action-btn"
                                  onClick={() => handleCareerEdit(item)}
                                >
                                  <EditOutlined />
                                </button>
                                <Popconfirm
                                  title="确定删除？"
                                  onConfirm={() => handleCareerDelete(item.id!)}
                                  okText="确定"
                                  cancelText="取消"
                                >
                                  <button className="action-btn action-btn-delete">
                                    <DeleteOutlined />
                                  </button>
                                </Popconfirm>
                              </div>
                            </div>

                            {/* 培训记录详情 */}
                            {type.value === 1 && (
                              <>
                                {item.training_content && (
                                  <div className="career-desc">
                                    <span className="result-label">培训内容：</span>
                                    {item.training_content}
                                  </div>
                                )}
                                {item.training_result && (
                                  <div className="career-result">
                                    <span className="result-label">培训结果：</span>
                                    {item.training_result}
                                  </div>
                                )}
                              </>
                            )}

                            {/* 工作经历详情 */}
                            {type.value === 6 && (
                              <>
                                {item.work_position && (
                                  <div className="career-meta">
                                    <span>岗位：{item.work_position}</span>
                                  </div>
                                )}
                                {item.remark && (
                                  <div className="career-desc">
                                    <span className="result-label">备注：</span>
                                    {item.remark}
                                  </div>
                                )}
                              </>
                            )}

                            {/* 项目经历详情 */}
                            {type.value === 2 && (
                              <>
                                {(item.project_no || item.project_role) && (
                                  <div className="career-meta">
                                    {item.project_no && <span>编号：{item.project_no}</span>}
                                    {item.project_role && <span>角色：{item.project_role}</span>}
                                  </div>
                                )}
                                {item.project_result && (
                                  <div className="career-desc">
                                    <span className="result-label">项目结果：</span>
                                    {item.project_result}
                                  </div>
                                )}
                                {item.project_rating && (
                                  <div className="career-result">
                                    <span className="result-label">项目评级：</span>
                                    {item.project_rating}
                                  </div>
                                )}
                              </>
                            )}

                            {/* 绩效数据详情 */}
                            {type.value === 3 && (
                              <>
                                {item.assessment_comment && (
                                  <div className="career-desc">
                                    <span className="result-label">考核评价：</span>
                                    {item.assessment_comment}
                                  </div>
                                )}
                              </>
                            )}

                            {/* 奖惩记录详情 */}
                            {type.value === 4 && (
                              <>
                                {item.reward_reason && (
                                  <div className="career-desc">
                                    <span className="result-label">奖惩原因：</span>
                                    {item.reward_reason}
                                  </div>
                                )}
                              </>
                            )}

                            {/* 岗位变更详情 */}
                            {type.value === 5 && (
                              <>
                                {item.appointment_type && (
                                  <div className="career-meta">
                                    <span>类型：{item.appointment_type}</span>
                                  </div>
                                )}
                                {item.responsibility && (
                                  <div className="career-desc">
                                    <span className="result-label">职责描述：</span>
                                    {item.responsibility}
                                  </div>
                                )}
                                {item.approval_record && (
                                  <div className="career-desc">
                                    <span className="result-label">审批记录：</span>
                                    {item.approval_record}
                                  </div>
                                )}
                              </>
                            )}

                            {item.remark && (
                              <div className="career-remark">备注：{item.remark}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state-sm">
                        <IconComponent />
                        <p>暂无{type.label}</p>
                      </div>
                    )}
                  </div>
                ),
              };
            })}
            className="career-tabs"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="cadre-detail-page">
      {/* 返回按钮 */}
      <button
        className="back-btn"
        onClick={() => {
          if (fromMatch) {
            navigate('/match');
          } else {
            navigate('/cadre');
          }
        }}
        title="返回"
      >
        <ArrowLeftOutlined />
      </button>

      {/* 主内容区域 - 左右布局 */}
      <div className="detail-content-split">
        {/* 左侧 - 基本信息（固定） */}
        <div className="left-panel">
          <div className="info-card basic-info-card">
            <div className="card-header">
              <UserOutlined className="card-icon" />
              <h3 className="card-title">基本信息</h3>
              <button
                className="add-btn"
                onClick={() => navigate(`/cadre/${id}/edit`)}
              >
                <EditOutlined /> 编辑
              </button>
            </div>
            <div className="card-body">
              {/* 核心信息区域 */}
              <div className="basic-info-section">
                <div className="basic-info-avatar">
                  <UserOutlined />
                </div>
                <div className="basic-info-main">
                  <h2 className="basic-info-name">{data.name}</h2>
                  <div className="basic-info-tags">
                    <span className="status-tag" style={{ color: statusInfo.color, background: statusInfo.bg }}>
                      {statusInfo.label}
                    </span>
                    <span className="info-tag-sm">{data.employee_no}</span>
                  </div>
                </div>
              </div>

              <div className="info-divider"></div>

              {/* 详细信息 */}
              <div className="info-details-grid">
                {/* 管理层级和岗级 - 一行两个字段 */}
                <div className="info-row-group">
                  <div className="info-row">
                    <span className="info-label">管理层级</span>
                    <span className="info-value">{data.management_level || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">岗级</span>
                    <span className="info-value">{data.job_grade || '-'}</span>
                  </div>
                </div>

                {/* 政治面貌和学历 - 一行两个字段 */}
                <div className="info-row-group">
                  <div className="info-row">
                    <span className="info-label">政治面貌</span>
                    <span className="info-value">{data.political_status || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">学历</span>
                    <span className="info-value">{data.education || '-'}</span>
                  </div>
                </div>

                {/* 性别和工作省份 - 一行两个字段 */}
                <div className="info-row-group">
                  <div className="info-row">
                    <span className="info-label">性别</span>
                    <span className="info-value">{data.gender || '-'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">工作省份</span>
                    <span className="info-value">{data.work_province || '-'}</span>
                  </div>
                </div>

                {/* 部门 - 单独占一行 */}
                <div className="info-row full-width">
                  <span className="info-label">部门</span>
                  <span className="info-value">{data.department?.name || '-'}</span>
                </div>

                {/* 管理归属 - 单独占一行 */}
                <div className="info-row full-width">
                  <span className="info-label">管理归属</span>
                  <span className="info-value">{data.management_attribution || '-'}</span>
                </div>

                {/* 出生日期 - 单独占一行 */}
                <div className="info-row full-width">
                  <span className="info-label">出生日期</span>
                  <span className="info-value">
                    {data.birth_date ? (
                      <>
                        {data.birth_date}
                        {calculateAge(data.birth_date) !== null && (
                          <span className="info-age"> ({calculateAge(data.birth_date)}岁)</span>
                        )}
                      </>
                    ) : '-'}
                  </span>
                </div>

                {/* 入职时间 - 单独占一行 */}
                <div className="info-row full-width">
                  <span className="info-label">入职时间</span>
                  <span className="info-value">
                    {data.entry_date ? (
                      <>
                        {data.entry_date}
                        {calculateWorkYears(data.entry_date) !== null && (
                          <span className="info-age"> ({calculateWorkYears(data.entry_date)}年)</span>
                        )}
                      </>
                    ) : '-'}
                  </span>
                </div>

                {/* 学生兵级届 - 条件渲染，单独占一行 */}
                {data.student_soldier_class && (
                  <div className="info-row full-width">
                    <span className="info-label">学生兵级届</span>
                    <span className="info-value">{data.student_soldier_class}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧 - Tab内容 */}
        <div className="right-panel">
          <Tabs
            activeKey={mainTab}
            onChange={setMainTab}
            items={mainTabItems}
            className="main-tabs"
            tabPosition="right"
          />
        </div>
      </div>

      {/* 干部履历Modal */}
      <Modal
        title={
          editingCareer
            ? `编辑${DYNAMIC_INFO_TYPE_OPTIONS.find(t => t.value === editingCareer?.info_type)?.label || '履历'}`
            : `新增${DYNAMIC_INFO_TYPE_OPTIONS.find(t => t.value === careerForm.getFieldValue('info_type'))?.label || '履历'}`
        }
        open={careerModalVisible}
        onCancel={() => {
          setCareerModalVisible(false);
          careerForm.resetFields();
        }}
        onOk={handleCareerSubmit}
        width={700}
        className="modern-modal career-modal"
      >
        <Form form={careerForm} layout="horizontal" labelCol={{ style: { width: '80px' } }} wrapperCol={{ style: { flex: 1 } }}>
          <Form.Item name="info_type" label="类型" hidden>
            <Input />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.info_type !== currentValues.info_type}>
            {({ getFieldValue }) => {
              const infoType = getFieldValue('info_type');
              const typeLabel = DYNAMIC_INFO_TYPE_OPTIONS.find(t => t.value === infoType)?.label || '';

              return (
                <>
                  <div className="form-section">
                    <div className="form-section-title">{typeLabel}</div>
                    <div className="form-row">
                      {/* 培训记录字段 */}
                      {infoType === 1 && (
                        <>
                          <Form.Item label="培训名称" name="training_name" rules={[{ required: true, message: '请输入培训名称' }]} className="full-width">
                            <Input placeholder="请输入培训名称" />
                          </Form.Item>
                          <Form.Item label="培训日期" name="training_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择培训日期" />
                          </Form.Item>
                          <Form.Item label="培训内容" name="training_content" className="full-width">
                            <TextArea rows={3} placeholder="请输入培训内容" />
                          </Form.Item>
                          <Form.Item label="培训结果" name="training_result" className="full-width">
                            <Input placeholder="请输入培训结果" />
                          </Form.Item>
                        </>
                      )}

                      {/* 项目经历字段 */}
                      {infoType === 2 && (
                        <>
                          <Form.Item label="项目编号" name="project_no">
                            <Input placeholder="请输入项目编号" />
                          </Form.Item>
                          <Form.Item label="项目名称" name="project_name" rules={[{ required: true, message: '请输入项目名称' }]}>
                            <Input placeholder="请输入项目名称" />
                          </Form.Item>
                          <Form.Item label="项目角色" name="project_role" className="full-width">
                            <Input placeholder="请输入项目角色" />
                          </Form.Item>
                          <Form.Item label="开始日期" name="project_start_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择开始日期" />
                          </Form.Item>
                          <Form.Item label="结束日期" name="project_end_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择结束日期" />
                          </Form.Item>
                          <Form.Item label="项目结果" name="project_result" className="full-width">
                            <TextArea rows={3} placeholder="请输入项目结果" />
                          </Form.Item>
                          <Form.Item label="项目评级" name="project_rating">
                            <Select placeholder="请选择项目评级" options={PROJECT_RATING_OPTIONS} />
                          </Form.Item>
                          <Form.Item label="核心项目" name="is_core_project" valuePropName="checked">
                            <input type="checkbox" style={{ width: '16px', height: '16px' }} />
                          </Form.Item>
                        </>
                      )}

                      {/* 绩效数据字段 */}
                      {infoType === 3 && (
                        <>
                          <Form.Item
                            label="考核周期"
                            name="assessment_cycle"
                            rules={[{ required: true, message: '请选择考核周期' }]}
                          >
                            <Select placeholder="请选择考核周期" options={ASSESSMENT_CYCLE_OPTIONS} />
                          </Form.Item>

                          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.assessment_cycle !== currentValues.assessment_cycle}>
                            {({ getFieldValue }) => {
                              const cycle = getFieldValue('assessment_cycle');
                              const yearOptions = getCurrentYearOptions();

                              return (
                                <>
                                  <Form.Item
                                    label="年份"
                                    name="assessment_year"
                                    rules={[{ required: true, message: '请选择年份' }]}
                                  >
                                    <Select placeholder="请选择年份" options={yearOptions} />
                                  </Form.Item>

                                  {cycle === '半年度' && (
                                    <Form.Item
                                      label="半年度"
                                      name="assessment_half_year"
                                      rules={[{ required: true, message: '请选择半年度' }]}
                                    >
                                      <Select placeholder="请选择" options={HALF_YEAR_OPTIONS} />
                                    </Form.Item>
                                  )}

                                  {cycle === '季度' && (
                                    <Form.Item
                                      label="季度"
                                      name="assessment_quarter"
                                      rules={[{ required: true, message: '请选择季度' }]}
                                    >
                                      <Select placeholder="请选择季度" options={QUARTER_OPTIONS} />
                                    </Form.Item>
                                  )}

                                  {cycle === '月度' && (
                                    <Form.Item
                                      label="月份"
                                      name="assessment_month"
                                      rules={[{ required: true, message: '请选择月份' }]}
                                    >
                                      <Select placeholder="请选择月份" options={MONTH_OPTIONS} />
                                    </Form.Item>
                                  )}
                                </>
                              );
                            }}
                          </Form.Item>

                          <Form.Item
                            label="考核等级"
                            name="assessment_grade"
                            rules={[{ required: true, message: '请选择考核等级' }]}
                          >
                            <Select placeholder="请选择考核等级" options={ASSESSMENT_GRADE_OPTIONS} />
                          </Form.Item>

                          <Form.Item label="考核评价" name="assessment_comment" className="full-width">
                            <TextArea rows={3} placeholder="请输入考核评价" />
                          </Form.Item>
                        </>
                      )}

                      {/* 奖惩记录字段 */}
                      {infoType === 4 && (
                        <>
                          <Form.Item label="奖惩类型" name="reward_type" rules={[{ required: true, message: '请选择奖惩类型' }]}>
                            <Select placeholder="请选择奖惩类型" options={REWARD_TYPE_OPTIONS} />
                          </Form.Item>
                          <Form.Item label="奖惩日期" name="reward_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择奖惩日期" />
                          </Form.Item>
                          <Form.Item label="奖惩原因" name="reward_reason" rules={[{ required: true, message: '请输入奖惩原因' }]} className="full-width">
                            <TextArea rows={3} placeholder="请输入奖惩原因" />
                          </Form.Item>
                        </>
                      )}

                      {/* 岗位变更字段 */}
                      {infoType === 5 && (
                        <>
                          <Form.Item label="岗位名称" name="position_name" rules={[{ required: true, message: '请选择岗位' }]} className="full-width">
                            <Select placeholder="请选择岗位" options={positionList.map(p => ({ label: p.position_name, value: p.position_name }))} showSearch optionFilterProp="label" />
                          </Form.Item>
                          <Form.Item label="任命类型" name="appointment_type" rules={[{ required: true, message: '请选择任命类型' }]}>
                            <Select placeholder="请选择任命类型" options={APPOINTMENT_TYPE_OPTIONS} />
                          </Form.Item>
                          <Form.Item label="职责描述" name="responsibility" className="full-width">
                            <TextArea rows={3} placeholder="请输入职责描述" />
                          </Form.Item>
                          <Form.Item label="任期开始" name="term_start_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择开始日期" />
                          </Form.Item>
                          <Form.Item label="任期结束" name="term_end_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择结束日期" />
                          </Form.Item>
                          <Form.Item label="审批记录" name="approval_record" className="full-width">
                            <TextArea rows={3} placeholder="请输入审批记录" />
                          </Form.Item>
                        </>
                      )}

                      {/* 工作经历字段 */}
                      {infoType === 6 && (
                        <>
                          <Form.Item label="工作单位" name="work_company" rules={[{ required: true, message: '请输入工作单位' }]} className="full-width">
                            <Input placeholder="请输入工作单位" />
                          </Form.Item>
                          <Form.Item label="工作岗位" name="work_position" rules={[{ required: true, message: '请输入工作岗位' }]} className="full-width">
                            <Input placeholder="请输入工作岗位" />
                          </Form.Item>
                          <Form.Item label="开始日期" name="work_start_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择开始日期" />
                          </Form.Item>
                          <Form.Item label="结束日期" name="work_end_date">
                            <DatePicker style={{ width: '100%' }} placeholder="请选择结束日期" />
                          </Form.Item>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="form-section">
                    <div className="form-section-title">备注</div>
                    <Form.Item name="remark" className="full-width">
                      <TextArea rows={2} placeholder="请输入备注（选填）" />
                    </Form.Item>
                  </div>
                </>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

      {/* 能力评分设置Modal */}
      <Modal
        title="设置能力评分"
        open={abilityModalVisible}
        onCancel={() => {
          setAbilityModalVisible(false);
          abilityForm.resetFields();
        }}
        onOk={handleAbilitySubmit}
        width={900}
        okText="保存"
        confirmLoading={abilitySubmitting}
        className="modern-modal ability-modal"
      >
        <Form form={abilityForm} layout="vertical">
          <table className="ability-table">
            <thead>
              <tr>
                <th>能力维度</th>
                <th>能力标签</th>
                <th>评分</th>
                <th>评语</th>
              </tr>
            </thead>
            <tbody>
              {ABILITY_DIMENSION_LIST.map((dimension) => {
                const tags = getTagsByDimension(dimension);
                return tags.map((tag, tagIndex) => {
                  const fieldName = `${dimension}_${tag}`;
                  const isFirstTag = tagIndex === 0;
                  return (
                    <tr key={tag}>
                      {isFirstTag && (
                        <td rowSpan={tags.length} className="dimension-cell">
                          {dimension}
                        </td>
                      )}
                      <td className="tag-cell">{tag}</td>
                      <td className="score-cell">
                        <Form.Item
                          name={[fieldName, 'score']}
                          rules={[{ required: true, message: '必填' }]}
                          style={{ margin: 0 }}
                        >
                          <InputNumber min={1} max={5} step={0.1} precision={1} placeholder="1-5" style={{ width: '100%' }} />
                        </Form.Item>
                      </td>
                      <td className="comment-cell">
                        <Form.Item name={[fieldName, 'comment']} style={{ margin: 0 }}>
                          <Input placeholder="请输入评语" />
                        </Form.Item>
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </Form>
      </Modal>

      {/* 特质分析设置Modal */}
      <Modal
        title="设置特质分析"
        open={traitModalVisible}
        onCancel={() => {
          setTraitModalVisible(false);
        }}
        onOk={handleTraitSubmit}
        width={600}
        okText="保存"
        confirmLoading={traitSubmitting}
        className="modern-modal"
      >
        <Form form={traitForm} layout="vertical">
          {TRAIT_TYPE_LIST.map((typeConfig) => (
            <Form.Item
              key={typeConfig.value}
              name={typeConfig.value}
              label={typeConfig.label}
              rules={[{ required: true, message: `请选择${typeConfig.label}` }]}
            >
              <Select placeholder={`请选择${typeConfig.label}`}>
                {getTraitValues(typeConfig.value).map((item) => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.display}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default CadreDetailNew;
