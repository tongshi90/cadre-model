import ReactECharts from 'echarts-for-react';
import './index.css';

export interface PositionRiskData {
  position_id: number;
  position_code: string;
  position_name: string;
  department: string;
  incumbent?: {
    id: number;
    name: string;
    age?: number;
    match_score?: number;
  };
  risks: {
    low_match: boolean;        // 匹配度低 < 70
    age_risk: boolean;           // 年龄风险 > 55
    single_point: boolean;       // 单点任职无后备
    no_training: boolean;        // 培养缺失 3年无培养
    long_term: boolean;          // 任期过长 > 6年
  };
  risk_count: number;
  risk_level: 'high' | 'medium' | 'low';
}

interface RiskAnalysisProps {
  data: PositionRiskData[];
}

const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ data }) => {
  // 统计风险等级
  const highRisk = data.filter(d => d.risk_level === 'high').length;
  const mediumRisk = data.filter(d => d.risk_level === 'medium').length;
  const lowRisk = data.filter(d => d.risk_level === 'low').length;
  const vacantPositions = data.filter(d => !d.incumbent).length;

  // 风险等级分布图
  const riskDistributionOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#a0a0a0', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    series: [
      {
        name: '风险等级',
        type: 'pie',
        radius: ['40%', '65%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#131729',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}: {c}个\n({d}%)',
          color: '#a0a0a0',
          fontSize: 11,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#d4af37',
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
        labelLine: {
          show: true,
          length: 15,
          length2: 10,
          lineStyle: { color: '#404040' },
        },
        data: [
          {
            value: highRisk,
            name: '高风险',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#ef4444' },
                  { offset: 1, color: '#dc2626' }
                ]
              },
              shadowColor: 'rgba(239, 68, 68, 0.5)',
              shadowBlur: 10,
            }
          },
          {
            value: mediumRisk,
            name: '中风险',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#f59e0b' },
                  { offset: 1, color: '#d97706' }
                ]
              },
              shadowColor: 'rgba(245, 158, 11, 0.5)',
              shadowBlur: 10,
            }
          },
          {
            value: lowRisk,
            name: '低风险',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#22c55e' },
                  { offset: 1, color: '#16a34a' }
                ]
              },
              shadowColor: 'rgba(34, 197, 94, 0.5)',
              shadowBlur: 10,
            }
          },
          {
            value: vacantPositions,
            name: '空缺',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#6366f1' },
                  { offset: 1, color: '#4f46e5' }
                ]
              },
              shadowColor: 'rgba(99, 102, 241, 0.5)',
              shadowBlur: 10,
            }
          },
        ],
      },
    ],
  };

  // 风险因子分布图
  const riskFactorDistribution = () => {
    const factors = {
      low_match: data.filter(d => d.risks.low_match).length,
      age_risk: data.filter(d => d.risks.age_risk).length,
      single_point: data.filter(d => d.risks.single_point).length,
      no_training: data.filter(d => d.risks.no_training).length,
      long_term: data.filter(d => d.risks.long_term).length,
    };

    return {
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
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: ['匹配度低', '年龄风险', '单点任职', '培养缺失', '任期过长'],
        axisLabel: {
          color: '#a0a0a0',
          fontSize: 11,
          interval: 0,
        },
        axisLine: { lineStyle: { color: '#404040' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#a0a0a0' },
        axisLine: { lineStyle: { color: '#404040' } },
        splitLine: { lineStyle: { color: '#303040' } },
      },
      series: [
        {
          name: '岗位数量',
          type: 'bar',
          data: [
            factors.low_match,
            factors.age_risk,
            factors.single_point,
            factors.no_training,
            factors.long_term,
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
          emphasis: {
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#f0c946' },
                  { offset: 1, color: '#d4af37' }
                ]
              },
              shadowColor: 'rgba(212, 175, 55, 0.5)',
              shadowBlur: 10,
            },
          },
          label: {
            show: true,
            position: 'top',
            color: '#d4af37',
            fontSize: 12,
          },
        },
      ],
    };
  };

  // 风险岗位列表
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

  return (
    <div className="risk-analysis-container">
      {/* 统计卡片 */}
      <div className="risk-stats-grid">
        <div className="risk-stat-card high-risk">
          <div className="risk-stat-icon">⚠️</div>
          <div className="risk-stat-content">
            <div className="risk-stat-value">{highRisk}</div>
            <div className="risk-stat-label">高风险岗位</div>
          </div>
        </div>
        <div className="risk-stat-card medium-risk">
          <div className="risk-stat-icon">⚡</div>
          <div className="risk-stat-content">
            <div className="risk-stat-value">{mediumRisk}</div>
            <div className="risk-stat-label">中风险岗位</div>
          </div>
        </div>
        <div className="risk-stat-card low-risk">
          <div className="risk-stat-icon">✓</div>
          <div className="risk-stat-content">
            <div className="risk-stat-value">{lowRisk}</div>
            <div className="risk-stat-label">低风险岗位</div>
          </div>
        </div>
        <div className="risk-stat-card vacant">
          <div className="risk-stat-icon">📍</div>
          <div className="risk-stat-content">
            <div className="risk-stat-value">{vacantPositions}</div>
            <div className="risk-stat-label">空缺岗位</div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="risk-charts-grid">
        <div className="risk-chart-card">
          <h3 className="risk-chart-title">风险等级分布</h3>
          <div className="risk-chart-content">
            <ReactECharts option={riskDistributionOption} style={{ height: '280px' }} />
          </div>
        </div>
        <div className="risk-chart-card">
          <h3 className="risk-chart-title">风险因子分析</h3>
          <div className="risk-chart-content">
            <ReactECharts option={riskFactorDistribution()} style={{ height: '280px' }} />
          </div>
        </div>
      </div>

      {/* 风险岗位列表 */}
      <div className="risk-positions-section">
        <h3 className="risk-section-title">关键岗位风险详情</h3>
        <div className="risk-positions-table">
          <div className="risk-table-header">
            <div className="risk-table-cell">岗位名称</div>
            <div className="risk-table-cell">部门</div>
            <div className="risk-table-cell">任职者</div>
            <div className="risk-table-cell">风险因子</div>
            <div className="risk-table-cell">风险等级</div>
          </div>
          <div className="risk-table-body">
            {data.length === 0 ? (
              <div className="risk-table-empty">暂无数据</div>
            ) : (
              data.map((item) => (
                <div key={item.position_id} className="risk-table-row">
                  <div className="risk-table-cell">
                    <div className="position-name">{item.position_name}</div>
                    <div className="position-code">{item.position_code}</div>
                  </div>
                  <div className="risk-table-cell">{item.department}</div>
                  <div className="risk-table-cell">
                    {item.incumbent ? (
                      <div>
                        <div className="incumbent-name">{item.incumbent.name}</div>
                        {item.incumbent.age && (
                          <div className="incumbent-age">{item.incumbent.age}岁</div>
                        )}
                      </div>
                    ) : (
                      <span className="vacant-badge">空缺</span>
                    )}
                  </div>
                  <div className="risk-table-cell">
                    <div className="risk-factors">
                      {item.risks.low_match && <span className="risk-factor-tag">匹配度低</span>}
                      {item.risks.age_risk && <span className="risk-factor-tag">年龄风险</span>}
                      {item.risks.single_point && <span className="risk-factor-tag">单点任职</span>}
                      {item.risks.no_training && <span className="risk-factor-tag">培养缺失</span>}
                      {item.risks.long_term && <span className="risk-factor-tag">任期过长</span>}
                      {item.risk_count === 0 && <span className="no-risk">无风险</span>}
                    </div>
                  </div>
                  <div className="risk-table-cell">
                    <span
                      className="risk-level-badge"
                      style={{ backgroundColor: getRiskLevelColor(item.risk_level) }}
                    >
                      {getRiskLevelLabel(item.risk_level)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysis;
