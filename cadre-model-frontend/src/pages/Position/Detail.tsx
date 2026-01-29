import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Form, InputNumber, Select, TreeSelect, message, Tabs, Table, Button, Space, Input, Tag, Popconfirm } from 'antd';
import { ArrowLeftOutlined, EditOutlined, TrophyOutlined, SettingOutlined, BulbOutlined, LoadingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import apiClient from '@/utils/request';
import { positionApi } from '@/services/positionApi';
import { majorApi } from '@/services/majorApi';
import { certificateApi } from '@/services/certificateApi';
import type { PositionInfo } from '@/types';
import { ABILITY_DIMENSION_LIST } from '@/utils/abilityConstants';
import { INDICATOR_TYPES, REQUIREMENT_TYPES, EDUCATION_OPTIONS, OPERATOR_OPTIONS, INDICATOR_TYPE_LABELS, REQUIREMENT_TYPE_LABELS } from '@/utils/positionConstants';
import './Detail.css';

const { Option } = Select;

// 岗位要求项类型
interface RequirementItem {
  id?: number;
  requirement_type: 'mandatory' | 'bonus';
  indicator_type: string;
  operator?: string;
  compare_value?: any;
  score_value?: number;
}

const PositionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<PositionInfo | null>(null);

  // 能力权重相关
  const [weightData, setWeightData] = useState<any[]>([]);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [weightForm] = Form.useForm();
  const [weightSubmitting, setWeightSubmitting] = useState(false);

  // 岗位要求相关
  const [requirementData, setRequirementData] = useState<RequirementItem[]>([]);
  const [requirementModalVisible, setRequirementModalVisible] = useState(false);
  const [requirementForm] = Form.useForm();
  const [requirementSubmitting, setRequirementSubmitting] = useState(false);
  const [editingRequirementIndex, setEditingRequirementIndex] = useState<number | null>(null);

  // 元数据
  const [majorTree, setMajorTree] = useState<any[]>([]);
  const [certificateTree, setCertificateTree] = useState<any[]>([]);
  const [selectedReqType, setSelectedReqType] = useState<'mandatory' | 'bonus'>('mandatory');
  const [selectedIndicatorType, setSelectedIndicatorType] = useState<string>('education');
  // 加分项档次列表（用于非专业/证书的指标类型）
  const [bonusRanges, setBonusRanges] = useState<Array<{ min?: number; max?: number; score: number }>>([]);
  // 学历档次列表（用于加分项中的学历）
  const [educationRanges, setEducationRanges] = useState<Array<{ education: string; score: number }>>([]);

  // 使用 ref 追踪是否已加载数据，避免重复请求
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // 只有当 id 改变时才重新获取数据
    if (hasFetchedRef.current) return;

    fetchData();
    fetchWeightData();
    fetchRequirementData();
    fetchMetadata();
    hasFetchedRef.current = true;
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    try {
      const response = await positionApi.getDetail(Number(id));
      setData(response.data.data || null);
    } catch (error) {
      console.error('Failed to fetch position detail:', error);
    }
  };

  // 能力权重相关函数
  const fetchWeightData = async () => {
    if (!id) return;
    try {
      const response = await apiClient.get(`/positions/${id}/weights`);
      const weights = response.data.data || [];

      // 回填表单数据
      const formData: any = {};
      weights.forEach((item: any) => {
        formData[item.ability_dimension] = item.weight;
      });
      weightForm.setFieldsValue(formData);
      setWeightData(weights);
    } catch (error) {
      console.error('Failed to fetch weight data:', error);
    }
  };

  const handleWeightEdit = () => {
    setWeightModalVisible(true);
  };

  const handleWeightSubmit = async () => {
    if (!id) return;
    setWeightSubmitting(true);
    try {
      const values = await weightForm.validateFields();

      // 验证所有维度都已填写
      const unfilledDimensions: string[] = [];
      let totalWeight = 0;
      ABILITY_DIMENSION_LIST.forEach((dimension) => {
        const weight = values[dimension];
        if (weight === undefined || weight === null || weight === '') {
          unfilledDimensions.push(dimension);
        } else {
          totalWeight += weight;
        }
      });

      if (unfilledDimensions.length > 0) {
        message.error(`以下维度未设置权重：${unfilledDimensions.join('、')}`);
        setWeightSubmitting(false);
        return;
      }

      // 验证权重总和是否为100
      if (totalWeight !== 100) {
        message.error(`所有维度权重总和必须为100%，当前为${totalWeight}%`);
        setWeightSubmitting(false);
        return;
      }

      // 构建提交数据 - 每个维度一条记录
      const weights: any[] = [];
      ABILITY_DIMENSION_LIST.forEach((dimension) => {
        weights.push({
          ability_dimension: dimension,
          weight: values[dimension],
        });
      });

      await apiClient.put(`/positions/${id}/weights`, { weights });
      message.success('保存成功');
      setWeightModalVisible(false);
      fetchWeightData();
    } catch (error) {
      message.error('保存失败');
      console.error('Failed to save weight:', error);
    } finally {
      setWeightSubmitting(false);
    }
  };

  // 岗位要求相关函数
  const fetchMetadata = async () => {
    try {
      const [majorsRes, certsRes] = await Promise.all([
        majorApi.getTree(),
        certificateApi.getTree(),
      ]);
      setMajorTree(formatTreeDataForSelect(majorsRes.data.data || []));
      setCertificateTree(formatTreeDataForSelect(certsRes.data.data || []));
    } catch (error) {
      console.error('Failed to fetch metadata:', error);
    }
  };

  // 格式化树形数据为 TreeSelect 所需格式，只有二级节点可选
  const formatTreeDataForSelect = (data: any[]): any[] => {
    return data.map(item => {
      const hasChildren = item.children && item.children.length > 0;
      if (hasChildren) {
        // 一级节点（父节点）- 不可选
        return {
          title: item.name,
          value: item.id,
          key: item.id,
          selectable: false,
          disabled: true,
          children: formatTreeDataForSelect(item.children),
        };
      } else {
        // 二级节点（叶子节点）- 可选
        return {
          title: item.name,
          value: item.id,
          key: item.id,
          selectable: true,
        };
      }
    });
  };

  // 从树形数据中查找节点名称
  const findNodeNameInTree = (tree: any[], id: any): string => {
    for (const node of tree) {
      if (node.value === id) {
        return node.title;
      }
      if (node.children) {
        const found = findNodeNameInTree(node.children, id);
        if (found) return found;
      }
    }
    return '';
  };

  const fetchRequirementData = async () => {
    if (!id) return;
    try {
      const response = await positionApi.getRequirements(Number(id));
      const data = response.data.data || { mandatory: [], bonus: [] };
      // 合并硬性要求和加分项到一个列表
      setRequirementData([...data.mandatory, ...data.bonus]);
    } catch (error) {
      console.error('Failed to fetch requirement data:', error);
    }
  };

  const handleAddRequirement = () => {
    setEditingRequirementIndex(null);
    setSelectedReqType('mandatory');
    setSelectedIndicatorType('education');
    setBonusRanges([]);
    setEducationRanges([]);
    requirementForm.resetFields();
    requirementForm.setFieldsValue({ requirement_type: 'mandatory', indicator_type: 'education', operator: '>=' });
    setRequirementModalVisible(true);
  };

  const handleEditRequirement = (index: number) => {
    const item = requirementData[index];
    setEditingRequirementIndex(index);

    // 解析 compare_value（可能是 JSON 字符串或档次数据）
    let compareValue = item.compare_value;
    let ranges: Array<{ min?: number; max?: number; score: number }> = [];
    let eduRanges: Array<{ education: string; score: number }> = [];

    if (typeof compareValue === 'string' && (compareValue.startsWith('[') || compareValue.startsWith('{'))) {
      try {
        compareValue = JSON.parse(compareValue);
      } catch (e) {
        // 解析失败，保持原样
      }
    }

    // 判断是否为档次数据
    if (item.requirement_type === 'bonus') {
      if (item.indicator_type === 'education') {
        // 学历档次数据
        if (Array.isArray(compareValue) && compareValue.length > 0 && typeof compareValue[0] === 'object' && 'education' in compareValue[0]) {
          eduRanges = compareValue;
          compareValue = undefined;
        }
      } else if (item.indicator_type !== 'major' && item.indicator_type !== 'certificate') {
        // 数值档次数据
        if (Array.isArray(compareValue) && compareValue.length > 0 && typeof compareValue[0] === 'object') {
          ranges = compareValue;
          compareValue = undefined;
        }
      }
    }

    // 设置表单值
    setSelectedReqType(item.requirement_type);
    setSelectedIndicatorType(item.indicator_type);
    setBonusRanges(ranges);
    setEducationRanges(eduRanges);
    requirementForm.setFieldsValue({
      requirement_type: item.requirement_type,
      indicator_type: item.indicator_type,
      operator: item.operator || '>=',
      compare_value: compareValue,
      score_value: item.score_value,
    });
    setRequirementModalVisible(true);
  };

  const handleRequirementSubmit = async () => {
    if (!id) return;
    setRequirementSubmitting(true);
    try {
      const values = await requirementForm.validateFields();

      // 判断是否使用档次模式
      const useRangeMode = values.requirement_type === 'bonus' &&
        values.indicator_type !== 'major' &&
        values.indicator_type !== 'certificate' &&
        values.indicator_type !== 'education';

      const useEducationRangeMode = values.requirement_type === 'bonus' &&
        values.indicator_type === 'education';

      // 构建要求项
      const requirement: RequirementItem = {
        requirement_type: values.requirement_type,
        indicator_type: values.indicator_type,
        operator: values.operator || '>=',
        compare_value: useRangeMode
          ? JSON.stringify(bonusRanges)
          : useEducationRangeMode
          ? JSON.stringify(educationRanges)
          : (typeof values.compare_value === 'string' ? values.compare_value : JSON.stringify(values.compare_value)),
        score_value: (useRangeMode || useEducationRangeMode) ? undefined : values.score_value,
      };

      // 获取现有的所有要求
      const currentResponse = await positionApi.getRequirements(Number(id));
      const currentData = currentResponse.data.data || { mandatory: [], bonus: [] };

      // 合并现有要求
      const allRequirements: RequirementItem[] = [];

      // 添加现有硬性要求
      if (currentData.mandatory && currentData.mandatory.length > 0) {
        currentData.mandatory.forEach((item: RequirementItem) => {
          allRequirements.push({
            requirement_type: 'mandatory',
            indicator_type: item.indicator_type,
            operator: item.operator || '>=',
            compare_value: item.compare_value,
            score_value: item.score_value,
          });
        });
      }

      // 添加现有加分项
      if (currentData.bonus && currentData.bonus.length > 0) {
        currentData.bonus.forEach((item: RequirementItem) => {
          allRequirements.push({
            requirement_type: 'bonus',
            indicator_type: item.indicator_type,
            operator: item.operator || '>=',
            compare_value: item.compare_value,
            score_value: item.score_value,
          });
        });
      }

      // 根据是新增还是编辑来处理
      if (editingRequirementIndex !== null) {
        // 编辑模式：替换指定索引的项
        allRequirements[editingRequirementIndex] = requirement;
      } else {
        // 新增模式：添加新要求
        allRequirements.push(requirement);
      }

      await positionApi.updateRequirements(Number(id), { requirements: allRequirements });
      message.success(editingRequirementIndex !== null ? '编辑成功' : '添加成功');
      setRequirementModalVisible(false);
      setEditingRequirementIndex(null);
      setBonusRanges([]);
      setEducationRanges([]);
      fetchRequirementData();
    } catch (error) {
      message.error(editingRequirementIndex !== null ? '编辑失败' : '添加失败');
      console.error('Failed to save requirement:', error);
    } finally {
      setRequirementSubmitting(false);
    }
  };

  const handleDeleteRequirement = async (index: number) => {
    if (!id) return;
    try {
      // 获取现有的所有要求
      const currentResponse = await positionApi.getRequirements(Number(id));
      const currentData = currentResponse.data.data || { mandatory: [], bonus: [] };

      // 合并成一个列表
      const allRequirements: RequirementItem[] = [];

      // 添加现有硬性要求
      if (currentData.mandatory && currentData.mandatory.length > 0) {
        currentData.mandatory.forEach((item: RequirementItem) => {
          allRequirements.push({
            requirement_type: 'mandatory',
            indicator_type: item.indicator_type,
            operator: item.operator || '>=',
            compare_value: item.compare_value,
            score_value: item.score_value,
          });
        });
      }

      // 添加现有加分项
      if (currentData.bonus && currentData.bonus.length > 0) {
        currentData.bonus.forEach((item: RequirementItem) => {
          allRequirements.push({
            requirement_type: 'bonus',
            indicator_type: item.indicator_type,
            operator: item.operator || '>=',
            compare_value: item.compare_value,
            score_value: item.score_value,
          });
        });
      }

      // 删除指定索引的项
      allRequirements.splice(index, 1);

      await positionApi.updateRequirements(Number(id), { requirements: allRequirements });
      message.success('删除成功');
      fetchRequirementData();
    } catch (error) {
      message.error('删除失败');
      console.error('Failed to delete requirement:', error);
    }
  };

  // 加分项档次设置组件
  const BonusRangeInput = ({ unit = '' }: { unit?: string }) => {
    // 添加档次
    const addRange = () => {
      setBonusRanges([...bonusRanges, { score: 0 }]);
    };

    // 删除档次
    const removeRange = (index: number) => {
      const newRanges = bonusRanges.filter((_, i) => i !== index);
      setBonusRanges(newRanges);
    };

    // 更新档次
    const updateRange = (index: number, field: 'min' | 'max' | 'score', value: number) => {
      const newRanges = [...bonusRanges];
      newRanges[index][field] = value;
      setBonusRanges(newRanges);
    };

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {bonusRanges.map((range, index) => (
          <Space key={index} style={{ width: '100%' }}>
            <InputNumber
              placeholder=">=最小值"
              min={0}
              precision={0}
              style={{ width: 100 }}
              value={range.min}
              onChange={(val) => updateRange(index, 'min', val || 0)}
            />
            <span>-</span>
            <InputNumber
              placeholder="<最大值"
              min={0}
              precision={0}
              style={{ width: 100 }}
              value={range.max}
              onChange={(val) => updateRange(index, 'max', val || 0)}
            />
            {unit && <span style={{ fontSize: 12, color: '#999' }}>{unit}</span>}
            <InputNumber
              placeholder="分数"
              min={0}
              precision={1}
              style={{ width: 100 }}
              addonAfter="分"
              value={range.score}
              onChange={(val) => updateRange(index, 'score', val || 0)}
            />
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeRange(index)}
            />
          </Space>
        ))}
        <Button type="dashed" onClick={addRange} block icon={<PlusOutlined />}>
          添加档次
        </Button>
      </Space>
    );
  };

  // 加分项学历档次设置组件
  const EducationBonusInput = () => {
    // 添加档次
    const addRange = () => {
      setEducationRanges([...educationRanges, { education: '', score: 0 }]);
    };

    // 删除档次
    const removeRange = (index: number) => {
      const newRanges = educationRanges.filter((_, i) => i !== index);
      setEducationRanges(newRanges);
    };

    // 更新档次
    const updateRange = (index: number, field: 'education' | 'score', value: string | number) => {
      const newRanges = [...educationRanges];
      newRanges[index][field] = value;
      setEducationRanges(newRanges);
    };

    // 获取已选择的学历，避免重复选择
    const selectedEducations = educationRanges.map(r => r.education);

    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        {educationRanges.map((range, index) => (
          <Space key={index} style={{ width: '100%' }}>
            <Select
              placeholder="请选择学历"
              style={{ width: 150 }}
              value={range.education || undefined}
              onChange={(val) => updateRange(index, 'education', val)}
            >
              {EDUCATION_OPTIONS.filter(opt => !selectedEducations.includes(opt.value) || opt.value === range.education).map(opt => (
                <Option key={opt.value} value={opt.value}>{opt.label}</Option>
              ))}
            </Select>
            <InputNumber
              placeholder="分数"
              min={0}
              precision={1}
              style={{ width: 100 }}
              addonAfter="分"
              value={range.score}
              onChange={(val) => updateRange(index, 'score', val || 0)}
            />
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => removeRange(index)}
            />
          </Space>
        ))}
        <Button type="dashed" onClick={addRange} block icon={<PlusOutlined />}>
          添加档次
        </Button>
      </Space>
    );
  };

  // 渲染指标类型的输入控件
  const renderIndicatorInput = (requirementType: 'mandatory' | 'bonus', indicatorType: string) => {
    switch (indicatorType) {
      case 'education':
        // 学历：硬性要求-单选，加分项使用档次设置
        if (requirementType === 'mandatory') {
          return (
            <Form.Item name="compare_value" rules={[{ required: true, message: '请选择学历' }]}>
              <Select placeholder="请选择学历">
                {EDUCATION_OPTIONS.map(opt => (
                  <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                ))}
              </Select>
            </Form.Item>
          );
        } else {
          return <EducationBonusInput />;
        }

      case 'major':
        // 专业：硬性要求和加分项都是多选，加分项需要分数
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item name="compare_value" rules={[{ required: true, message: '请选择专业' }]}>
              <TreeSelect
                multiple
                treeCheckable
                placeholder="请选择专业"
                treeData={majorTree}
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                style={{ width: '100%' }}
                maxTagCount="responsive"
              />
            </Form.Item>
            {requirementType === 'bonus' && (
              <Form.Item name="score_value" rules={[{ required: true, message: '请输入分数' }]}>
                <InputNumber placeholder="分数" min={0} precision={1} style={{ width: '100%' }} addonAfter="分" />
              </Form.Item>
            )}
          </Space>
        );

      case 'certificate':
        // 证书：硬性要求和加分项都是多选，加分项需要分数
        return (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item name="compare_value" rules={[{ required: true, message: '请选择证书' }]}>
              <TreeSelect
                multiple
                treeCheckable
                placeholder="请选择证书"
                treeData={certificateTree}
                showCheckedStrategy={TreeSelect.SHOW_CHILD}
                style={{ width: '100%' }}
                maxTagCount="responsive"
              />
            </Form.Item>
            {requirementType === 'bonus' && (
              <Form.Item name="score_value" rules={[{ required: true, message: '请输入分数' }]}>
                <InputNumber placeholder="分数" min={0} precision={1} style={{ width: '100%' }} addonAfter="分" />
              </Form.Item>
            )}
          </Space>
        );

      case 'experience':
        // 岗位经验年限：硬性要求 >= + 年限值；加分项使用档次设置
        if (requirementType === 'mandatory') {
          return (
            <Form.Item name="compare_value" rules={[{ required: true, message: '请输入年限' }]}>
              <InputNumber placeholder="年限" min={0} precision={0} style={{ width: '100%' }} addonAfter="年" />
            </Form.Item>
          );
        } else {
          return <BonusRangeInput unit="年" />;
        }

      default:
        // 其他指标：硬性要求（仅经验支持）；加分项使用档次设置
        if (requirementType === 'mandatory') {
          return null; // 其他指标不支持硬性要求
        } else {
          return <BonusRangeInput />;
        }
    }
  };

  // 渲染要求项显示文本
  const renderRequirementText = (item: RequirementItem) => {
    let text = '';

    // 解析 compare_value（可能是 JSON 字符串）
    let compareValue = item.compare_value;
    if (typeof compareValue === 'string' && (compareValue.startsWith('[') || compareValue.startsWith('{'))) {
      try {
        compareValue = JSON.parse(compareValue);
      } catch (e) {
        // 解析失败，保持原样
      }
    }

    // 判断是否为数值档次数据（加分项中的非专业/证书/学历类型）
    const isRangeData = item.requirement_type === 'bonus' &&
      item.indicator_type !== 'major' &&
      item.indicator_type !== 'certificate' &&
      item.indicator_type !== 'education' &&
      Array.isArray(compareValue) &&
      compareValue.length > 0 &&
      typeof compareValue[0] === 'object';

    // 判断是否为学历档次数据
    const isEducationRangeData = item.requirement_type === 'bonus' &&
      item.indicator_type === 'education' &&
      Array.isArray(compareValue) &&
      compareValue.length > 0 &&
      typeof compareValue[0] === 'object' &&
      'education' in compareValue[0];

    // 获取指标单位
    const getUnit = (indicatorType: string): string => {
      switch (indicatorType) {
        case 'experience': return '年';
        case 'performance_avg': return '分';
        case 'kpi_completion': return '%';
        case 'avg_tenure': return '年';
        default: return '';
      }
    };

    const unit = getUnit(item.indicator_type);

    switch (item.indicator_type) {
      case 'education':
        if (isEducationRangeData) {
          const rangeTexts = compareValue.map((r: any) => `${r.education}: +${r.score}分`);
          text = `学历：${rangeTexts.join('；')}`;
        } else if (typeof compareValue === 'string') {
          text = `学历：${compareValue}`;
        } else if (Array.isArray(compareValue)) {
          text = `学历：${compareValue.join('、')}`;
        }
        break;
      case 'major':
        if (Array.isArray(compareValue)) {
          const names = compareValue.map((id: any) => findNodeNameInTree(majorTree, id) || id);
          text = `专业：${names.join('、')}`;
        }
        break;
      case 'certificate':
        if (Array.isArray(compareValue)) {
          const names = compareValue.map((id: any) => findNodeNameInTree(certificateTree, id) || id);
          text = `证书：${names.join('、')}`;
        } else if (typeof compareValue === 'string' || typeof compareValue === 'number') {
          const name = findNodeNameInTree(certificateTree, compareValue);
          text = `证书：${name || compareValue}`;
        }
        break;
      case 'experience':
        if (isRangeData) {
          const rangeTexts = compareValue.map((r: any) => {
            const min = r.min !== undefined && r.min !== null ? `>=${r.min}` : '';
            const max = r.max !== undefined && r.max !== null ? `<${r.max}` : '';
            const condition = [min, max].filter(Boolean).join(' 且 ');
            return `${condition}${unit}: +${r.score}分`;
          });
          text = `经验年限：${rangeTexts.join('；')}`;
        } else {
          text = `经验年限：\u003E= ${compareValue}${unit}`;
        }
        break;
      case 'performance_avg':
        if (isRangeData) {
          const rangeTexts = compareValue.map((r: any) => {
            const min = r.min !== undefined && r.min !== null ? `>=${r.min}` : '';
            const max = r.max !== undefined && r.max !== null ? `<${r.max}` : '';
            const condition = [min, max].filter(Boolean).join(' 且 ');
            return `${condition}${unit}: +${r.score}分`;
          });
          text = `绩效平均分：${rangeTexts.join('；')}`;
        } else {
          text = `绩效平均分：${item.operator} ${compareValue}`;
        }
        break;
      case 'kpi_completion':
        if (isRangeData) {
          const rangeTexts = compareValue.map((r: any) => {
            const min = r.min !== undefined && r.min !== null ? `>=${r.min}` : '';
            const max = r.max !== undefined && r.max !== null ? `<${r.max}` : '';
            const condition = [min, max].filter(Boolean).join(' 且 ');
            return `${condition}${unit}: +${r.score}分`;
          });
          text = `KPI达成率：${rangeTexts.join('；')}`;
        } else {
          text = `KPI达成率：${item.operator} ${compareValue}%`;
        }
        break;
      case 'avg_tenure':
        if (isRangeData) {
          const rangeTexts = compareValue.map((r: any) => {
            const min = r.min !== undefined && r.min !== null ? `>=${r.min}` : '';
            const max = r.max !== undefined && r.max !== null ? `<${r.max}` : '';
            const condition = [min, max].filter(Boolean).join(' 且 ');
            return `${condition}${unit}: +${r.score}分`;
          });
          text = `平均任职年限：${rangeTexts.join('；')}`;
        } else {
          text = `平均任职年限：${item.operator} ${compareValue}年`;
        }
        break;
      case 'job_hopping_freq':
        if (isRangeData) {
          const rangeTexts = compareValue.map((r: any) => {
            const min = r.min !== undefined && r.min !== null ? `>=${r.min}` : '';
            const max = r.max !== undefined && r.max !== null ? `<${r.max}` : '';
            const condition = [min, max].filter(Boolean).join(' 且 ');
            return `${condition}: +${r.score}分`;
          });
          text = `跳槽频率：${rangeTexts.join('；')}`;
        } else {
          text = `跳槽频率：${item.operator} ${compareValue}`;
        }
        break;
      case 'project_count':
        if (isRangeData) {
          const rangeTexts = compareValue.map((r: any) => {
            const min = r.min !== undefined && r.min !== null ? `>=${r.min}` : '';
            const max = r.max !== undefined && r.max !== null ? `<${r.max}` : '';
            const condition = [min, max].filter(Boolean).join(' 且 ');
            return `${condition}个: +${r.score}分`;
          });
          text = `项目经验数：${rangeTexts.join('；')}`;
        } else {
          text = `项目经验数：${item.operator} ${compareValue}`;
        }
        break;
      default:
        if (isRangeData) {
          const rangeTexts = compareValue.map((r: any) => {
            const min = r.min !== undefined && r.min !== null ? `>=${r.min}` : '';
            const max = r.max !== undefined && r.max !== null ? `<${r.max}` : '';
            const condition = [min, max].filter(Boolean).join(' 且 ');
            return `${condition}${unit}: +${r.score}分`;
          });
          text = `${INDICATOR_TYPE_LABELS[item.indicator_type] || item.indicator_type}：${rangeTexts.join('；')}`;
        } else {
          text = `${item.indicator_type}：${compareValue}`;
        }
    }

    // 对于非档次数据，显示分数
    if (!isRangeData && item.score_value !== undefined && item.score_value !== null) {
      text += ` (+${item.score_value}分)`;
    }

    return text;
  };

  if (!data) {
    return (
      <div className="detail-loading">
        <LoadingOutlined style={{ fontSize: 48, color: '#d4af37' }} />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="position-detail-page">
      {/* 返回按钮 */}
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
        title="返回"
      >
        <ArrowLeftOutlined />
      </button>

      {/* 主内容区域 */}
      <div className="detail-content">
        {/* 头部信息卡片 */}
        <div className="profile-header-card">
          <div className="profile-avatar">
            <TrophyOutlined />
          </div>
          <div className="profile-info">
            <h1 className="profile-name">{data.position_name}</h1>
            <div className="profile-tags">
              <span className={`status-tag ${data.status === 1 ? 'active' : 'inactive'}`}>
                {data.status === 1 ? '启用中' : '已停用'}
              </span>
            </div>
          </div>
        </div>

        {/* 信息卡片网格 */}
        <div className="info-grid">
          {/* 基本信息 */}
          <div className="info-card basic-info-card">
            <div className="card-header">
              <TrophyOutlined className="card-icon" />
              <h3 className="card-title">基本信息</h3>
              <button
                className="add-btn"
                onClick={() => navigate(`/position/${id}/edit`)}
              >
                <EditOutlined /> 编辑
              </button>
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="info-label">岗位名称</span>
                <span className="info-value">{data.position_name}</span>
              </div>
              {data.responsibility && (
                <div className="info-row">
                  <span className="info-label">岗位职责</span>
                  <span className="info-value info-value-text">{data.responsibility}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">当前状态</span>
                <span className="info-value">
                  <span className={`status-indicator ${data.status === 1 ? 'active' : 'inactive'}`}>
                    {data.status === 1 ? '启用' : '停用'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* 岗位配置 */}
          <div className="info-card config-card">
            <div className="card-body config-card-body">
              <Tabs
                items={[
                  {
                    key: '1',
                    label: '能力权重',
                    children: (
                      <div className="tab-content">
                        <div className="tab-header">
                          <div className="tab-description">设置岗位各能力维度的权重分配</div>
                          <button className="add-btn" onClick={handleWeightEdit}>
                            <SettingOutlined /> 设置权重
                          </button>
                        </div>
                        {weightData.length > 0 ? (
                          <Table
                            columns={[
                              { title: '能力维度', dataIndex: 'ability_dimension', key: 'ability_dimension' },
                              {
                                title: '权重',
                                dataIndex: 'weight',
                                key: 'weight',
                                render: (weight: number) => (
                                  <span className="weight-value">{weight}%</span>
                                ),
                              },
                            ]}
                            dataSource={ABILITY_DIMENSION_LIST.map(dimension => ({
                              ability_dimension: dimension,
                              weight: weightData.find((w: any) => w.ability_dimension === dimension)?.weight || 0,
                              key: dimension
                            }))}
                            rowKey="key"
                            pagination={false}
                            size="small"
                            className="config-table"
                          />
                        ) : (
                          <div className="empty-state">
                            <BulbOutlined />
                            <p>暂无能力权重数据</p>
                          </div>
                        )}
                      </div>
                    ),
                  },
                  {
                    key: '2',
                    label: '岗位要求',
                    children: (
                      <div className="tab-content">
                        <div className="tab-header">
                          <div className="tab-description">设置岗位的硬性要求和加分项</div>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAddRequirement}
                          >
                            添加要求
                          </Button>
                        </div>
                        {requirementData.length > 0 ? (
                          <Table
                            columns={[
                              {
                                title: '要求分类',
                                dataIndex: 'requirement_type',
                                key: 'requirement_type',
                                render: (type: string) => (
                                  <Tag color={type === 'mandatory' ? 'red' : 'green'}>
                                    {REQUIREMENT_TYPE_LABELS[type] || type}
                                  </Tag>
                                )
                              },
                              {
                                title: '指标类型',
                                dataIndex: 'indicator_type',
                                key: 'indicator_type',
                                render: (type: string) => INDICATOR_TYPE_LABELS[type] || type
                              },
                              {
                                title: '要求内容',
                                key: 'content',
                                render: (_, record: RequirementItem) => renderRequirementText(record)
                              },
                              {
                                title: '操作',
                                key: 'action',
                                render: (_: any, record: RequirementItem, index: number) => (
                                  <Space size={4}>
                                    <Button
                                      type="link"
                                      size="small"
                                      onClick={() => handleEditRequirement(index)}
                                    >
                                      <EditOutlined />
                                    </Button>
                                    <Popconfirm
                                      title="确定要删除这条要求吗？"
                                      onConfirm={() => handleDeleteRequirement(index)}
                                      okText="确定"
                                      cancelText="取消"
                                    >
                                      <Button type="link" danger size="small">
                                        <DeleteOutlined />
                                      </Button>
                                    </Popconfirm>
                                  </Space>
                                )
                              },
                            ]}
                            dataSource={requirementData.map((item, index) => ({ ...item, key: index }))}
                            pagination={false}
                            size="small"
                            className="config-table"
                            scroll={{ y: 350 }}
                          />
                        ) : (
                          <div className="empty-state">
                            <BulbOutlined />
                            <p>暂无岗位要求数据，点击上方"添加要求"按钮添加</p>
                          </div>
                        )}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 能力权重设置Modal */}
      <Modal
        title="设置能力权重"
        open={weightModalVisible}
        onCancel={() => {
          setWeightModalVisible(false);
          weightForm.resetFields();
        }}
        onOk={handleWeightSubmit}
        width={600}
        okText="保存"
        confirmLoading={weightSubmitting}
        className="modern-modal"
      >
        <div className="modal-description">
          请为每个能力维度设置权重（0-100），所有维度权重总和必须为 100%
        </div>
        <Form form={weightForm} layout="vertical">
          {ABILITY_DIMENSION_LIST.map((dimension) => (
            <div key={dimension} className="weight-form-item">
              <div className="weight-label">{dimension}</div>
              <Form.Item
                name={dimension}
                rules={[{ required: true, message: '必填' }]}
                style={{ margin: 0 }}
              >
                <InputNumber min={0} max={100} placeholder="0-100" style={{ width: '100%' }} />
              </Form.Item>
            </div>
          ))}
        </Form>
      </Modal>

      {/* 添加/编辑岗位要求Modal */}
      <Modal
        title={editingRequirementIndex !== null ? '编辑岗位要求' : '添加岗位要求'}
        open={requirementModalVisible}
        onCancel={() => {
          setRequirementModalVisible(false);
          setEditingRequirementIndex(null);
          setBonusRanges([]);
          setEducationRanges([]);
          requirementForm.resetFields();
        }}
        onOk={handleRequirementSubmit}
        width={600}
        okText="确定"
        confirmLoading={requirementSubmitting}
        className="modern-modal"
      >
        <Form form={requirementForm} layout="vertical">
          <Form.Item
            name="requirement_type"
            label="要求分类"
            rules={[{ required: true, message: '请选择要求分类' }]}
          >
            <Select
              placeholder="请选择要求分类"
              onChange={(value) => {
                setSelectedReqType(value);
                setBonusRanges([]);
                setEducationRanges([]);
                // 重置指标类型和比较值
                const indicators = INDICATOR_TYPES[value] || [];
                if (indicators.length > 0) {
                  setSelectedIndicatorType(indicators[0].value);
                  requirementForm.setFieldsValue({
                    indicator_type: indicators[0].value,
                    compare_value: undefined,
                    score_value: undefined,
                  });
                }
              }}
            >
              {REQUIREMENT_TYPES.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="indicator_type"
            label="指标类型"
            rules={[{ required: true, message: '请选择指标类型' }]}
          >
            <Select
              placeholder="请选择指标类型"
              onChange={(value) => {
                setSelectedIndicatorType(value);
                setBonusRanges([]);
                setEducationRanges([]);
                // 重置比较值
                requirementForm.setFieldsValue({
                  compare_value: undefined,
                  score_value: undefined,
                });
              }}
            >
              {INDICATOR_TYPES[selectedReqType]?.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="operator" style={{ display: 'none' }}>
            <Input />
          </Form.Item>

          {renderIndicatorInput(selectedReqType, selectedIndicatorType)}
        </Form>
      </Modal>
    </div>
  );
};

export default PositionDetail;
