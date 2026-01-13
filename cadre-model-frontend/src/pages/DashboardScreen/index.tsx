import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  BarChartOutlined,
  TeamOutlined,
  SafetyOutlined,
  TrophyOutlined,
  RocketOutlined,
  ApartmentOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { matchApi } from '@/services/matchApi';
import { departmentApi } from '@/services/departmentApi';
import { positionApi } from '@/services/positionApi';
import { Tooltip } from 'antd';
import type { MatchStatistics, PyramidStatistics, SourceAndFlowStatistics } from '@/types';
import './index.css';

// 匹配态势卡片组件（大屏版本 - 精简）
const MatchStatisticsCard = ({ title, data, icon, onClick, tooltip }: {
  title: string;
  data: MatchStatistics['overall'] | MatchStatistics['key_position'];
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: React.ReactNode[];
}) => {
  const levelLabels = {
    excellent: '优质',
    qualified: '合格',
    unqualified: '不合格'
  };

  const levelColors = {
    excellent: '#4ade80',
    qualified: '#60a5fa',
    unqualified: '#f87171'
  };

  return (
    <div className="screen-match-card clickable" onClick={onClick}>
      <div className="screen-card-header">
        <div className="screen-card-icon">{icon}</div>
        <div className="screen-card-title">
          <h4>
            {title}
            {tooltip && (
              <Tooltip title={tooltip} placement="top" overlayClassName="custom-tooltip">
                <QuestionCircleOutlined style={{ marginLeft: '6px', fontSize: '12px', color: '#d4af37', cursor: 'help' }} />
              </Tooltip>
            )}
          </h4>
          <span className="screen-card-total">{data.total_count}人</span>
        </div>
        <div className="screen-card-avg">
          <div className="avg-label">平均</div>
          <div className="avg-value">{data.avg_score}</div>
        </div>
      </div>

      {data.total_count === 0 ? (
        <div className="screen-empty">暂无数据</div>
      ) : (
        <div className="screen-match-distribution">
          {(Object.keys(data.level_distribution) as Array<keyof typeof data.level_distribution>).map((level) => {
            const levelData = data.level_distribution[level];
            return (
              <div key={level} className="screen-match-item">
                <div className="screen-match-info">
                  <span className="screen-match-label">{levelLabels[level]}</span>
                  <span className="screen-match-count">{levelData.count}</span>
                </div>
                <div className="screen-match-bar">
                  <div
                    className="screen-match-bar-fill"
                    style={{
                      width: `${levelData.percentage}%`,
                      backgroundColor: levelColors[level]
                    }}
                  />
                </div>
                <span className="screen-match-percent">{levelData.percentage}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 梯队金字塔组件（大屏版本 - 精简）
const AgePyramidCard = ({ data, onClick, tooltip }: { data: PyramidStatistics; onClick: () => void; tooltip?: React.ReactNode[] }) => {
  const [hoveredLevel, setHoveredLevel] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const levelWidths = ['35%', '55%', '75%', '95%'];

  const handleMouseEnter = (levelKey: string, e: React.MouseEvent) => {
    setHoveredLevel(levelKey);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    // 计算固定定位位置（相对于视口）
    // 根据层级调整tooltip位置，基层需要上移更多
    let topOffset = rect.top;
    if (levelKey === '基层') {
      topOffset = rect.top - 80;
    } else if (levelKey === '中层') {
      topOffset = rect.top - 40;
    }

    setTooltipPosition({
      top: topOffset,
      left: rect.right + 10
    });
  };

  const handleMouseLeave = () => {
    setHoveredLevel(null);
    setTooltipPosition(null);
  };

  return (
    <div className="screen-pyramid-card clickable" onClick={onClick}>
      <div className="screen-card-header">
        <div className="screen-card-icon"><TeamOutlined /></div>
        <div className="screen-card-title">
          <h4>
            干部梯队与年龄结构
            {tooltip && (
              <Tooltip title={tooltip} placement="top" overlayClassName="custom-tooltip">
                <QuestionCircleOutlined style={{ marginLeft: '6px', fontSize: '12px', color: '#d4af37', cursor: 'help' }} />
              </Tooltip>
            )}
          </h4>
          <span className="screen-card-total">{data.total_count}人</span>
        </div>
      </div>

      {data.total_count === 0 ? (
        <div className="screen-empty">暂无数据</div>
      ) : (
        <div className="screen-pyramid-chart">
          {data.levels.map((levelKey, index) => {
            const levelData = data.data[levelKey];
            if (!levelData || levelData.total === 0) return null;

            const ageKeys = ['le_35', '36_45', '46_55', 'ge_56'];

            return (
              <div
                key={levelKey}
                className="screen-pyramid-level"
              >
                <div
                  className="screen-pyramid-bar"
                  style={{ width: levelWidths[index] }}
                  onMouseEnter={(e) => handleMouseEnter(levelKey, e)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="screen-pyramid-header">
                    <span className="screen-level-name">{levelData.label}</span>
                    <span className="screen-level-total">{levelData.total}</span>
                  </div>
                  <div className="screen-pyramid-segments">
                    {ageKeys.map((ageKey) => {
                      const ageData = levelData.age_distribution[ageKey];
                      if (ageData.count === 0) return null;

                      return (
                        <div
                          key={ageKey}
                          className="screen-pyramid-segment"
                          style={{
                            flex: ageData.count,
                            backgroundColor: ageData.color
                          }}
                        >
                          <span className="screen-segment-count">{ageData.count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 自定义 Tooltip - 使用 Portal 渲染到 body */}
      {hoveredLevel && data.data[hoveredLevel] && tooltipPosition &&
        createPortal(
          <div
            className="pyramid-tooltip"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            <div className="pyramid-tooltip-header">
              <span className="pyramid-tooltip-title">{data.data[hoveredLevel].label}</span>
              <span className="pyramid-tooltip-total">共 {data.data[hoveredLevel].total} 人</span>
            </div>
            <div className="pyramid-tooltip-body">
              {Object.entries(data.data[hoveredLevel].age_distribution).map(([key, ageData]) => (
                <div key={key} className="pyramid-tooltip-row">
                  <span className="pyramid-tooltip-age" style={{ color: ageData.color }}>
                    {ageData.label}
                  </span>
                  <span className="pyramid-tooltip-count">{ageData.count} 人</span>
                  <span className="pyramid-tooltip-percent">{ageData.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )
      }
    </div>
  );
};

const DashboardScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
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
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0 },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0 },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0 },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0 }
        }
      },
      '经营层': {
        label: '经营层',
        total: 0,
        age_distribution: {
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0 },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0 },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0 },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0 }
        }
      },
      '中层': {
        label: '中层',
        total: 0,
        age_distribution: {
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0 },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0 },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0 },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0 }
        }
      },
      '基层': {
        label: '基层',
        total: 0,
        age_distribution: {
          le_35: { label: '≤35岁', color: '#4ade80', count: 0, percentage: 0 },
          '36_45': { label: '36-45岁', color: '#60a5fa', count: 0, percentage: 0 },
          '46_55': { label: '46-55岁', color: '#fbbf24', count: 0, percentage: 0 },
          ge_56: { label: '≥56岁', color: '#f87171', count: 0, percentage: 0 }
        }
      }
    },
    total_count: 0
  });

  const [riskData, setRiskData] = useState<any[]>([]);
  const [qualityData, setQualityData] = useState<any[]>([]);
  const [sourceAndFlowData, setSourceAndFlowData] = useState<SourceAndFlowStatistics>({
    total_count: 0,
    source_distribution: {
      internal: { count: 0, percentage: 0, label: '内部培养' },
      external: { count: 0, percentage: 0, label: '外部引进' }
    },
    source_by_level: [],
    flow_trend: []
  });

  const [departmentTree, setDepartmentTree] = useState<any[]>([]);
  const [positionCount, setPositionCount] = useState(0);

  // 计算部门总数的辅助函数
  const countDepartments = (deptList: any[]): number => {
    let count = 0;
    deptList.forEach(dept => {
      count += 1;
      if (dept.children && dept.children.length > 0) {
        count += countDepartments(dept.children);
      }
    });
    return count;
  };

  const departmentCount = countDepartments(departmentTree);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [matchStats, pyramidStats, risk, quality, sourceFlow, deptTree, positions] = await Promise.all([
          matchApi.getStatistics(),
          matchApi.getAgeStructure(),
          matchApi.getPositionRisk(),
          matchApi.getQualityPortrait(),
          matchApi.getSourceAndFlow(),
          departmentApi.getTree(),
          positionApi.getAll(),
        ]);

        if (matchStats.data?.data) setMatchStatistics(matchStats.data.data);
        if (pyramidStats.data?.data) setPyramidStatistics(pyramidStats.data.data);
        if (risk.data?.data) setRiskData(risk.data.data);
        if (quality.data?.data) setQualityData(quality.data.data);
        if (sourceFlow.data?.data) setSourceAndFlowData(sourceFlow.data.data);
        if (deptTree.data?.data) setDepartmentTree(deptTree.data.data);
        if (positions.data?.data) setPositionCount(positions.data.data.length);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 风险数据卡片
  const riskStats = {
    high: riskData.filter(d => d.risk_level === 'high').length,
    medium: riskData.filter(d => d.risk_level === 'medium').length,
    low: riskData.filter(d => d.risk_level === 'low').length,
    vacant: riskData.filter(d => !d.incumbent).length,
  };

  // 风险因子统计
  const riskFactorStats = {
    low_match: riskData.filter(d => d.risks?.low_match).length,
    age_risk: riskData.filter(d => d.risks?.age_risk).length,
    single_point: riskData.filter(d => d.risks?.single_point).length,
    no_training: riskData.filter(d => d.risks?.no_training).length,
    long_term: riskData.filter(d => d.risks?.long_term).length,
  };

  // 风险等级分布图
  const riskDistributionOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      show: true,
      orient: 'vertical',
      left: '0%',
      top: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: '#a0a0a0',
        fontSize: 10,
      },
      itemGap: 8,
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['55%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#131729',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{c}个',
          color: '#a0a0a0',
          fontSize: 10,
        },
        labelLine: {
          show: true,
          length: 8,
          length2: 6,
          lineStyle: { color: '#404040' },
        },
        data: [
          { value: riskStats.high, name: '高风险', itemStyle: { color: '#ef4444' } },
          { value: riskStats.medium, name: '中风险', itemStyle: { color: '#f59e0b' } },
          { value: riskStats.low, name: '低风险', itemStyle: { color: '#22c55e' } },
          { value: riskStats.vacant, name: '空缺', itemStyle: { color: '#6366f1' } },
        ],
      },
    ],
  };

  // 风险因子分析图
  const riskFactorDistributionOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '5%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: ['匹配度低', '年龄风险', '单点任职', '培养缺失', '任期过长'],
      axisLabel: {
        color: '#a0a0a0',
        fontSize: 10,
        interval: 0,
      },
      axisLine: { lineStyle: { color: '#404040' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a0a0a0', fontSize: 10 },
      axisLine: { lineStyle: { color: '#404040' } },
      splitLine: { lineStyle: { color: '#303040', type: 'dashed' } },
    },
    series: [
      {
        name: '岗位数量',
        type: 'bar',
        data: [
          riskFactorStats.low_match,
          riskFactorStats.age_risk,
          riskFactorStats.single_point,
          riskFactorStats.no_training,
          riskFactorStats.long_term,
        ],
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#d4af37' },
              { offset: 1, color: '#b8962e' }
            ]
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#d4af37',
          fontSize: 11,
        },
      },
    ],
  };

  // 质量数据统计
  const qualityStats = {
    star: qualityData.filter(d => d.quality_type === 'star').length,
    potential: qualityData.filter(d => d.quality_type === 'potential').length,
    stable: qualityData.filter(d => d.quality_type === 'stable').length,
    adjust: qualityData.filter(d => d.quality_type === 'adjust').length,
  };

  // 来源分布图 - 按管理层级的柱状图
  const sourceDistributionOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
      formatter: (params: any) => {
        const level = params[0].name;
        let result = `${level}<br/>`;
        params.forEach((item: any) => {
          result += `${item.marker}${item.seriesName}: ${item.value}人<br/>`;
        });
        return result;
      },
    },
    legend: {
      show: true,
      orient: 'horizontal',
      left: 'center',
      top: '5%',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: '#a0a0a0',
        fontSize: 11,
      },
      itemGap: 15,
      data: ['内部培养', '外部引进'],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '18%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sourceAndFlowData.source_by_level.map(item => item.level),
      axisLabel: {
        color: '#a0a0a0',
        fontSize: 11,
        interval: 0,
      },
      axisLine: { lineStyle: { color: '#404040' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a0a0a0', fontSize: 10 },
      axisLine: { lineStyle: { color: '#404040' } },
      splitLine: { lineStyle: { color: '#303040', type: 'dashed' } },
    },
    series: [
      {
        name: '内部培养',
        type: 'bar',
        data: sourceAndFlowData.source_by_level.map(item => item.internal),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#22c55e' },
              { offset: 1, color: '#16a34a' }
            ]
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#22c55e',
          fontSize: 10,
          formatter: (params: any) => params.value > 0 ? params.value : '',
        },
      },
      {
        name: '外部引进',
        type: 'bar',
        data: sourceAndFlowData.source_by_level.map(item => item.external),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#2563eb' }
            ]
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: {
          show: true,
          position: 'top',
          color: '#3b82f6',
          fontSize: 10,
          formatter: (params: any) => params.value > 0 ? params.value : '',
        },
      },
    ],
  };

  // 流动趋势图
  const flowTrendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '0%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: sourceAndFlowData.flow_trend.map(item => item.year),
      boundaryGap: false,
      axisLabel: {
        color: '#a0a0a0',
        fontSize: 11,
      },
      axisLine: { lineStyle: { color: '#404040' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#a0a0a0', fontSize: 10 },
      axisLine: { lineStyle: { color: '#404040' } },
      splitLine: { lineStyle: { color: '#303040', type: 'dashed' } },
    },
    series: [
      {
        name: '内部培养',
        type: 'line',
        data: sourceAndFlowData.flow_trend.map(item => item.internal),
        smooth: true,
        showSymbol: false,
        itemStyle: { color: '#22c55e' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(34, 197, 94, 0.3)' },
              { offset: 1, color: 'rgba(34, 197, 94, 0.05)' }
            ]
          },
        },
      },
      {
        name: '外部引进',
        type: 'line',
        data: sourceAndFlowData.flow_trend.map(item => item.external),
        smooth: true,
        showSymbol: false,
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ]
          },
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="dashboard-screen-loading">
        <LoadingOutlined style={{ fontSize: 48, color: '#d4af37' }} />
        <p>数据加载中...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-screen">
      {/* 标题栏 */}
      <div className="screen-header">
        <div
          className="screen-header-left clickable"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open('/dashboard_temp', '_blank');
          }}
        >
          <div className="screen-logo">
            <ApartmentOutlined />
          </div>
          <h1 className="screen-title">干部管理数据大屏</h1>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="screen-content">
        {/* 左侧区域 */}
        <div className="screen-left">
          {/* 匹配态势 */}
          <div className="screen-section">
            <MatchStatisticsCard
              title="全员匹配"
              data={matchStatistics.overall}
              icon={<BarChartOutlined />}
              onClick={() => navigate('/dashboard/detail/match-overall')}
              tooltip={[
                <div key="1"><strong>匹配度计算规则</strong></div>,
                <div key="2" style={{marginTop: '8px'}}>基础得分 = Σ(能力维度得分 × 岗位权重)</div>,
                <div key="3" style={{marginTop: '8px'}}><strong>等级划分：</strong></div>,
                <div key="4">• 优质匹配：≥80分</div>,
                <div key="5">• 合格匹配：60-79分</div>,
                <div key="6">• 不合格匹配：&lt;60分</div>,
              ]}
            />
          </div>
          <div className="screen-section">
            <MatchStatisticsCard
              title="关键岗位匹配"
              data={matchStatistics.key_position}
              icon={<SafetyOutlined />}
              onClick={() => navigate('/dashboard/detail/match-key')}
              tooltip={[
                <div key="1"><strong>匹配度计算规则</strong></div>,
                <div key="2" style={{marginTop: '8px'}}>基础得分 = Σ(能力维度得分 × 岗位权重)</div>,
                <div key="3" style={{marginTop: '8px'}}><strong>等级划分：</strong></div>,
                <div key="4">• 优质匹配：≥80分</div>,
                <div key="5">• 合格匹配：60-79分</div>,
                <div key="6">• 不合格匹配：&lt;60分</div>,
              ]}
            />
          </div>

          {/* 梯队金字塔 */}
          <div className="screen-section screen-section-tall">
            <AgePyramidCard
              data={pyramidStatistics}
              onClick={() => navigate('/dashboard/detail/pyramid')}
              tooltip={[
                <div key="1">展示各管理层级的干部人数及年龄分布</div>,
                <div key="2" style={{marginTop: '8px'}}><strong>管理层级：</strong>战略层、经营层、中层、基层</div>,
                <div key="3" style={{marginTop: '8px'}}><strong>年龄分段：</strong></div>,
                <div key="4">• ≤35岁</div>,
                <div key="5">• 36-45岁</div>,
                <div key="6">• 46-55岁</div>,
                <div key="7">• ≥56岁</div>,
              ]}
            />
          </div>
        </div>

        {/* 中间区域 */}
        <div className="screen-center">
          {/* 数据概览 - 三个统计卡片 */}
          <div className="screen-overview">
            <div className="screen-overview-card gold">
              <div className="overview-icon"><ApartmentOutlined /></div>
              <div className="overview-value">{departmentCount}</div>
              <div className="overview-label">部门数</div>
            </div>
            <div className="screen-overview-card green">
              <div className="overview-icon"><TeamOutlined /></div>
              <div className="overview-value">{pyramidStatistics.total_count}</div>
              <div className="overview-label">干部数</div>
            </div>
            <div className="screen-overview-card blue">
              <div className="overview-icon"><SafetyOutlined /></div>
              <div className="overview-value">{positionCount}</div>
              <div className="overview-label">岗位数</div>
            </div>
          </div>

          {/* 风险分析 - 拆分为左右两部分 */}
          <div className="screen-section">
            <div className="screen-risk-split-card clickable" onClick={() => navigate('/dashboard/detail/risk')}>
              <div className="screen-card-header">
                <div className="screen-card-icon"><SafetyOutlined /></div>
                <div className="screen-card-title">
                  <h4>
                    岗位风险分析
                    <Tooltip title={[
                      <div key="1"><strong>风险因子说明</strong></div>,
                      <div key="2" style={{marginTop: '8px'}}>• 匹配度低：&lt;70分</div>,
                      <div key="3">• 年龄风险：55岁以上</div>,
                      <div key="4">• 单点风险：无后备人员</div>,
                      <div key="5">• 无培养：无培训记录</div>,
                      <div key="6">• 任期长：同一岗位任职&gt;5年</div>,
                      <div key="7" style={{marginTop: '8px'}}><strong>风险等级：</strong></div>,
                      <div key="8">• 高风险：≥3个风险因子</div>,
                      <div key="9">• 中风险：1-2个风险因子</div>,
                      <div key="10">• 低风险：0个风险因子</div>,
                    ]} placement="top" overlayClassName="custom-tooltip">
                      <QuestionCircleOutlined style={{ marginLeft: '6px', fontSize: '12px', color: '#d4af37', cursor: 'help' }} />
                    </Tooltip>
                  </h4>
                  <span className="screen-card-total">{riskData.length}个岗位</span>
                </div>
              </div>
              <div className="screen-risk-split-content">
                {/* 左侧：风险等级分布 */}
                <div className="screen-risk-split-left">
                  <div className="screen-risk-subtitle">风险等级分布</div>
                  <div className="screen-risk-chart-large">
                    <ReactECharts option={riskDistributionOption} style={{ height: '160px' }} />
                  </div>
                </div>
                {/* 右侧：风险因子分析 */}
                <div className="screen-risk-split-right">
                  <div className="screen-risk-subtitle">风险因子分析</div>
                  <div className="screen-risk-factor-chart">
                    <ReactECharts option={riskFactorDistributionOption} style={{ height: '180px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 质量画像 - 2×2 人才矩阵 */}
          <div className="screen-section screen-section-tall">
            <div className="screen-card clickable" onClick={() => navigate('/dashboard/detail/quality')}>
              <div className="screen-card-header">
                <div className="screen-card-icon"><TrophyOutlined /></div>
                <div className="screen-card-title">
                  <h4>
                    干部质量画像
                    <Tooltip title={[
                      <div key="1"><strong>划分规则</strong></div>,
                      <div key="2" style={{marginTop: '8px'}}><strong>横轴（匹配度）：</strong></div>,
                      <div key="3">• 低匹配：&lt;80分</div>,
                      <div key="4">• 高匹配：≥80分</div>,
                      <div key="5" style={{marginTop: '8px'}}><strong>纵轴（绩效，S计入A）：</strong></div>,
                      <div key="6">• 低绩效：&lt;2次A/S</div>,
                      <div key="7">• 高绩效：≥2次A/S</div>,
                      <div key="8" style={{marginTop: '8px'}}><strong>四个象限：</strong></div>,
                      <div key="9">• 明星干部：高匹配+高绩效</div>,
                      <div key="10">• 稳健干部：高匹配+低绩效</div>,
                      <div key="11">• 潜力干部：低匹配+高绩效</div>,
                      <div key="12">• 需调整：低匹配+低绩效</div>,
                    ]} placement="top" overlayClassName="custom-tooltip">
                      <QuestionCircleOutlined style={{ marginLeft: '6px', fontSize: '12px', color: '#d4af37', cursor: 'help' }} />
                    </Tooltip>
                  </h4>
                  <span className="screen-card-total">{qualityData.length}人</span>
                </div>
              </div>
              {/* 2×2 人才矩阵 - 坐标轴形式 */}
              <div className="screen-quality-matrix-axis">
                <div className="matrix-axis-container">
                  {/* 四象限 */}
                  <div className="matrix-quadrants">
                    {/* 第一象限：高匹配+高绩效（右上）- 明星干部 */}
                    <div className="quadrant-cell star">
                      <div className="quadrant-icon">⭐</div>
                      <div className="quadrant-type">明星干部</div>
                      <div className="quadrant-count">{qualityStats.star}</div>
                    </div>
                    {/* 第二象限：低匹配+高绩效（左上）- 稳健干部 */}
                    <div className="quadrant-cell stable">
                      <div className="quadrant-icon">📊</div>
                      <div className="quadrant-type">稳健干部</div>
                      <div className="quadrant-count">{qualityStats.stable}</div>
                    </div>
                    {/* 第三象限：低匹配+低绩效（左下）- 需调整 */}
                    <div className="quadrant-cell adjust">
                      <div className="quadrant-icon">⚠️</div>
                      <div className="quadrant-type">需调整</div>
                      <div className="quadrant-count">{qualityStats.adjust}</div>
                    </div>
                    {/* 第四象限：高匹配+低绩效（右下）- 潜力干部 */}
                    <div className="quadrant-cell potential">
                      <div className="quadrant-icon">🚀</div>
                      <div className="quadrant-type">潜力干部</div>
                      <div className="quadrant-count">{qualityStats.potential}</div>
                    </div>
                    {/* 原点中心：坐标轴说明 */}
                    <div className="axis-origin">
                      <div className="origin-line-y"></div>
                      <div className="origin-line-x"></div>
                      <div className="origin-center">
                        <div className="origin-point"></div>
                      </div>
                      {/* Y轴上下说明 - 竖向排列 */}
                      <div className="axis-label-y-top">
                        <span className="axis-label-y-line">↑ 高绩效</span>
                        <span className="axis-label-y-line">≥ 2次A/S</span>
                      </div>
                      <div className="axis-label-y-bottom">
                        <span className="axis-label-y-line">↓ 低绩效</span>
                        <span className="axis-label-y-line">&lt; 2次A/S</span>
                      </div>
                      {/* X轴左右说明 - 竖向排列 */}
                      <div className="axis-label-x-left">
                        <span className="axis-label-x-line">← 低匹配</span>
                        <span className="axis-label-x-line">&lt; 80分</span>
                      </div>
                      <div className="axis-label-x-right">
                        <span className="axis-label-x-line">高匹配 →</span>
                        <span className="axis-label-x-line">≥ 80分</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧区域 */}
        <div className="screen-right">
          {/* 流动趋势 */}
          <div className="screen-section">
            <div className="screen-card clickable" onClick={() => navigate('/dashboard/detail/flow')}>
              <div className="screen-card-header">
                <div className="screen-card-icon"><RocketOutlined /></div>
                <div className="screen-card-title">
                  <h4>
                    流动趋势（近5年）
                    <Tooltip title={[
                      <div key="1"><strong>流动定义</strong></div>,
                      <div key="2" style={{marginTop: '8px'}}>统计近5年内新入职或发生岗位变动的干部人数</div>,
                      <div key="3" style={{marginTop: '8px'}}><strong>来源划分：</strong></div>,
                      <div key="4">• 内部培养：从其他岗位调任</div>,
                      <div key="5">（有职务变更记录）</div>,
                      <div key="6">• 外部引进：从外部招聘入职</div>,
                      <div key="7">（无职务变更记录）</div>,
                    ]} placement="top" overlayClassName="custom-tooltip">
                      <QuestionCircleOutlined style={{ marginLeft: '6px', fontSize: '12px', color: '#d4af37', cursor: 'help' }} />
                    </Tooltip>
                  </h4>
                </div>
              </div>
              <div className="screen-flow-chart">
                <ReactECharts option={flowTrendOption} style={{ height: '280px', width: '100%' }} notMerge={true} lazyUpdate={true} />
              </div>
            </div>
          </div>

          {/* 来源分布 */}
          <div className="screen-section screen-section-expand">
            <div className="screen-card clickable" onClick={() => navigate('/dashboard/detail/source')}>
              <div className="screen-card-header">
                <div className="screen-card-icon"><RocketOutlined /></div>
                <div className="screen-card-title">
                  <h4>
                    干部来源分布
                    <Tooltip title={[
                      <div key="1"><strong>来源划分</strong></div>,
                      <div key="2" style={{marginTop: '8px'}}>内部培养：</div>,
                      <div key="3">从其他岗位调任的干部</div>,
                      <div key="4">（有职务变更记录）</div>,
                      <div key="5" style={{marginTop: '8px'}}>外部引进：</div>,
                      <div key="6">从外部招聘入职的干部</div>,
                      <div key="7">（无职务变更记录）</div>,
                    ]} placement="top" overlayClassName="custom-tooltip">
                      <QuestionCircleOutlined style={{ marginLeft: '6px', fontSize: '12px', color: '#d4af37', cursor: 'help' }} />
                    </Tooltip>
                  </h4>
                  <span className="screen-card-total">{sourceAndFlowData.total_count}人</span>
                </div>
              </div>
              <div className="screen-source-chart">
                <ReactECharts option={sourceDistributionOption} style={{ height: '240px', width: '100%' }} notMerge={true} lazyUpdate={true} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
