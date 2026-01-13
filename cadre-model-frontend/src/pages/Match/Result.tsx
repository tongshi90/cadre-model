import { useState, useEffect } from 'react';
import { Table, Select, Card, Space, Tag, Button } from 'antd';
import { positionApi } from '@/services/positionApi';
import { matchApi } from '@/services/matchApi';
import type { MatchResult } from '@/types';
import { getMatchLevelText, getMatchLevelColor } from '@/utils/helpers';
import { useNavigate } from 'react-router-dom';

const MatchResult = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [data, setData] = useState<MatchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<{
    position_id?: number;
    match_level?: string;
  }>({});

  useEffect(() => {
    fetchPositions();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, filters]);

  const fetchPositions = async () => {
    try {
      const response = await positionApi.getAll();
      setPositions(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch positions:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await matchApi.getResults({
        page,
        page_size: pageSize,
        ...filters,
      });
      setData(response.data.data?.items || []);
      setTotal(response.data.data?.total || 0);
    } catch (error) {
      console.error('Failed to fetch match results:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '岗位',
      dataIndex: ['position', 'position_name'],
      key: 'position_name',
      width: 150,
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
      title: '部门',
      dataIndex: ['cadre', 'department', 'name'],
      key: 'department',
      width: 150,
    },
    {
      title: '最终得分',
      dataIndex: 'final_score',
      key: 'final_score',
      width: 100,
      render: (score: number) => score?.toFixed(2) || '-',
      sorter: true,
    },
    {
      title: '匹配等级',
      dataIndex: 'match_level',
      key: 'match_level',
      width: 100,
      render: (level: string) => (
        <Tag color={getMatchLevelColor(level)}>
          {getMatchLevelText(level)}
        </Tag>
      ),
    },
    {
      title: '计算时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 160,
      render: (time: string) => time?.replace('T', ' ').substring(0, 19) || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: MatchResult) => (
        <Button
          type="link"
          onClick={() => navigate(`/match/results/${record.id}`)}
        >
          查看报告
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="请选择岗位"
            allowClear
            onChange={(value) => setFilters({ ...filters, position_id: value })}
          >
            {positions.map(p => (
              <Select.Option key={p.id} value={p.id}>
                {p.position_name}
              </Select.Option>
            ))}
          </Select>

          <Select
            style={{ width: 120 }}
            placeholder="匹配等级"
            allowClear
            onChange={(value) => setFilters({ ...filters, match_level: value })}
          >
            <Select.Option value="excellent">优质</Select.Option>
            <Select.Option value="qualified">合格</Select.Option>
            <Select.Option value="unqualified">不合格</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => {
              setPage(page);
              setPageSize(pageSize);
            },
          }}
        />
      </Card>
    </div>
  );
};

export default MatchResult;
