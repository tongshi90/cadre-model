import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Modal, Form, Input, InputNumber, Select, message, Tabs, Table } from 'antd';
import { ArrowLeftOutlined, EditOutlined, TrophyOutlined, SettingOutlined, BulbOutlined, LoadingOutlined } from '@ant-design/icons';
import apiClient from '@/utils/request';
import { positionApi } from '@/services/positionApi';
import type { PositionInfo } from '@/types';
import { ABILITY_DIMENSION_LIST } from '@/utils/abilityConstants';
import './Detail.css';

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
  const [requirementData, setRequirementData] = useState<any[]>([]);
  const [requirementModalVisible, setRequirementModalVisible] = useState(false);
  const [requirementForm] = Form.useForm();
  const [requirementSubmitting, setRequirementSubmitting] = useState(false);

  // 使用 ref 追踪是否已加载数据，避免重复请求
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // 只有当 id 改变时才重新获取数据
    if (hasFetchedRef.current) return;

    fetchData();
    fetchWeightData();
    fetchRequirementData();
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
  const fetchRequirementData = async () => {
    if (!id) return;
    try {
      const response = await apiClient.get(`/positions/${id}/requirements`);

      // 后端返回格式：{ mandatory: [...], suggested: [...] }
      const mandatory = response.data.data?.mandatory || [];
      const suggested = response.data.data?.suggested || [];

      // 转换为前端格式
      const requirements = [...mandatory, ...suggested];

      // 回填表单数据
      const formData: any = {};
      requirements.forEach((item: any) => {
        // 根据 requirement_item 映射回前端类型
        const typeMap: any = {
          'education': 'education',
          'experience': 'experience',
          'certificate': 'certificate',
          'age': 'age',
          'political_status': 'political_status',
          'other': 'other',
        };
        const type = typeMap[item.requirement_item] || item.requirement_item;
        formData[type] = {
          requirement_value: item.requirement_value,
          is_mandatory: item.requirement_type === 'mandatory' ? 1 : 0,
        };
      });
      requirementForm.setFieldsValue(formData);
      setRequirementData(requirements);
    } catch (error) {
      console.error('Failed to fetch requirement data:', error);
    }
  };

  const handleRequirementEdit = () => {
    setRequirementModalVisible(true);
  };

  const handleRequirementSubmit = async () => {
    if (!id) return;
    setRequirementSubmitting(true);
    try {
      const values = await requirementForm.validateFields();

      // 构建提交数据
      const requirements: any[] = [];
      Object.entries(values).forEach(([type, value]: [string, any]) => {
        if (value && value.requirement_value) {
          requirements.push({
            requirement_type: type,
            requirement_value: value.requirement_value,
            is_mandatory: value.is_mandatory || 0,
          });
        }
      });

      if (requirements.length === 0) {
        message.error('请至少设置一项岗位要求');
        setRequirementSubmitting(false);
        return;
      }

      await apiClient.put(`/positions/${id}/requirements`, { requirements });
      message.success('保存成功');
      setRequirementModalVisible(false);
      fetchRequirementData();
    } catch (error) {
      message.error('保存失败');
      console.error('Failed to save requirement:', error);
    } finally {
      setRequirementSubmitting(false);
    }
  };

  // 岗位要求类型
  const REQUIREMENT_TYPES = [
    { value: 'education', label: '学历要求' },
    { value: 'experience', label: '工作经验' },
    { value: 'certificate', label: '资格证书' },
    { value: 'age', label: '年龄要求' },
    { value: 'political_status', label: '政治面貌' },
    { value: 'other', label: '其他要求' },
  ];

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
                          <div className="tab-description">设置岗位的硬性要求和建议要求</div>
                          <button className="add-btn" onClick={handleRequirementEdit}>
                            <SettingOutlined /> 设置要求
                          </button>
                        </div>
                        {requirementData.length > 0 ? (
                          <Table
                            columns={[
                              {
                                title: '要求类型',
                                dataIndex: 'requirement_type',
                                key: 'requirement_type',
                                render: (type: string) => REQUIREMENT_TYPES.find(t => t.value === type)?.label || type
                              },
                              { title: '要求内容', dataIndex: 'requirement_value', key: 'requirement_value' },
                              {
                                title: '类型',
                                dataIndex: 'is_mandatory',
                                key: 'is_mandatory',
                                render: (isMandatory: number) => (
                                  <span className={`requirement-type ${isMandatory === 1 ? 'mandatory' : 'suggested'}`}>
                                    {isMandatory === 1 ? '硬性' : '建议'}
                                  </span>
                                ),
                              },
                            ]}
                            dataSource={requirementData}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            className="config-table"
                          />
                        ) : (
                          <div className="empty-state">
                            <BulbOutlined />
                            <p>暂无岗位要求数据</p>
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

      {/* 岗位要求设置Modal */}
      <Modal
        title="设置岗位要求"
        open={requirementModalVisible}
        onCancel={() => {
          setRequirementModalVisible(false);
        }}
        onOk={handleRequirementSubmit}
        width={700}
        okText="保存"
        confirmLoading={requirementSubmitting}
        className="modern-modal"
      >
        <Form form={requirementForm} layout="vertical">
          {REQUIREMENT_TYPES.map((type) => (
            <div key={type.value} className="requirement-form-item">
              <div className="requirement-type-label">{type.label}</div>
              <div className="requirement-form-fields">
                <Form.Item
                  name={[type.value, 'requirement_value']}
                  label="要求内容"
                  style={{ marginBottom: 0, flex: 2 }}
                >
                  <Input placeholder={`请输入${type.label}`} />
                </Form.Item>
                <Form.Item
                  name={[type.value, 'is_mandatory']}
                  label="要求类型"
                  style={{ marginBottom: 0, flex: 1 }}
                >
                  <Select placeholder="请选择">
                    <Select.Option value={1}>硬性要求</Select.Option>
                    <Select.Option value={0}>建议要求</Select.Option>
                  </Select>
                </Form.Item>
              </div>
            </div>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default PositionDetail;
