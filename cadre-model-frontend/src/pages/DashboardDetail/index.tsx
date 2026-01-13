import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftOutlined,
  BarChartOutlined,
  SafetyOutlined,
  TeamOutlined,
  TrophyOutlined,
  RocketOutlined,
  UserOutlined,
  ApartmentOutlined,
  CaretRightOutlined,
} from '@ant-design/icons';
import { Table, Tag, Empty, Collapse } from 'antd';
import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { matchApi } from '@/services/matchApi';
import type { MatchStatistics, PyramidStatistics, MatchResult } from '@/types';
import './index.css';

type DetailType = 'match-overall' | 'match-key' | 'pyramid' | 'risk' | 'quality' | 'source' | 'flow';
type MatchLevel = 'excellent' | 'qualified' | 'unqualified';

const detailTitles: Record<DetailType, string> = {
  'match-overall': '全员匹配详情',
  'match-key': '关键岗位匹配详情',
  'pyramid': '干部梯队与年龄结构详情',
  'risk': '岗位风险详情',
  'quality': '干部质量画像详情',
  'source': '干部来源分布详情',
  'flow': '流动趋势详情（近5年）',
};

const levelLabels: Record<MatchLevel, string> = {
  excellent: '优质匹配',
  qualified: '合格匹配',
  unqualified: '不合格匹配'
};

const levelColors: Record<MatchLevel, string> = {
  excellent: '#4ade80',
  qualified: '#60a5fa',
  unqualified: '#f87171'
};

