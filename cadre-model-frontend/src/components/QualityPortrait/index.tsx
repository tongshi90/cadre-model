import ReactECharts from 'echarts-for-react';
import './index.css';

export interface CadreQualityData {
  id: number;
  name: string;
  employee_no: string;
  department: string;
  position: string;
  match_score: number;
  performance_score: number;  // 近3年A次数
  core_project_count: number;
  quality_type: 'star' | 'potential' | 'stable' | 'adjust';
}

interface QualityPortraitProps {
  data: CadreQualityData[];
}

const QualityPortrait: React.FC<QualityPortraitProps> = ({ data }) => {
  // 统计各类型人数
  const starCount = data.filter(d => d.quality_type === 'star').length;
  const potentialCount = data.filter(d => d.quality_type === 'potential').length;
  const stableCount = data.filter(d => d.quality_type === 'stable').length;
  const adjustCount = data.filter(d => d.quality_type === 'adjust').length;

  // 质量类型散点图配置
  const scatterOption = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const item = data[params.dataIndex];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; margin-bottom: 4px;">${item.name}</div>
            <div style="font-size: 12px; color: #a0a0a0;">
              <div>工号：${item.employee_no}</div>
              <div>部门：${item.department}</div>
              <div>岗位：${item.position}</div>
              <div>匹配度：${item.match_score}分</div>
              <div>绩效A：近3年 ${item.performance_score} 次</div>
              <div>核心项目：${item.core_project_count} 个</div>
            </div>
          </div>
        `;
      },
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
    },
    grid: {
      left: '8%',
      right: '5%',
      bottom: '10%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      name: '人岗匹配度',
      nameLocation: 'middle',
      nameGap: 30,
      nameTextStyle: { color: '#d4af37', fontSize: 14 },
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { color: '#a0a0a0' },
      axisLine: { lineStyle: { color: '#404040' } },
      splitLine: {
        lineStyle: { color: '#303040', type: 'dashed' },
      },
      // 添加80分参考线
      markLine: {
        silent: true,
        lineStyle: { color: '#d4af37', type: 'solid', width: 2 },
        label: { show: true, position: 'end', formatter: '高匹配线80分', color: '#d4af37' },
        data: [{ xAxis: 80 }],
      },
    },
    yAxis: {
      name: '近3年绩效A次数',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: '#d4af37', fontSize: 14 },
      type: 'value',
      min: 0,
      max: Math.max(...data.map(d => d.performance_score), 3) + 1,
      axisLabel: { color: '#a0a0a0' },
      axisLine: { lineStyle: { color: '#404040' } },
      splitLine: { lineStyle: { color: '#303040' } },
      // 添加2次参考线
      markLine: {
        silent: true,
        lineStyle: { color: '#22c55e', type: 'solid', width: 2 },
        label: { show: true, position: 'end', formatter: '高绩效线≥2次', color: '#22c55e' },
        data: [{ yAxis: 2 }],
      },
    },
    visualMap: {
      show: false,
      dimension: 2, // 使用第三维（核心项目数）来决定大小
      min: 0,
      max: Math.max(...data.map(d => d.core_project_count), 3),
      inRange: {
        symbolSize: [10, 50],
      },
    },
    series: [
      {
        name: '人才质量',
        type: 'scatter',
        data: data.map(item => [item.match_score, item.performance_score, item.core_project_count]),
        itemStyle: (params: any) => {
          const item = data[params.dataIndex];
          switch (item.quality_type) {
            case 'star':
              return { color: '#ef4444' };  // 红色 - 明星干部
            case 'potential':
              return { color: '#22c55e' };  // 绿色 - 潜力干部
            case 'stable':
              return { color: '#3b82f6' };  // 蓝色 - 稳健干部
            case 'adjust':
              return { color: '#94a3b8' };  // 灰色 - 需调整
            default:
              return { color: '#6b7280' };
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(212, 175, 55, 0.5)',
          },
          label: { show: true, color: '#d4af37', formatter: '{@[1]}' },
        },
        label: {
          show: false,
        },
      },
    ],
  };

  // 饼图配置 - 质量分布
  const pieOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(19, 23, 41, 0.95)',
      borderColor: 'rgba(212, 175, 55, 0.3)',
      textStyle: { color: '#e0e0e0' },
      formatter: '{b}: {c}人 ({d}%)',
    },
    legend: {
      bottom: '0%',
      left: 'center',
      textStyle: { color: '#a0a0a0', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    series: [
      {
        name: '人才质量分布',
        type: 'pie',
        radius: ['35%', '60%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#131729',
          borderWidth: 2,
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{c}人 ({d}%)',
          color: '#a0a0a0',
          fontSize: 10,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#d4af37',
          },
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          lineStyle: { color: '#404040' },
        },
        data: [
          {
            value: starCount,
            name: '明星人才',
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
            value: potentialCount,
            name: '潜力人才',
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
            value: stableCount,
            name: '稳健人才',
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
          {
            value: adjustCount,
            name: '需调整',
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 1,
                colorStops: [
                  { offset: 0, color: '#94a3b8' },
                  { offset: 1, color: '#64748b' }
                ]
              },
              shadowColor: 'rgba(148, 163, 184, 0.5)',
              shadowBlur: 10,
            }
          },
        ],
      },
    ],
  };

  // 获取质量类型的标签和颜色
  const getQualityTypeInfo = (type: string) => {
    switch (type) {
      case 'star':
        return { label: '明星人才', color: '#ef4444', desc: '高匹配+高绩效' };
      case 'potential':
        return { label: '潜力人才', color: '#22c55e', desc: '可重点培养' };
      case 'stable':
        return { label: '稳健人才', color: '#3b82f6', desc: '表现稳定' };
      case 'adjust':
        return { label: '需调整', color: '#94a3b8', desc: '需要关注' };
      default:
        return { label: '未知', color: '#6b7280', desc: '' };
    }
  };

  return (
    <div className="quality-portrait-container">
      {/* 统计卡片 */}
      <div className="quality-stats-grid">
        <div className="quality-stat-card star">
          <div className="quality-stat-icon">⭐</div>
          <div className="quality-stat-content">
            <div className="quality-stat-value">{starCount}</div>
            <div className="quality-stat-label">明星人才</div>
            <div className="quality-stat-desc">值得重点用</div>
          </div>
        </div>
        <div className="quality-stat-card potential">
          <div className="quality-stat-icon">🚀</div>
          <div className="quality-stat-content">
            <div className="quality-stat-value">{potentialCount}</div>
            <div className="quality-stat-label">潜力人才</div>
            <div className="quality-stat-desc">可重点培养</div>
          </div>
        </div>
        <div className="quality-stat-card stable">
          <div className="quality-stat-icon">📊</div>
          <div className="quality-stat-content">
            <div className="quality-stat-value">{stableCount}</div>
            <div className="quality-stat-label">稳健人才</div>
            <div className="quality-stat-desc">表现稳定</div>
          </div>
        </div>
        <div className="quality-stat-card adjust">
          <div className="quality-stat-icon">⚠️</div>
          <div className="quality-stat-content">
            <div className="quality-stat-value">{adjustCount}</div>
            <div className="quality-stat-label">需调整</div>
            <div className="quality-stat-desc">需要关注</div>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="quality-charts-grid">
        <div className="quality-chart-card">
          <h3 className="quality-chart-title">人才质量分布</h3>
          <div className="quality-chart-content">
            <ReactECharts option={pieOption} style={{ height: '260px' }} />
          </div>
        </div>
        <div className="quality-chart-card">
          <h3 className="quality-chart-title">质量画像散点图</h3>
          <div className="quality-chart-content">
            <ReactECharts option={scatterOption} style={{ height: '260px' }} />
          </div>
        </div>
      </div>

      {/* 干部列表 */}
      <div className="quality-cadres-section">
        <h3 className="quality-section-title">人才质量详情</h3>
        <div className="quality-cadres-table">
          <div className="quality-table-header">
            <div className="quality-table-cell">姓名</div>
            <div className="quality-table-cell">工号</div>
            <div className="quality-table-cell">部门</div>
            <div className="quality-table-cell">岗位</div>
            <div className="quality-table-cell">匹配度</div>
            <div className="quality-table-cell">绩效A</div>
            <div className="quality-table-cell">核心项目</div>
            <div className="quality-table-cell">质量类型</div>
          </div>
          <div className="quality-table-body">
            {data.length === 0 ? (
              <div className="quality-table-empty">暂无数据</div>
            ) : (
              data.map((item) => {
                const typeInfo = getQualityTypeInfo(item.quality_type);
                return (
                  <div key={item.id} className="quality-table-row">
                    <div className="quality-table-cell">
                      <span className="cadre-name">{item.name}</span>
                    </div>
                    <div className="quality-table-cell">{item.employee_no}</div>
                    <div className="quality-table-cell">{item.department}</div>
                    <div className="quality-table-cell">{item.position}</div>
                    <div className="quality-table-cell">
                      <span className={`score-value ${item.match_score >= 80 ? 'high' : item.match_score >= 60 ? 'medium' : 'low'}`}>
                        {item.match_score}
                      </span>
                    </div>
                    <div className="quality-table-cell">{item.performance_score}次</div>
                    <div className="quality-table-cell">{item.core_project_count}个</div>
                    <div className="quality-table-cell">
                      <span
                        className="quality-type-badge"
                        style={{ backgroundColor: typeInfo.color }}
                      >
                        {typeInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityPortrait;
