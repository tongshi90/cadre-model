import { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Space, Switch } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { positionApi } from '@/services/positionApi';
import type { PositionInfo } from '@/types';
import '../Cadre/Form.css';

const PositionEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PositionInfo | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const response = await positionApi.getDetail(Number(id));
        const position = response.data.data;
        if (position) {
          setData(position);
          form.setFieldsValue(position);
        }
      } catch (error) {
        console.error('Failed to fetch position:', error);
      }
    };
    fetchData();
  }, [id, form]);

  const onFinish = async (values: any) => {
    if (!id) return;
    setLoading(true);
    try {
      await positionApi.update(Number(id), values);
      message.success('更新成功');
      navigate(`/position/${id}`, { replace: true });
    } catch (error) {
      console.error('Failed to update position:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return <div className="position-form-page">
      <div className="loading-state">加载中...</div>
    </div>;
  }

  return (
    <div className="cadre-form-page">
      <Card className="form-card">
        <Form
          form={form}
          layout="horizontal"
          labelCol={{ style: { width: '65px' } }}
          wrapperCol={{ style: { flex: 1 } }}
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* 基本信息 */}
          <div className="form-section">
            <div className="form-section-title">基本信息</div>
            <div className="form-row">
              <Form.Item
                label="岗位编码"
                name="position_code"
                rules={[{ required: true, message: '请输入岗位编码' }]}
              >
                <Input autoComplete="off" />
              </Form.Item>

              <Form.Item
                label="岗位名称"
                name="position_name"
                rules={[{ required: true, message: '请输入岗位名称' }]}
              >
                <Input autoComplete="off" />
              </Form.Item>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="form-section">
            <div className="form-section-title">详细信息</div>
            <div className="form-row">
              <Form.Item label="岗位职责" name="responsibility" className="full-width">
                <Input.TextArea rows={4} placeholder="请输入岗位职责" autoComplete="off" />
              </Form.Item>
            </div>
          </div>

          {/* 其他信息 */}
          <div className="form-section">
            <div className="form-section-title">其他信息</div>
            <div className="form-row">
              <Form.Item
                label="关键岗位"
                name="is_key_position"
                valuePropName="checked"
              >
                <Switch checkedChildren="是" unCheckedChildren="否" />
              </Form.Item>

              <Form.Item label="状态" name="status">
                <Select placeholder="请选择状态">
                  <Select.Option value={1}>启用</Select.Option>
                  <Select.Option value={0}>停用</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="备注" name="remark" className="full-width">
                <Input.TextArea rows={3} placeholder="请输入备注" autoComplete="off" />
              </Form.Item>
            </div>
          </div>

          {/* 操作按钮 */}
          <Form.Item>
            <Space size={8}>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
              <Button onClick={() => navigate(-1)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default PositionEdit;
