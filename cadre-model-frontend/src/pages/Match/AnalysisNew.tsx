import { useState, useEffect, useRef } from 'react';
import { Form, Select, Button, Table, Tag, TreeSelect, message, Tabs } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { positionApi } from '@/services/positionApi';
import { matchApi } from '@/services/matchApi';
import { cadreApi } from '@/services/api';
import { departmentApi } from '@/services/departmentApi';
import type { PositionInfo, CadreBasicInfo, MatchResult } from '@/types';
import { getMatchLevelText } from '@/utils/helpers';
import './Analysis.css';

const MATCH_RESULTS_KEY = 'match_analysis_results';
const CURRENT_TAB_KEY = 'match_analysis_current_tab';
const CURRENT_RESULTS_KEY = 'match_analysis_current_results';
const CUSTOM_RESULTS_KEY = 'match_analysis_custom_results';

interface TreeNode {
  title: string;
  value: string;
  key: string;
  children?: TreeNode[];
}

// 从 sessionStorage 初始化状态的函数
const getInitialState = () => {
  const savedTab = sessionStorage.getItem(CURRENT_TAB_KEY);
  const tab = savedTab || 'current';
  const savedResultsKey = tab === 'current' ? CURRENT_RESULTS_KEY : CUSTOM_RESULTS_KEY;
  const savedResults = sessionStorage.getItem(savedResultsKey);

  let initialResults: MatchResult[] = [];
  if (savedResults) {
    try {
      initialResults = JSON.parse(savedResults);
    } catch (error) {
      console.error('Failed to parse saved results:', error);
    }
  }

  return {
    activeTab: tab,
    results: initialResults,
    hasStoredData: !!savedTab  // 是否有存储的数据（从详情页返回）
  };
};

