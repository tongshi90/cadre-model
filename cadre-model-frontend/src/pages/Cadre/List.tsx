import { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Space, Popconfirm, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { cadreApi } from '@/services/api';
import GlassCard from '@/components/GlassCard';
import type { CadreBasicInfo } from '@/types';
import { CADRE_STATUS_OPTIONS } from '@/utils/constants';
import './List.css';

const { Search } = Input;
const { Option } = Select;

const CadreList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CadreBasicInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [name, setName] = useState('');
  const [status, setStatus] = useState<number | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await cadreApi.getList({ page, page_size: pageSize, name, status });
      setData(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch cadre list:', error);
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

  const handleDelete = async (id: number) => {
    try {
      await cadreApi.delete(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      console.error('Failed to delete cadre:', error);
    }
  };

  const columns = [
    {
      title: '工号',
      dataIndex: 'employee_no',
      key: 'employee_no',
      width: 120,
      render: (text: string) => <span className="table-mono">{text}</span>,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100,
      render: (text: string) => <span className="table-name">{text}</span>,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 60,
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 60,
      render: (text: number) => <span className="table-mono">{text}</span>,
    },
    {
      title: '学历',
      dataIndex: 'education',
      key: 'education',
      width: 100,
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (department: any) => department?.name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: number) => {
        const option = CADRE_STATUS_OPTIONS.find(opt => opt.value === status);
        const statusClass = status === 1 ? 'status-active' : status === 2 ? 'status-inactive' : 'status-other';
        return (
          <span className={`status-badge ${statusClass}`}>
            {option?.label || '-'}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: CadreBasicInfo) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/cadre/${record.id}`)}
            className="action-button action-view"
          >
            查看
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/cadre/${record.id}/edit`)}
            className="action-button action-edit"
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除该人才信息吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ className: 'popconfirm-ok' }}
          >
            <Button
              size="small"
              icon={<DeleteOutlined />}
              className="action-button action-delete"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="cadre-list-page">
      {/* 搜索卡片 */}
      <GlassCard animate delay={100} className="search-card">
        <div className="search-container">
          <div className="search-filters">
            <div className="filter-group">
              <label className="filter-label">
                <FilterOutlined />
                筛选条件
              </label>
              <div className="filter-inputs">
                <Search
                  placeholder="搜索姓名"
                  allowClear
                  className="search-input"
                  onSearch={handleSearch}
                  onChange={(e) => setName(e.target.value)}
                  onPressEnter={handleSearch}
                />
                <Select
                  placeholder="选择状态"
                  allowClear
                  className="filter-select"
                  popupClassName="glass-dropdown"
                  onChange={setStatus}
                >
                  {CADRE_STATUS_OPTIONS.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="search-actions">
            <Button
              icon={<SearchOutlined />}
              onClick={handleSearch}
              className="search-button"
            >
              查询
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/cadre/create')}
              className="add-button"
            >
              新增人才
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* 数据表格 */}
      <GlassCard animate delay={200} className="table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => (
              <span className="pagination-total">
                共 <span className="total-number">{total}</span> 条记录
                <span style={{ margin: '0 8px', color: 'var(--color-text-tertiary)' }}>|</span>
                第 <span className="total-number">{range[0]}-{range[1]}</span> 条
              </span>
            ),
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
            className: 'glass-pagination',
            position: ['bottomCenter'],
          }}
          className="glass-table"
          rowClassName={(_, index) => `table-row-animate ${index % 2 === 0 ? 'row-even' : 'row-odd'}`}
        />
      </GlassCard>
    </div>
  );
};

export default CadreList;
