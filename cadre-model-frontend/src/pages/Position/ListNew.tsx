import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusOutlined,
  TrophyOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Input, Select, Button, Popconfirm, message, Pagination } from 'antd';
import ScrollReveal from '@/components/ui/ScrollReveal';
import CardGrid from '@/components/ui/CardGrid';
import { positionApi } from '@/services/positionApi';
import type { PositionInfo } from '@/types';
import './ListNew.css';

const { Search } = Input;

const PositionListNew = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PositionInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [positionName, setPositionName] = useState('');
  const prevPageRef = useRef<number>(1);

  const fetchData = async () => {
    const isPageChange = prevPageRef.current !== page;
    setLoading(true);
    try {
      const response = await positionApi.getList({
        page,
        page_size: pageSize,
        position_name: positionName || undefined,
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
      console.error('Failed to fetch position list:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, pageSize]);

  const handleSearch = () => {
    setPage(1);
    fetchData();
  };

  const handleReset = () => {
    setPositionName('');
    setPage(1);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    try {
      await positionApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete position:', error);
    }
  };

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  // Position card component
  const PositionCard = ({ position, index }: { position: PositionInfo; index: number }) => {
    const statusConfig = {
      1: { label: '启用中', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)' },
      0: { label: '已停用', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
    };
    const statusInfo = statusConfig[position.status as keyof typeof statusConfig] || statusConfig[0];

    return (
      <div
        className="position-card"
        onClick={() => navigate(`/position/${position.id}`)}
      >
        <div className="position-card-bg"></div>

        {/* Card Actions - Top Right */}
        <div className="position-card-actions">
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/position/${position.id}/edit`);
            }}
            title="编辑"
          >
            <EditOutlined />
          </button>
          <Popconfirm
            title="确定要删除这个岗位吗？"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDelete(position.id);
            }}
            onCancel={(e) => e?.stopPropagation()}
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

        {/* Card Header */}
        <div className="position-card-header">
          <div className="position-card-icon">
            <TrophyOutlined />
          </div>
          <span className="position-card-status" style={{ color: statusInfo.color, background: statusInfo.bg }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Card Content */}
        <h3 className="position-card-name">
          {position.position_name}
          {position.is_key_position && (
            <span className="position-card-key-badge">关键岗位</span>
          )}
        </h3>

        {/* 岗位职责 */}
        {position.responsibility && (
          <div className="position-card-responsibility">
            {position.responsibility}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="position-list-page">
      <div className="container">
        {/* Search and Filter Bar */}
        <ScrollReveal>
          <div className="search-bar">
            <div className="search-main">
              <Search
                placeholder="搜索岗位名称..."
                allowClear
                size="large"
                className="search-input"
                onSearch={handleSearch}
                onChange={(e) => setPositionName(e.target.value)}
                onPressEnter={handleSearch}
              />
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              className="add-btn"
              onClick={() => navigate('/position/create')}
            >
              新增岗位
            </Button>
          </div>
        </ScrollReveal>

        {/* Position Cards Grid */}
        <div className="position-container">
          {isInitialLoad && loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>加载中...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="empty-state">
              <TrophyOutlined />
              <p>暂无岗位数据</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                {data.map((position, index) => (
                  <PositionCard key={`${position.id}-${page}`} position={position} index={index} />
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
                    pageSizeOptions={['12', '24', '48', '96']}
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
  );
};

export default PositionListNew;
