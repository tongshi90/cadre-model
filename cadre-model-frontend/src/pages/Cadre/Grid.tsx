import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Popconfirm, message, Pagination, Tree, Button } from 'antd';
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { cadreApi, departmentApi } from '@/services/api';
import type { CadreBasicInfo } from '@/types';
import type { DataNode } from 'antd/es/tree';
import './Grid.css';

const { Search } = Input;

interface Department {
  id: number;
  name: string;
  children?: Department[];
}

const CadreGrid = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CadreBasicInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const prevPageRef = useRef<number>(1);
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState<number | undefined>();
  const [departmentTree, setDepartmentTree] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>();
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['all']);

  // 获取部门树
  useEffect(() => {
    const fetchDepartmentTree = async () => {
      try {
        const response = await departmentApi.getTree();
        const depts = response.data.data || [];
        setDepartmentTree(depts);

        // 收集所有部门ID用于展开
        const collectKeys = (deps: Department[]): React.Key[] => {
          const keys: React.Key[] = [];
          deps.forEach(dept => {
            keys.push(dept.id);
            if (dept.children) {
              keys.push(...collectKeys(dept.children));
            }
          });
          return keys;
        };

        setExpandedKeys(['all', ...collectKeys(depts)]);
      } catch (error) {
        console.error('Failed to fetch department tree:', error);
      }
    };
    fetchDepartmentTree();
  }, []);

  // 将部门树转换为 Tree 组件需要的格式
  const convertToTreeData = (depts: Department[]): DataNode[] => {
    return depts.map(dept => ({
      title: dept.name,
      key: dept.id,
      children: dept.children ? convertToTreeData(dept.children) : undefined,
    }));
  };

  const treeData: DataNode[] = [
    { title: '全部部门', key: 'all', children: convertToTreeData(departmentTree) }
  ];

  const fetchData = async () => {
    const isPageChange = prevPageRef.current !== page;
    setLoading(true);
    try {
      const response = await cadreApi.getList({
        page,
        page_size: pageSize,
        name,
        department: departmentId ? String(departmentId) : undefined,
      });
      setData(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
      setIsInitialLoad(false);

      // Scroll to top after data is loaded (only on page change, not initial load)
      if (!isInitialLoad && isPageChange) {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
      }

      prevPageRef.current = page;
    } catch (error) {
      console.error('Failed to fetch cadre list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize, departmentId]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setName('');
    setDepartmentId(undefined);
    setSelectedDepartmentId(undefined);
    setPage(1);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    try {
      await cadreApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
      console.error('Failed to delete cadre:', error);
    }
  };

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  // 处理部门树选择
  const handleDepartmentSelect = (selectedKeys: React.Key[], info: any) => {
    const key = selectedKeys[0];
    if (key === 'all' || key === undefined) {
      setDepartmentId(undefined);
      setSelectedDepartmentId(undefined);
    } else {
      setDepartmentId(Number(key));
      setSelectedDepartmentId(Number(key));
    }
    setPage(1);
  };

  // 干部卡片组件
  const CadreCard = ({ cadre }: { cadre: CadreBasicInfo }) => {
    const statusConfig = {
      1: { label: '在职', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
      2: { label: '离职', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' },
      3: { label: '退休', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
    };

    const statusInfo = statusConfig[cadre.status as keyof typeof statusConfig] || statusConfig[3];
    return (
      <div className="cadre-card" onClick={() => navigate(`/cadre/${cadre.id}`)}>
        <div className="cadre-card-bg"></div>
        <div className="cadre-card-header">
          <div className="cadre-card-avatar">
            <UserOutlined />
            <span className={`cadre-card-status`} style={{ color: statusInfo.color, background: statusInfo.bg }}>
              {statusInfo.label}
            </span>
          </div>
        </div>
        <h3 className="cadre-card-name">
          {cadre.name}
          {cadre.position && (
            <span className="cadre-card-position">{cadre.position.position_name}</span>
          )}
        </h3>
        <div className="cadre-card-meta">
          <div className="meta-item">
            <span className="meta-label">工号</span>
            <span className="meta-value">{cadre.employee_no}</span>
          </div>
          {cadre.job_grade && (
            <div className="meta-item">
              <span className="meta-label">岗级</span>
              <span className="meta-value">{cadre.job_grade}</span>
            </div>
          )}
          {cadre.management_level && (
            <div className="meta-item">
              <span className="meta-label">管理层级</span>
              <span className="meta-value">{cadre.management_level}</span>
            </div>
          )}
          <div className="meta-item">
            <span className="meta-label">性别</span>
            <span className="meta-value">{cadre.gender || '-'}</span>
          </div>
        </div>

        <div className="cadre-card-footer">
          <span className="cadre-card-department">
            {cadre.department?.name || '未分配部门'}
          </span>
        </div>
        <div className="cadre-card-actions">
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cadre/${cadre.id}/edit`);
            }}
            title="编辑"
          >
            <EditOutlined />
          </button>
          <Popconfirm
            title="确认删除"
            description="确定要删除该干部信息吗？"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(cadre.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
            okText="确定"
            cancelText="取消"
          >
            <button
              className="action-btn action-btn-delete"
              onClick={(e) => e.stopPropagation()}
              title="删除"
            >
              <DeleteOutlined />
            </button>
          </Popconfirm>
        </div>
      </div>
    );
  };

  return (
    <div className="cadre-grid-page">
      <div className="cadre-grid-layout">
        {/* 左侧部门树 */}
        <div className="department-sidebar">
          <div className="sidebar-header">
            <ApartmentOutlined />
            <span>部门组织</span>
          </div>
          <div className="department-tree-container">
            <Tree
              treeData={treeData}
              expandedKeys={expandedKeys}
              selectedKeys={selectedDepartmentId ? [selectedDepartmentId] : []}
              onSelect={handleDepartmentSelect}
              onExpand={setExpandedKeys}
              showIcon={false}
              className="glass-tree"
            />
          </div>
        </div>

        {/* 右侧干部卡片区域 */}
        <div className="cadre-content">
          {/* 搜索和筛选栏 */}
          <div className="search-bar">
            <Search
              placeholder="搜索姓名..."
              allowClear
              size="large"
              className="search-input"
              onSearch={handleSearch}
              onChange={(e) => setName(e.target.value)}
              onPressEnter={handleSearch}
              style={{ flex: 1, maxWidth: '400px' }}
            />
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => navigate('/cadre/create')}
              className="add-btn"
            >
              新增干部
            </Button>
          </div>

          {/* 干部卡片网格 */}
          <div className="cadre-container">
            {isInitialLoad && loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>加载中...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="empty-state">
                <UserOutlined />
                <p>暂无数据</p>
              </div>
            ) : (
              <>
                <div className="card-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '12px'
                }}>
                  {data.map((cadre) => (
                    <CadreCard key={cadre.id} cadre={cadre}  />
                  ))}
                </div>

                {/* 分页器 */}
                {total > 0 && (
                  <div className="pagination-container">
                    <Pagination
                      current={page}
                      pageSize={pageSize}
                      total={total}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(total, range) => (
                        <span className="pagination-total">
                          共 <span className="total-number">{total}</span> 条记录
                          <span style={{ margin: '0 8px', color: 'var(--color-text-tertiary)' }}>|</span>
                          第 <span className="total-number">{range[0]}-{range[1]}</span> 条
                        </span>
                      )}
                      pageSizeOptions={['15', '30', '45', '60']}
                      onChange={handlePageChange}
                      className="glass-pagination"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadreGrid;