const DashboardDetail = () => {
  const navigate = useNavigate();
  const { type } = useParams<{ type: DetailType }>();
  const chartRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<MatchLevel>('excellent');
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);

  const [matchStatistics, setMatchStatistics] = useState<MatchStatistics>({
    overall: {
      total_count: 0,
      avg_score: 0,
      level_distribution: {
        excellent: { count: 0, percentage: 0 },
        qualified: { count: 0, percentage: 0 },
        unqualified: { count: 0, percentage: 0 }
      }
    },
    key_position: {
      total_count: 0,
      avg_score: 0,
      level_distribution: {
        excellent: { count: 0, percentage: 0 },
        qualified: { count: 0, percentage: 0 },
        unqualified: { count: 0, percentage: 0 }
      }
    }
  });

  const [pyramidStatistics, setPyramidStatistics] = useState<PyramidStatistics>({
    levels: ['战略层', '经营层', '中层', '基层'],
    data: {
      '战略层': {
        label: '战略层',
        total: 0,
        age_distribution: {
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0, personnel: [] },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0, personnel: [] },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0, personnel: [] },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0, personnel: [] }
        }
      },
      '经营层': {
        label: '经营层',
        total: 0,
        age_distribution: {
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0, personnel: [] },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0, personnel: [] },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0, personnel: [] },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0, personnel: [] }
        }
      },
      '中层': {
        label: '中层',
        total: 0,
        age_distribution: {
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0, personnel: [] },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0, personnel: [] },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0, personnel: [] },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0, personnel: [] }
        }
      },
      '基层': {
        label: '基层',
        total: 0,
        age_distribution: {
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0, personnel: [] },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0, personnel: [] },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0, personnel: [] },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0, personnel: [] }
        }
      }
    },
    total_count: 0
  });

  const [riskData, setRiskData] = useState<any[]>([]);
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [sourceAndFlowData, setSourceAndFlowData] = useState<any>({
    total_count: 0,
    source_distribution: {
      internal: { count: 0, percentage: 0, label: '内部培养' },
      external: { count: 0, percentage: 0, label: '外部引进' }
    },
    source_by_level: [],
    flow_trend: []
  });

  // 流动干部详情数据
  const [flowCadresData, setFlowCadresData] = useState<{
    total: number;
    cadres: any[];
  }>({
    total: 0,
    cadres: []
  });
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const [selectedSourceType, setSelectedSourceType] = useState<string | undefined>(undefined);
  const [selectedManagementLevel, setSelectedManagementLevel] = useState<string | undefined>(undefined);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 根据当前页面类型决定使用哪个 API
        const pyramidApiCall = type === 'pyramid'
          ? matchApi.getAgeStructureDetails()
          : matchApi.getAgeStructure();

        const [matchStats, pyramidStats, risk, quality, sourceFlow, matchResults, flowCadres] = await Promise.all([
          matchApi.getStatistics(),
          pyramidApiCall,
          matchApi.getPositionRisk(),
          matchApi.getQualityPortrait(),
          matchApi.getSourceAndFlow(),
          matchApi.getCurrentPositionResults(),
          matchApi.getFlowCadresDetails(),
        ]);

        if (matchStats.data?.data) setMatchStatistics(matchStats.data.data);
        if (pyramidStats.data?.data) setPyramidStatistics(pyramidStats.data.data);
        if (risk.data?.data) setRiskData(risk.data.data);
        if (quality.data?.data) setQualityData(quality.data.data);
        if (sourceFlow.data?.data) setSourceAndFlowData(sourceFlow.data.data);
        if (matchResults.data?.data) setMatchResults(matchResults.data.data);
        if (flowCadres.data?.data) setFlowCadresData(flowCadres.data.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  // 饼图点击事件
  const handleChartClick = (params: any) => {
    const levelMap: Record<string, MatchLevel> = {
      '优质匹配': 'excellent',
      '合格匹配': 'qualified',
      '不合格匹配': 'unqualified'
    };
    const level = levelMap[params.name];
    if (level) {
      setSelectedLevel(level);
    }
  };

  const onChartEvents = {
    click: handleChartClick,
  };

  // 渲染匹配态势详情
  const renderMatchDetail = (data: any) => {
    // 饼图数据 - 保留所有等级，即使count为0
    const pieData = [
      { value: data.level_distribution.excellent.count, name: levelLabels.excellent, itemStyle: { color: levelColors.excellent } },
      { value: data.level_distribution.qualified.count, name: levelLabels.qualified, itemStyle: { color: levelColors.qualified } },
      { value: data.level_distribution.unqualified.count, name: levelLabels.unqualified, itemStyle: { color: levelColors.unqualified } },
    ];

    const pieOption: EChartsOption = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(19, 23, 41, 0.95)',
        borderColor: 'rgba(212, 175, 55, 0.3)',
        textStyle: { color: '#e0e0e0' },
        formatter: '{b}: {c}人 ({d}%)'
      },
      legend: {
        bottom: '0%',
        left: 'center',
        textStyle: { color: '#a0a0a0', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12,
        data: [levelLabels.excellent, levelLabels.qualified, levelLabels.unqualified],
      },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '55%'],
          avoidLabelOverlap: false,
          data: pieData,
          label: {
            color: '#a0a0a0',
            fontSize: 12,
            formatter: (params: any) => {
              return '{b|' + params.name + '}\n{c|' + params.value + '人}\n{d|(' + params.percent + '%)}';
            },
            rich: {
              b: {
                fontSize: 12,
                color: '#a0a0a0',
              },
              c: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#e0e0e0',
              },
              d: {
                fontSize: 11,
                color: '#808080',
              }
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            }
          },
          itemStyle: {
            borderRadius: 6,
            borderColor: '#131729',
            borderWidth: 2,
          },
        },
      ],
    };

    // 筛选选中等级的人员
    const filteredResults = matchResults.filter(r => r.match_level === selectedLevel);

    // 人员列表列定义
    const personnelColumns = [
      {
        title: '姓名',
        dataIndex: ['cadre', 'name'],
        key: 'name',
        width: 90,
        render: (name: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserOutlined style={{ color: '#d4af37', fontSize: '12px' }} />
            <span className="cell-title">{name}</span>
          </div>
        )
      },
      {
        title: '工号',
        dataIndex: ['cadre', 'employee_no'],
        key: 'employee_no',
        width: 85,
      },
      {
        title: '部门',
        dataIndex: ['cadre', 'department', 'name'],
        key: 'department',
        width: 110,
        render: (text: string) => <span className="cell-ellipsis">{text || '-'}</span>
      },
      {
        title: '岗位',
        dataIndex: ['position', 'position_name'],
        key: 'position',
        width: 130,
        render: (text: string) => <span className="cell-ellipsis">{text || '-'}</span>
      },
      {
        title: '匹配分',
        dataIndex: 'final_score',
        key: 'final_score',
        width: 75,
        align: 'center' as const,
        render: (score: number) => (
          <span className={`score-badge ${score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'}`}>
            {score?.toFixed(1) || '-'}
          </span>
        )
      },
      {
        title: '基础分',
        dataIndex: 'base_score',
        key: 'base_score',
        width: 75,
        align: 'center' as const,
        render: (score: number) => <span className="count-small">{score?.toFixed(1) || '-'}</span>
      },
      {
        title: '扣分',
        dataIndex: 'deduction_score',
        key: 'deduction_score',
        width: 65,
        align: 'center' as const,
        render: (score: number) => (
          <span className="count-small" style={{ color: score > 0 ? '#f87171' : 'inherit' }}>
            {score > 0 ? `-${score.toFixed(1)}` : '-'}
          </span>
        )
      },
    ];

    return (
      <div className="detail-content">
        {/* 统计卡片 */}
        <div className="detail-stats-compact">
          <div className="detail-stat-item">
            <span className="detail-stat-label">总人数</span>
            <span className="detail-stat-value">{data.total_count}</span>
          </div>
          <div className="detail-stat-divider"></div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">平均分</span>
            <span className="detail-stat-value gold">{data.avg_score}</span>
          </div>
          <div className="detail-stat-divider"></div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">优质</span>
            <span className="detail-stat-value" style={{ color: levelColors.excellent }}>
              {data.level_distribution.excellent.count}
            </span>
          </div>
          <div className="detail-stat-divider"></div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">合格</span>
            <span className="detail-stat-value" style={{ color: levelColors.qualified }}>
              {data.level_distribution.qualified.count}
            </span>
          </div>
          <div className="detail-stat-divider"></div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">不合格</span>
            <span className="detail-stat-value" style={{ color: levelColors.unqualified }}>
              {data.level_distribution.unqualified.count}
            </span>
          </div>
        </div>

        {/* 图表和人员列表 */}
        <div className="detail-grid-2col detail-grid-match">
          {/* 饼图 */}
          <div className="detail-chart-box detail-chart-narrow">
            <h4 className="detail-box-title">匹配等级分布</h4>
            <div className="chart-hint">点击图表区域查看对应人员</div>
            <ReactECharts
              ref={chartRef}
              option={pieOption}
              style={{ height: '320px' }}
              onEvents={onChartEvents}
            />
          </div>

          {/* 人员列表 */}
          <div className="detail-personnel-box detail-personnel-wide">
            <div className="detail-personnel-header">
              <h4 className="detail-box-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
                {levelLabels[selectedLevel]}人员列表
              </h4>
              <span className="personnel-count-badge" style={{ backgroundColor: levelColors[selectedLevel] + '30', color: levelColors[selectedLevel] }}>
                {filteredResults.length}人
              </span>
            </div>
            <div className="detail-personnel-table">
              {filteredResults.length > 0 ? (
                <Table
                  columns={personnelColumns}
                  dataSource={filteredResults}
                  rowKey="id"
                  pagination={{ pageSize: 10, size: 'small' }}
                  className="detail-table"
                  loading={loading}
                  size="small"
                  scroll={{ y: 430 }}
                />
              ) : (
                <Empty description="暂无人员数据" style={{ margin: '60px 0' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 渲染梯队结构详情
  const renderPyramidDetail = () => {
    const ageKeys = ['le_35', '36_45', '46_55', 'ge_56'] as const;
    const ageLabels: Record<string, string> = {
      le_35: '≤35岁',
      '36_45': '36-45岁',
      '46_55': '46-55岁',
      ge_56: '≥56岁'
    };

    // 人员列表表格列定义
    const personnelColumns = [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 90,
        render: (name: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserOutlined style={{ color: '#d4af37', fontSize: '12px' }} />
            <span className="cell-title">{name}</span>
          </div>
        )
      },
      {
        title: '工号',
        dataIndex: 'employee_no',
        key: 'employee_no',
        width: 85,
      },
      {
        title: '性别',
        dataIndex: 'gender',
        key: 'gender',
        width: 50,
        align: 'center' as const,
        render: (gender: string) => gender === '男' ? '男' : gender === '女' ? '女' : '-'
      },
      {
        title: '年龄',
        dataIndex: 'age',
        key: 'age',
        width: 60,
        align: 'center' as const,
        render: (age: number) => <span className="count-small">{age}岁</span>
      },
      {
        title: '部门',
        key: 'department',
        width: 120,
        render: (_: any, record: any) => record.department?.name || '-'
      },
      {
        title: '岗位',
        key: 'position',
        width: 140,
        render: (_: any, record: any) => record.position?.name || '-'
      },
      {
        title: '职级',
        dataIndex: 'job_grade',
        key: 'job_grade',
        width: 60,
        align: 'center' as const,
        render: (grade: number) => grade || '-'
      },
      {
        title: '学历',
        dataIndex: 'education',
        key: 'education',
        width: 80,
        align: 'center' as const,
        render: (edu: string) => edu || '-'
      },
    ];

    // 构建折叠面板数据
    const collapseItems = pyramidStatistics.levels.map(levelKey => {
      const levelData = pyramidStatistics.data[levelKey];
      if (!levelData || levelData.total === 0) return null;

      // 构建年龄组折叠项
      const ageGroupItems = ageKeys.map(ageKey => {
        const ageData = levelData.age_distribution[ageKey];
        const hasPersonnel = ageData.personnel && ageData.personnel.length > 0;

        if (!hasPersonnel) return null;

        return {
          key: ageKey,
          label: (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    backgroundColor: ageData.color,
                  }}
                />
                {ageLabels[ageKey]}
              </span>
              <span style={{ color: ageData.color, fontWeight: 600 }}>
                {ageData.count}人 ({ageData.percentage}%)
              </span>
            </div>
          ),
          children: (
            <div className="pyramid-personnel-table">
              <Table
                columns={personnelColumns}
                dataSource={ageData.personnel}
                rowKey="id"
                pagination={{ pageSize: 10, size: 'small' }}
                className="detail-table"
                size="small"
                scroll={{ y: 300 }}
              />
            </div>
          ),
        };
      }).filter(Boolean);

      return {
        key: levelKey,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600 }}>
            <ApartmentOutlined style={{ color: '#d4af37' }} />
            <span>{levelData.label}</span>
            <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
              共 {levelData.total} 人
            </span>
          </div>
        ),
        children: (
          <div className="pyramid-level-content">
            {/* 人员详情 - 按年龄段分组 */}
            {ageGroupItems.length > 0 && (
              <div className="pyramid-personnel-section">
                <h5 className="pyramid-personnel-title">人员详情（按年龄段）</h5>
                <Collapse
                  items={ageGroupItems}
                  defaultActiveKey={[]}
                  bordered={false}
                  className="pyramid-collapse"
                  expandIcon={({ isActive }) => (
                    <CaretRightOutlined
                      rotate={isActive ? 90 : 0}
                      style={{ color: 'var(--color-accent-gold)' }}
                    />
                  )}
                />
              </div>
            )}
          </div>
        ),
      };
    }).filter(Boolean);

    return (
      <div className="detail-content">
        {/* 统计卡片 */}
        <div className="detail-stats-compact">
          <div className="detail-stat-item">
            <span className="detail-stat-label">干部总数</span>
            <span className="detail-stat-value">{pyramidStatistics.total_count}</span>
          </div>
          <div className="detail-stat-divider"></div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">管理层级</span>
            <span className="detail-stat-value">{pyramidStatistics.levels.length}</span>
          </div>
        </div>

        {/* 按层级折叠展示 */}
        <Collapse
          items={collapseItems}
          defaultActiveKey={[]}
          className="pyramid-level-collapse"
          bordered={false}
          expandIcon={({ isActive }) => (
            <CaretRightOutlined
              rotate={isActive ? 90 : 0}
              style={{ color: 'var(--color-accent-gold)', fontSize: '14px' }}
            />
          )}
        />
      </div>
    );
  };

  // 渲染风险分析详情
  const renderRiskDetail = () => {
    const getRiskLevelColor = (level: string) => {
      switch (level) {
        case 'high': return '#ef4444';
        case 'medium': return '#f59e0b';
        case 'low': return '#22c55e';
        default: return '#6b7280';
      }
    };

    const getRiskLevelLabel = (level: string) => {
      switch (level) {
        case 'high': return '高风险';
        case 'medium': return '中风险';
        case 'low': return '低风险';
        default: return '未知';
      }
    };

    const columns = [
      {
        title: '岗位',
        dataIndex: 'position_name',
        key: 'position_name',
        width: 180,
        render: (text: string, record: any) => (
          <div>
            <div className="cell-title">{text}</div>
            <div className="cell-subtitle">{record.position_code}</div>
          </div>
        )
      },
      {
        title: '关键岗位',
        dataIndex: 'is_key_position',
        key: 'is_key_position',
        width: 100,
        align: 'center' as const,
        render: (isKey: boolean) => (
          <span className={isKey ? 'count-badge' : ''} style={{ color: isKey ? '#d4af37' : 'var(--color-text-tertiary)' }}>
            {isKey ? '是' : '否'}
          </span>
        )
      },
      {
        title: '任职者',
        key: 'incumbent',
        width: 100,
        render: (_: any, record: any) => {
          if (record.incumbent) {
            return (
              <div>
                <div className="cell-title">{record.incumbent.name}</div>
                {record.incumbent.age && <div className="cell-subtitle">{record.incumbent.age}岁</div>}
              </div>
            );
          }
          return <Tag color="purple" style={{ fontSize: '11px' }}>空缺</Tag>;
        }
      },
      {
        title: '风险因子',
        key: 'risks',
        render: (_: any, record: any) => (
          <div className="risk-factors-compact">
            {record.risks.low_match && <Tag color="red" style={{ fontSize: '11px' }}>匹配低</Tag>}
            {record.risks.age_risk && <Tag color="orange" style={{ fontSize: '11px' }}>年龄</Tag>}
            {record.risks.single_point && <Tag color="gold" style={{ fontSize: '11px' }}>单点</Tag>}
            {record.risks.no_training && <Tag color="lime" style={{ fontSize: '11px' }}>无培养</Tag>}
            {record.risks.long_term && <Tag color="cyan" style={{ fontSize: '11px' }}>任期长</Tag>}
            {record.risk_count === 0 && <span style={{ color: '#22c55e', fontSize: '12px' }}>无风险</span>}
          </div>
        )
      },
      {
        title: '等级',
        dataIndex: 'risk_level',
        key: 'risk_level',
        width: 80,
        align: 'center' as const,
        render: (level: string) => (
          <span
            className="risk-level-badge"
            style={{ backgroundColor: getRiskLevelColor(level) }}
          >
            {getRiskLevelLabel(level)}
          </span>
        )
      },
    ];

    return (
      <div className="detail-content">
        <div className="detail-table-compact">
          <Table
            columns={columns}
            dataSource={riskData}
            rowKey="position_id"
            pagination={{ pageSize: 15, size: 'small' }}
            className="detail-table"
            loading={loading}
            size="small"
          />
        </div>
      </div>
    );
  };

  // 渲染质量画像详情
  const renderQualityDetail = () => {
    const getQualityTypeInfo = (type: string) => {
      switch (type) {
        case 'star':
          return { label: '明星干部', color: '#ef4444', tag: 'red' };
        case 'potential':
          return { label: '潜力干部', color: '#22c55e', tag: 'green' };
        case 'stable':
          return { label: '稳健干部', color: '#3b82f6', tag: 'blue' };
        case 'adjust':
          return { label: '需调整', color: '#94a3b8', tag: 'default' };
        default:
          return { label: '未知', color: '#6b7280', tag: 'default' };
      }
    };

    const columns = [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 90,
        render: (text: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserOutlined style={{ color: '#d4af37', fontSize: '12px' }} />
            <span className="cell-title">{text}</span>
          </div>
        )
      },
      {
        title: '工号',
        dataIndex: 'employee_no',
        key: 'employee_no',
        width: 90,
      },
      {
        title: '部门',
        dataIndex: 'department',
        key: 'department',
        width: 120,
      },
      {
        title: '岗位',
        dataIndex: 'position',
        key: 'position',
        width: 120,
      },
      {
        title: '匹配度',
        dataIndex: 'match_score',
        key: 'match_score',
        width: 70,
        align: 'center' as const,
        render: (score: number) => (
          <span className={`score-badge ${score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'}`}>
            {score}
          </span>
        )
      },
      {
        title: '绩效A/S',
        dataIndex: 'performance_score',
        key: 'performance_score',
        width: 70,
        align: 'center' as const,
        render: (count: number) => <span className="count-small">{count}次</span>
      },
      {
        title: '核心项目',
        dataIndex: 'core_project_count',
        key: 'core_project_count',
        width: 80,
        align: 'center' as const,
        render: (count: number) => <span className="count-small">{count}个</span>
      },
      {
        title: '类型',
        dataIndex: 'quality_type',
        key: 'quality_type',
        width: 80,
        align: 'center' as const,
        render: (type: string) => {
          const info = getQualityTypeInfo(type);
          return <Tag color={info.tag} style={{ fontSize: '11px' }}>{info.label}</Tag>;
        }
      },
    ];

    return (
      <div className="detail-content">
        <div className="detail-table-compact">
          <Table
            columns={columns}
            dataSource={qualityData}
            rowKey="id"
            pagination={{ pageSize: 15, size: 'small' }}
            className="detail-table"
            loading={loading}
            size="small"
          />
        </div>
      </div>
    );
  };

  // 渲染来源流动详情
  const renderSourceDetail = () => {
    const levelOptions = [
      { label: '全部层级', value: undefined },
      { label: '战略层', value: '战略层' },
      { label: '经营层', value: '经营层' },
      { label: '中层', value: '中层' },
      { label: '基层', value: '基层' }
    ];

    const sourceTypeOptions = [
      { label: '全部来源', value: undefined },
      { label: '内部培养', value: 'internal' },
      { label: '外部引进', value: 'external' }
    ];

    const columns = [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 100,
        render: (text: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserOutlined style={{ color: '#d4af37', fontSize: '12px' }} />
            <span className="cell-title">{text}</span>
          </div>
        )
      },
      {
        title: '性别',
        dataIndex: 'gender',
        key: 'gender',
        width: 60,
        align: 'center' as const,
        render: (gender: string) => gender === '男' ? '男' : gender === '女' ? '女' : '-'
      },
      {
        title: '年龄',
        dataIndex: 'age',
        key: 'age',
        width: 60,
        align: 'center' as const,
        render: (age: number) => <span className="count-small">{age}岁</span>
      },
      {
        title: '管理层级',
        dataIndex: 'management_level',
        key: 'management_level',
        width: 100,
      },
      {
        title: '部门',
        dataIndex: 'department',
        key: 'department',
        width: 150,
        render: (text: string) => <span className="cell-ellipsis">{text || '-'}</span>
      },
      {
        title: '岗位',
        dataIndex: 'position',
        key: 'position',
        width: 150,
        render: (text: string) => <span className="cell-ellipsis">{text || '-'}</span>
      },
      {
        title: '来源类型',
        dataIndex: 'source_type_name',
        key: 'source_type',
        width: 100,
        align: 'center' as const,
        render: (text: string, record: any) => (
          <Tag color={record.source_type === 'internal' ? 'green' : 'blue'} style={{ fontSize: '11px' }}>
            {text}
          </Tag>
        )
      },
      {
        title: '入职日期',
        dataIndex: 'entry_date',
        key: 'entry_date',
        width: 110,
        align: 'center' as const,
        render: (date: string) => date ? date.split('T')[0] : '-'
      },
    ];

    return (
      <div className="detail-content">
        {/* 筛选器和统计 */}
        <div className="detail-filters-compact">
          <div className="detail-filter-group">
            <label className="detail-filter-label">管理层级</label>
            <select
              className="detail-filter-select"
              value={selectedManagementLevel ?? ''}
              onChange={(e) => setSelectedManagementLevel(e.target.value || undefined)}
            >
              {levelOptions.map(option => (
                <option key={option.label} value={option.value ?? ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="detail-filter-group">
            <label className="detail-filter-label">来源类型</label>
            <select
              className="detail-filter-select"
              value={selectedSourceType ?? ''}
              onChange={(e) => setSelectedSourceType(e.target.value || undefined)}
            >
              {sourceTypeOptions.map(option => (
                <option key={option.label} value={option.value ?? ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="detail-stat-divider"></div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">总人数</span>
            <span className="detail-stat-value">{flowCadresData.total}</span>
          </div>
        </div>

        {/* 干部列表 */}
        <div className="detail-table-compact">
          <Table
            columns={columns}
            dataSource={flowCadresData.cadres.filter(cadre => {
              if (selectedManagementLevel && cadre.management_level !== selectedManagementLevel) return false;
              if (selectedSourceType && cadre.source_type !== selectedSourceType) return false;
              return true;
            })}
            rowKey="id"
            pagination={{ pageSize: 20, size: 'small' }}
            className="detail-table"
            loading={loading}
            size="small"
          />
        </div>
      </div>
    );
  };

  // 渲染流动趋势详情
  const renderFlowDetail = () => {
    // 获取可选年份列表
    const currentYear = new Date().getFullYear();
    const yearOptions = [
      { label: '全部年份', value: undefined },
      ...Array.from({ length: 6 }, (_, i) => ({
        label: `${currentYear - 5 + i}年`,
        value: currentYear - 5 + i
      }))
    ];

    const sourceTypeOptions = [
      { label: '全部来源', value: undefined },
      { label: '内部培养', value: 'internal' },
      { label: '外部引进', value: 'external' }
    ];

    const columns = [
      {
        title: '姓名',
        dataIndex: 'name',
        key: 'name',
        width: 100,
        render: (text: string) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <UserOutlined style={{ color: '#d4af37', fontSize: '12px' }} />
            <span className="cell-title">{text}</span>
          </div>
        )
      },
      {
        title: '性别',
        dataIndex: 'gender',
        key: 'gender',
        width: 60,
        align: 'center' as const,
        render: (gender: string) => gender === '男' ? '男' : gender === '女' ? '女' : '-'
      },
      {
        title: '年龄',
        dataIndex: 'age',
        key: 'age',
        width: 60,
        align: 'center' as const,
        render: (age: number) => <span className="count-small">{age}岁</span>
      },
      {
        title: '管理层级',
        dataIndex: 'management_level',
        key: 'management_level',
        width: 100,
      },
      {
        title: '部门',
        dataIndex: 'department',
        key: 'department',
        width: 150,
        render: (text: string) => <span className="cell-ellipsis">{text || '-'}</span>
      },
      {
        title: '岗位',
        dataIndex: 'position',
        key: 'position',
        width: 150,
        render: (text: string) => <span className="cell-ellipsis">{text || '-'}</span>
      },
      {
        title: '来源类型',
        dataIndex: 'source_type_name',
        key: 'source_type',
        width: 100,
        align: 'center' as const,
        render: (text: string, record: any) => (
          <Tag color={record.source_type === 'internal' ? 'green' : 'blue'} style={{ fontSize: '11px' }}>
            {text}
          </Tag>
        )
      },
      {
        title: '流动年份',
        dataIndex: 'flow_year',
        key: 'flow_year',
        width: 90,
        align: 'center' as const,
        render: (year: number) => <span className="count-badge">{year}年</span>
      },
      {
        title: '入职日期',
        dataIndex: 'entry_date',
        key: 'entry_date',
        width: 110,
        align: 'center' as const,
        render: (date: string) => date ? date.split('T')[0] : '-'
      },
    ];

    return (
      <div className="detail-content">
        {/* 筛选器和统计 */}
        <div className="detail-filters-compact">
          <div className="detail-filter-group">
            <label className="detail-filter-label">年份</label>
            <select
              className="detail-filter-select"
              value={selectedYear ?? ''}
              onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : undefined)}
            >
              {yearOptions.map(option => (
                <option key={option.label} value={option.value ?? ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="detail-filter-group">
            <label className="detail-filter-label">来源类型</label>
            <select
              className="detail-filter-select"
              value={selectedSourceType ?? ''}
              onChange={(e) => setSelectedSourceType(e.target.value || undefined)}
            >
              {sourceTypeOptions.map(option => (
                <option key={option.label} value={option.value ?? ''}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="detail-stat-divider"></div>
          <div className="detail-stat-item">
            <span className="detail-stat-label">流动人数</span>
            <span className="detail-stat-value">{flowCadresData.total}</span>
          </div>
        </div>

        {/* 干部列表 */}
        <div className="detail-table-compact">
          <Table
            columns={columns}
            dataSource={flowCadresData.cadres.filter(cadre => {
              if (selectedYear && cadre.flow_year !== selectedYear) return false;
              if (selectedSourceType && cadre.source_type !== selectedSourceType) return false;
              return true;
            })}
            rowKey="id"
            pagination={{ pageSize: 20, size: 'small' }}
            className="detail-table"
            loading={loading}
            size="small"
          />
        </div>
      </div>
    );
  };

  // 渲染内容
  const renderContent = () => {
    switch (type) {
      case 'match-overall':
        return renderMatchDetail(matchStatistics.overall);
      case 'match-key':
        return renderMatchDetail(matchStatistics.key_position);
      case 'pyramid':
        return renderPyramidDetail();
      case 'risk':
        return renderRiskDetail();
      case 'quality':
        return renderQualityDetail();
      case 'source':
        return renderSourceDetail();
      case 'flow':
        return renderFlowDetail();
      default:
        return <div className="detail-empty">未知类型</div>;
    }
  };

  return (
    <div className="dashboard-detail">
      <div className="detail-header">
        <button className="detail-back-btn" onClick={handleBack}>
          <ArrowLeftOutlined />
          返回大屏
        </button>
        <div className="detail-header-content">
          <div className="detail-header-icon">
            <BarChartOutlined />
          </div>
          <h1 className="detail-title">{detailTitles[type || 'match-overall']}</h1>
        </div>
      </div>

      <div className="detail-body">
        {loading ? (
          <div className="detail-loading">
            <div className="spinner"></div>
            <p>数据加载中...</p>
          </div>
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );
};

export default DashboardDetail;
