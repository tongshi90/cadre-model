import { useState } from 'react';
import { Form, Input, Button, Card, message, Space, Switch } from 'antd';
import { useNavigate } from 'react-router-dom';
import { positionApi } from '@/services/positionApi';
import '../Cadre/Form.css';

const PositionCreate = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await positionApi.create(values);
      message.success('创建成功');
      navigate('/position');
    } catch (error) {
      console.error('Failed to create position:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <Input placeholder="请输入岗位编码" autoComplete="off" />
              </Form.Item>

              <Form.Item
                label="岗位名称"
                name="position_name"
                rules={[{ required: true, message: '请输入岗位名称' }]}
              >
                <Input placeholder="请输入岗位名称" autoComplete="off" />
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

              <Form.Item label="备注" name="remark" className="full-width">
                <Input.TextArea rows={3} placeholder="请输入备注" autoComplete="off" />
              </Form.Item>
            </div>
          </div>

          {/* 操作按钮 */}
          <Form.Item>
            <Space size={8}>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
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

export default PositionCreate;
