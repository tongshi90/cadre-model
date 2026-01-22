import ReactECharts from 'echarts-for-react';
import type { SourceAndFlowStatistics } from '@/types';
import './index.css';

interface SourceAndFlowProps {
  data: SourceAndFlowStatistics;
}

const SourceAndFlow: React.FC<SourceAndFlowProps> = ({ data }) => {
  // 来源占比图（环形图）
  const sourceDistributionOption = {
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
    },
    series: [
      {
        name: '人才来源',
        type: 'pie',
        radius: ['45%', '70%'],
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
          formatter: '{b}\n{c}人 ({d}%)',
          color: '#a0a0a0',
          fontSize: 12,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
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
            value: data.source_distribution.internal.count,
            name: data.source_distribution.internal.label,
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
            value: data.source_distribution.external.count,
            name: data.source_distribution.external.label,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#3b82f6' },
                  { offset: 1, color: '#2563eb' }
                ]
              },
              shadowColor: 'rgba(59, 130, 246, 0.5)',
              shadowBlur: 10,
            }
          },
        ],
      },
    ],
  };

  // 按管理层级的来源分布（堆叠柱状图）
  const sourceByLevelOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      data: ['内部培养', '外部引进'],
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#a0a0a0', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.source_by_level.map(item => item.level),
      axisLabel: {
        color: '#a0a0a0',
        fontSize: 12,
        interval: 0,
      },
      axisLine: { lineStyle: { color: '#404040' } },
    },
    yAxis: {
      type: 'value',
      name: '人数',
      axisLabel: { color: '#a0a0a0' },
      axisLine: { lineStyle: { color: '#404040' } },
      splitLine: { lineStyle: { color: '#303040' } },
      nameTextStyle: { color: '#a0a0a0' },
    },
    series: [
      {
        name: '内部培养',
        type: 'bar',
        stack: 'source',
        data: data.source_by_level.map(item => item.internal),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#22c55e' },
              { offset: 1, color: '#16a34a' }
            ]
          },
        },
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(34, 197, 94, 0.5)',
            shadowBlur: 10,
          },
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => params.value > 0 ? params.value : '',
          color: '#fff',
          fontSize: 11,
        },
      },
      {
        name: '外部引进',
        type: 'bar',
        stack: 'source',
        data: data.source_by_level.map(item => item.external),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#2563eb' }
            ]
          },
        },
        emphasis: {
          itemStyle: {
            shadowColor: 'rgba(59, 130, 246, 0.5)',
            shadowBlur: 10,
          },
        },
        label: {
          show: true,
          position: 'inside',
          formatter: (params: any) => params.value > 0 ? params.value : '',
          color: '#fff',
          fontSize: 11,
        },
      },
    ],
  };

  // 流动趋势（折线图）
  const flowTrendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
    },
    legend: {
      data: ['内部培养', '外部引进', '合计'],
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#a0a0a0', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.flow_trend.map(item => item.year),
      boundaryGap: false,
      axisLabel: {
        color: '#a0a0a0',
        fontSize: 12,
      },
      axisLine: { lineStyle: { color: '#404040' } },
    },
    yAxis: {
      type: 'value',
      name: '人数',
      axisLabel: { color: '#a0a0a0' },
      axisLine: { lineStyle: { color: '#404040' } },
      splitLine: { lineStyle: { color: '#303040', type: 'dashed' } },
      nameTextStyle: { color: '#a0a0a0' },
    },
    series: [
      {
        name: '内部培养',
        type: 'line',
        data: data.flow_trend.map(item => item.internal),
        smooth: true,
        itemStyle: {
          color: '#22c55e',
        },
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
        emphasis: {
          focus: 'series',
        },
      },
      {
        name: '外部引进',
        type: 'line',
        data: data.flow_trend.map(item => item.external),
        smooth: true,
        itemStyle: {
          color: '#3b82f6',
        },
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
        emphasis: {
          focus: 'series',
        },
      },
      {
        name: '合计',
        type: 'line',
        data: data.flow_trend.map(item => item.total),
        smooth: true,
        itemStyle: {
          color: '#d4af37',
        },
        lineStyle: {
          type: 'dashed',
          width: 2,
        },
        emphasis: {
          focus: 'series',
        },
      },
    ],
  };

  return (
    <div className="source-and-flow-container">
      {/* 统计卡片 */}
      <div className="source-stats-grid">
        <div className="source-stat-card internal">
          <div className="source-stat-icon">🌱</div>
          <div className="source-stat-content">
            <div className="source-stat-value">{data.source_distribution.internal.count}</div>
            <div className="source-stat-label">内部培养</div>
            <div className="source-stat-percentage">{data.source_distribution.internal.percentage}%</div>
          </div>
        </div>
        <div className="source-stat-card external">
          <div className="source-stat-icon">🚀</div>
          <div className="source-stat-content">
            <div className="source-stat-value">{data.source_distribution.external.count}</div>
            <div className="source-stat-label">外部引进</div>
            <div className="source-stat-percentage">{data.source_distribution.external.percentage}%</div>
          </div>
        </div>
        <div className="source-stat-card total">
          <div className="source-stat-icon">👥</div>
          <div className="source-stat-content">
            <div className="source-stat-value">{data.total_count}</div>
            <div className="source-stat-label">人才总数</div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="source-charts-grid">
        <div className="source-chart-card">
          <h3 className="source-chart-title">来源占比</h3>
          <div className="source-chart-content">
            <ReactECharts option={sourceDistributionOption} style={{ height: '260px' }} />
          </div>
        </div>
        <div className="source-chart-card">
          <h3 className="source-chart-title">按管理层级分布</h3>
          <div className="source-chart-content">
            <ReactECharts option={sourceByLevelOption} style={{ height: '260px' }} />
          </div>
        </div>
      </div>

      {/* 流动趋势 */}
      <div className="source-trend-section">
        <h3 className="source-trend-title">流动趋势（近5年）</h3>
        <div className="source-trend-content">
          <ReactECharts option={flowTrendOption} style={{ height: '280px' }} />
        </div>
      </div>

      {/* 数据说明 */}
      <div className="source-legend-section">
        <div className="legend-note">
          <span className="legend-icon">📊</span>
          <span className="legend-text">
            <strong>统计说明：</strong>
            内部培养指有职务变更记录（从其他岗位调动到当前岗位）；
            外部引进指直接任职当前岗位，无内部任岗记录
          </span>
        </div>
      </div>
    </div>
  );
};

export default SourceAndFlow;