const MatchAnalysis = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const initialState = getInitialState();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<PositionInfo[]>([]);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [cadres, setCadres] = useState<CadreBasicInfo[]>([]);
  const [results, setResults] = useState<MatchResult[]>(initialState.results);
  const [activeTab, setActiveTab] = useState(initialState.activeTab);
  // 标记是否从存储恢复的数据
  const [isRestored, setIsRestored] = useState(initialState.hasStoredData);

  // 查看干部详情
  const handleViewDetail = (record: MatchResult) => {
    // 保存当前 Tab 和对应的结果
    sessionStorage.setItem(CURRENT_TAB_KEY, activeTab);
    if (activeTab === 'current') {
      sessionStorage.setItem(CURRENT_RESULTS_KEY, JSON.stringify(results));
    } else {
      sessionStorage.setItem(CUSTOM_RESULTS_KEY, JSON.stringify(results));
    }
    navigate(`/cadre/${record.cadre.id}`, { state: { fromMatch: true } });
  };

  // 获取岗位列表
  const fetchPositions = async () => {
    try {
      const response = await positionApi.getAll();
      setPositions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  // 获取干部列表
  const fetchCadres = async () => {
    try {
      const response = await cadreApi.getList({ page: 1, page_size: 1000, status: 1 });
      setCadres(response.data.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch cadres:', error);
    }
  };

  // 构建部门树状结构（只包含部门）
  const buildTreeData = async () => {
    try {
      const deptResponse = await departmentApi.getTree();
      const departments = deptResponse.data.data || [];

      const buildNode = (dept: any): TreeNode => {
        const node: TreeNode = {
          title: dept.name,
          value: `dept_${dept.id}`,
          key: `dept_${dept.id}`,
        };

        if (dept.children && dept.children.length > 0) {
          node.children = dept.children.map((child: any) => buildNode(child));
        }

        return node;
      };

      const deptTree = departments.map((dept: any) => buildNode(dept));

      const rootNode: TreeNode = {
        title: '全部',
        value: 'dept_all',
        key: 'dept_all',
        children: deptTree,
      };

      setTreeData([rootNode]);
    } catch (error) {
      console.error('Failed to build tree data:', error);
    }
  };

  // 执行干部当前岗位匹配分析
  const handleAnalyzeCurrentPosition = async () => {
    setLoading(true);
    setResults([]);

    try {
      const response = await matchApi.batchCalculateCurrent();
      const matchData = response.data.data?.results || [];

      setResults(matchData);
      // 保存结果到 sessionStorage
      sessionStorage.setItem(CURRENT_RESULTS_KEY, JSON.stringify(matchData));
      message.success(`成功分析 ${matchData.length} 名干部`);
    } catch (error) {
      console.error('Failed to analyze current position match:', error);
      message.error('匹配分析失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取已保存的干部当前岗位匹配结果
  const fetchCurrentPositionResults = async () => {
    setLoading(true);

    try {
      const response = await matchApi.getCurrentPositionResults();
      const matchData = response.data.data || [];

      setResults(matchData);
    } catch (error) {
      console.error('Failed to fetch current position match results:', error);
      message.error('获取匹配结果失败');
    } finally {
      setLoading(false);
    }
  };

  // 执行自定义匹配分析
  const handleCustomAnalyze = async () => {
    const positionId = form.getFieldValue('position_id');
    const selectedDepartment = form.getFieldValue('department_id');
    const selectedCadres = form.getFieldValue('cadre_ids') as number[] | undefined;

    if (!positionId) {
      message.error('请选择岗位');
      return;
    }

    // 检查是否选择了部门或干部
    if (!selectedDepartment && (!selectedCadres || selectedCadres.length === 0)) {
      message.error('请选择部门或干部');
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      let cadreIdsToAnalyze: number[] = [];

      // 如果选择了干部，以干部选择为准
      if (selectedCadres && selectedCadres.length > 0) {
        cadreIdsToAnalyze = selectedCadres;
      } else if (selectedDepartment) {
        // 只选择了部门，获取该部门下的所有干部
        const allCadres = cadres;

        if (selectedDepartment === 'dept_all') {
          cadreIdsToAnalyze = allCadres.map((c: CadreBasicInfo) => c.id);
        } else {
          const deptId = parseInt(selectedDepartment.split('_')[1]);
          const getCadreIdsByDepartment = (dept: any, targetDeptId: number): number[] => {
            if (dept.id === targetDeptId) {
              return allCadres
                .filter((c: CadreBasicInfo) => {
                  const isCadreInDept = (c: CadreBasicInfo, currentDept: any): boolean => {
                    if (c.department?.id === currentDept.id) return true;
                    if (currentDept.children) {
                      return currentDept.children.some((child: any) => isCadreInDept(c, child));
                    }
                    return false;
                  };
                  return isCadreInDept(c, dept);
                })
                .map((c: CadreBasicInfo) => c.id);
            }

            if (dept.children && dept.children.length > 0) {
              for (const child of dept.children) {
                const result = getCadreIdsByDepartment(child, targetDeptId);
                if (result.length > 0) return result;
              }
            }

            return [];
          };

          const deptResponse = await departmentApi.getTree();
          const departments = deptResponse.data.data || [];

          for (const dept of departments) {
            cadreIdsToAnalyze = getCadreIdsByDepartment(dept, deptId);
            if (cadreIdsToAnalyze.length > 0) break;
          }
        }
      }

      if (cadreIdsToAnalyze.length === 0) {
        message.warning('没有找到在职干部');
        setLoading(false);
        return;
      }

      // 使用批量计算API
      const response = await matchApi.batchCalculateCadres(positionId, cadreIdsToAnalyze);
      const matchData = response.data.data?.results || [];

      setResults(matchData);
      // 保存结果到 sessionStorage
      sessionStorage.setItem(CUSTOM_RESULTS_KEY, JSON.stringify(matchData));

      message.success(`成功匹配 ${matchData.length} 名干部`);
    } catch (error) {
      console.error('Failed to analyze match:', error);
      message.error('匹配分析失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchCadres();

    // 如果是从详情页返回（有存储的数据），清除存储的 key
    if (isRestored) {
      sessionStorage.removeItem(CURRENT_TAB_KEY);
      // 重置标志
      setIsRestored(false);
    } else if (activeTab === 'current' && results.length === 0) {
      // 初次加载且是当前岗位 Tab 时，获取匹配结果
      fetchCurrentPositionResults();
    }
  }, []);

  useEffect(() => {
    if (cadres.length > 0) {
      buildTreeData();
    }
  }, [cadres]);

  // 表格列定义（当前岗位匹配 - 添加当前岗位列）
  const currentPositionColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <div className={index < 3 ? `rank-badge top-${index + 1}` : 'rank-badge'}>
          {index + 1}
        </div>
      ),
    },
    {
      title: '工号',
      dataIndex: ['cadre', 'employee_no'],
      key: 'employee_no',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: ['cadre', 'name'],
      key: 'name',
      width: 100,
    },
    {
      title: '当前岗位',
      dataIndex: ['position', 'position_name'],
      key: 'position_name',
      width: 150,
    },
    {
      title: '部门',
      dataIndex: ['cadre', 'department', 'name'],
      key: 'department',
      width: 150,
    },
    {
      title: '基础得分',
      dataIndex: 'base_score',
      key: 'base_score',
      width: 100,
      render: (score: number) => <span className="score-base">{score?.toFixed(2)}</span>,
    },
    {
      title: '扣分',
      dataIndex: 'deduction_score',
      key: 'deduction_score',
      width: 80,
      render: (score: number) => (
        <span className={score > 0 ? 'score-deduction' : 'score-zero'}>
          {score > 0 ? `-${score.toFixed(2)}` : '0.00'}
        </span>
      ),
    },
    {
      title: '最终得分',
      dataIndex: 'final_score',
      key: 'final_score',
      width: 100,
      render: (score: number, record: MatchResult) => (
        <div className="final-score-cell">
          <span className={`score-final level-${record.match_level}`}>
            {score?.toFixed(2) || '-'}
          </span>
        </div>
      ),
    },
    {
      title: '匹配等级',
      dataIndex: 'match_level',
      key: 'match_level',
      width: 100,
      render: (level: string) => (
        <Tag className={`match-level-tag level-${level}`}>
          {getMatchLevelText(level)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: MatchResult) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleViewDetail(record)}
          className="view-detail-link"
        >
          查看详情
        </Button>
      ),
    },
  ];

  // 表格列定义（自定义匹配 - 显示目标岗位）
  const customMatchColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      render: (_: any, __: any, index: number) => (
        <div className={index < 3 ? `rank-badge top-${index + 1}` : 'rank-badge'}>
          {index + 1}
        </div>
      ),
    },
    {
      title: '工号',
      dataIndex: ['cadre', 'employee_no'],
      key: 'employee_no',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: ['cadre', 'name'],
      key: 'name',
      width: 100,
    },
    {
      title: '当前岗位',
      dataIndex: ['cadre', 'position', 'position_name'],
      key: 'current_position',
      width: 120,
      render: (name: string) => name || '未分配',
    },
    {
      title: '部门',
      dataIndex: ['cadre', 'department', 'name'],
      key: 'department',
      width: 120,
    },
    {
      title: '基础得分',
      dataIndex: 'base_score',
      key: 'base_score',
      width: 90,
      render: (score: number) => <span className="score-base">{score?.toFixed(2)}</span>,
    },
    {
      title: '扣分',
      dataIndex: 'deduction_score',
      key: 'deduction_score',
      width: 70,
      render: (score: number) => (
        <span className={score > 0 ? 'score-deduction' : 'score-zero'}>
          {score > 0 ? `-${score.toFixed(2)}` : '0.00'}
        </span>
      ),
    },
    {
      title: '最终得分',
      dataIndex: 'final_score',
      key: 'final_score',
      width: 90,
      render: (score: number, record: MatchResult) => (
        <div className="final-score-cell">
          <span className={`score-final level-${record.match_level}`}>
            {score?.toFixed(2) || '-'}
          </span>
        </div>
      ),
    },
    {
      title: '匹配等级',
      dataIndex: 'match_level',
      key: 'match_level',
      width: 90,
      render: (level: string) => (
        <Tag className={`match-level-tag level-${level}`}>
          {getMatchLevelText(level)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: MatchResult) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleViewDetail(record)}
          className="view-detail-link"
        >
          查看详情
        </Button>
      ),
    },
  ];

  const stats = {
    total: results.length,
    excellent: results.filter(r => r.match_level === 'excellent').length,
    qualified: results.filter(r => r.match_level === 'qualified').length,
    unqualified: results.filter(r => r.match_level === 'unqualified').length,
  };

  const selectedPosition = positions.find(p => p.id === form.getFieldValue('position_id'));

  // 当前岗位匹配Tab内容
  const CurrentPositionTab = () => {
    const hasResults = results.length > 0;

    return (
      <div>
        {/* 无数据时显示大按钮 */}
        {!hasResults && !loading && (
          <div className="analysis-empty-state glass-card">
            <div className="empty-state-content">
              <div className="empty-state-icon">
                <TeamOutlined />
              </div>
              <h2 className="empty-state-title">干部岗位匹配度分析</h2>
              <p className="empty-state-description">
                分析所有在职干部与其当前所在岗位的匹配度，帮助您了解干部与岗位的契合程度
              </p>
              <div className="empty-state-tips">
                <p>分析将包含：</p>
                <ul>
                  <li>能力维度匹配分析</li>
                  <li>硬性要求检查</li>
                  <li>综合评分与等级评定</li>
                </ul>
              </div>
              <Button
                type="primary"
                onClick={handleAnalyzeCurrentPosition}
                loading={loading}
                size="large"
                className="start-analysis-btn"
              >
                开始匹配分析
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 自定义匹配Tab内容
  const CustomMatchTab = () => (
    <div>
      <div className="analysis-control-panel">
        <Form form={form} layout="inline" className="analysis-form">
          <Form.Item label="目标岗位" name="position_id">
            <Select
              placeholder="请选择岗位"
              showSearch
              optionFilterProp="children"
              style={{ width: 200 }}
            >
              {positions.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.position_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="选择部门"
            name="department_id"
            tooltip="选择部门则批量分析该部门下所有干部"
          >
            <TreeSelect
              placeholder="选择部门"
              treeDefaultExpandAll
              showSearch
              allowClear
              treeData={treeData}
              style={{ width: 220 }}
            />
          </Form.Item>

          <Form.Item
            label="选择干部"
            name="cadre_ids"
            tooltip="支持多选，如果同时选择部门和干部，以干部选择为准"
          >
            <Select
              mode="multiple"
              placeholder="选择干部（可多选）"
              showSearch
              allowClear
              optionFilterProp="label"
              style={{ width: 300 }}
              options={cadres.map(c => ({
                label: `${c.name} (${c.employee_no}) - ${c.department?.name || '未分配部门'}`,
                value: c.id,
              }))}
              maxTagCount="responsive"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              onClick={handleCustomAnalyze}
              loading={loading}
            >
              分析
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'current',
      label: '干部当前岗位匹配',
      children: <CurrentPositionTab />,
    },
    {
      key: 'custom',
      label: '自定义匹配',
      children: <CustomMatchTab />,
    },
  ];

  return (
    <div className="match-analysis-page">
      <div className="analysis-container">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key);
            // Tab 切换时，先尝试从 sessionStorage 恢复数据
            const savedResultsKey = key === 'current' ? CURRENT_RESULTS_KEY : CUSTOM_RESULTS_KEY;
            const savedResults = sessionStorage.getItem(savedResultsKey);
            if (savedResults) {
              try {
                setResults(JSON.parse(savedResults));
              } catch (error) {
                console.error('Failed to restore match results:', error);
                setResults([]);
                // 如果是当前岗位匹配 Tab 且没有保存的数据，则获取
                if (key === 'current') {
                  fetchCurrentPositionResults();
                }
              }
            } else {
              setResults([]);
              // 如果是当前岗位匹配 Tab 且没有保存的数据，则获取
              if (key === 'current') {
                fetchCurrentPositionResults();
              }
            }
          }}
          items={tabItems}
          className="analysis-tabs"
        />

        {/* 统计概览 */}
        {results.length > 0 && (
          <div className="analysis-summary glass-card">
            <div className="summary-header">
              <span className="summary-title">
                {activeTab === 'current' ? '干部当前岗位' : (
                  <span className="summary-position">{selectedPosition?.position_name}</span>
                )}
                匹配结果
              </span>
              <div className="summary-header-right">
                <span className="summary-count">共 {stats.total} 人</span>
                {activeTab === 'current' && (
                  <Button
                    type="primary"
                    size="small"
                    onClick={handleAnalyzeCurrentPosition}
                    loading={loading}
                  >
                    重新分析
                  </Button>
                )}
              </div>
            </div>

            <div className="summary-stats">
              <div className="stat-item">
                <span className="stat-value excellent">{stats.excellent}</span>
                <span className="stat-label">优质</span>
              </div>
              <div className="stat-item">
                <span className="stat-value qualified">{stats.qualified}</span>
                <span className="stat-label">合格</span>
              </div>
              <div className="stat-item">
                <span className="stat-value unqualified">{stats.unqualified}</span>
                <span className="stat-label">不合格</span>
              </div>
              <div className="stat-item">
                <span className="stat-value avg">
                  {results.length > 0
                    ? (results.reduce((sum, r) => sum + (r.final_score || 0), 0) / results.length).toFixed(1)
                    : 0}
                </span>
                <span className="stat-label">平均分</span>
              </div>
            </div>
          </div>
        )}

        {/* 结果表格 */}
        {results.length > 0 && !loading && (
          <div className="analysis-results glass-card">
            <Table
              columns={activeTab === 'current' ? currentPositionColumns : customMatchColumns}
              dataSource={results}
              rowKey="id"
              pagination={false}
              size="small"
              className="match-results-table"
            />
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="analysis-loading glass-card">
            <div className="loading-spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        )}

        {/* 空状态 - 只在自定义匹配Tab时显示 */}
        {!loading && results.length === 0 && activeTab === 'custom' && (
          <div className="analysis-empty glass-card">
            <TeamOutlined className="empty-icon" />
            <p className="empty-text">选择岗位和部门/干部后开始分析</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchAnalysis;
