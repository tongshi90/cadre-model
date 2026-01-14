import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Descriptions, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { matchApi } from '@/services/matchApi';
import type { MatchResult } from '@/types';
import { getMatchLevelText, getMatchLevelColor } from '@/utils/helpers';

const MatchReport = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // 获取匹配结果
      const resultResponse = await matchApi.getResultDetail(Number(id));
      if (resultResponse.data.data) {
        setResult(resultResponse.data.data);
      }

      // 获取分析报告
      const reportResponse = await matchApi.generateReport(Number(id));
      if (reportResponse.data.data) {
        setReport(reportResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch match report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!result) {
    return <div>加载中...</div>;
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card title="匹配结果概览" loading={loading}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="岗位">{result.position?.position_name}</Descriptions.Item>
          <Descriptions.Item label="干部">{result.cadre?.name} ({result.cadre?.employee_no})</Descriptions.Item>
          <Descriptions.Item label="基础得分">{result.base_score?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="扣分分数">{result.deduction_score?.toFixed(2)}</Descriptions.Item>
          <Descriptions.Item label="最终得分">
            <Tag color="blue" style={{ fontSize: 16 }}>
              {result.final_score?.toFixed(2)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="匹配等级">
            <Tag color={getMatchLevelColor(result.match_level)} style={{ fontSize: 16 }}>
              {getMatchLevelText(result.match_level)}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {report && (
        <>
          <Card title="优势分析" style={{ marginTop: 16 }}>
            <div style={{ whiteSpace: 'pre-line' }}>{report.advantage || '无'}</div>
          </Card>

          <Card title="劣势分析" style={{ marginTop: 16 }}>
            <div style={{ whiteSpace: 'pre-line' }}>{report.weakness || '无'}</div>
          </Card>

          <Card title="改进建议" style={{ marginTop: 16 }}>
            <div style={{ whiteSpace: 'pre-line' }}>{report.suggestions || '无'}</div>
          </Card>
        </>
      )}
    </div>
  );
};

export default MatchReport;
