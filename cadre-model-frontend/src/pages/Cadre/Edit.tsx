import { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Card, message, TreeSelect, Space, Checkbox } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { cadreApi } from '@/services/api';
import { departmentApi } from '@/services/departmentApi';
import { positionApi } from '@/services/positionApi';
import { GENDER_OPTIONS, EDUCATION_OPTIONS, POLITICAL_STATUS_OPTIONS, CADRE_STATUS_OPTIONS, MANAGEMENT_LEVEL_OPTIONS, MANAGEMENT_ATTRIBUTION_OPTIONS } from '@/utils/constants';
import type { CadreBasicInfo, PositionInfo } from '@/types';
import dayjs from 'dayjs';
import './Form.css';

const CadreEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CadreBasicInfo | null>(null);
  const [departmentTree, setDepartmentTree] = useState<any[]>([]);
  const [positionList, setPositionList] = useState<PositionInfo[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const response = await cadreApi.getDetail(Number(id));
        const cadre = response.data.data;
        if (cadre) {
          setData(cadre);
          // 处理日期字段，转换为dayjs对象供DatePicker使用
          const formData = {
            ...cadre,
            birth_date: cadre.birth_date ? dayjs(cadre.birth_date) : undefined,
            entry_date: cadre.entry_date ? dayjs(cadre.entry_date) : undefined,
          };
          form.setFieldsValue(formData);
        }
      } catch (error) {
        console.error('Failed to fetch cadre:', error);
      }
    };
    fetchData();
  }, [id, form]);

  // 获取部门树和岗位列表
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取部门树
        const deptResponse = await departmentApi.getTree();
        const treeData = formatTreeData(deptResponse.data.data || []);
        setDepartmentTree(treeData);

        // 获取岗位列表
        const posResponse = await positionApi.getAll();
        setPositionList(posResponse.data.data || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };
    fetchData();
  }, []);

  // 格式化树形数据为TreeSelect所需格式
  const formatTreeData = (data: any[]): any[] => {
    return data.map(item => ({
      title: item.name,
      value: item.id,
      key: item.id,
      children: item.children ? formatTreeData(item.children) : undefined,
    }));
  };

  const onFinish = async (values: any) => {
    if (!id) return;
    setLoading(true);
    try {
      const data = {
        ...values,
        birth_date: values.birth_date ? values.birth_date.format('YYYY-MM-DD') : null,
        entry_date: values.entry_date ? values.entry_date.format('YYYY-MM-DD') : null,
      };
      await cadreApi.update(Number(id), data);
      message.success('更新成功');
      navigate(`/cadre/${id}`);
    } catch (error) {
      console.error('Failed to update cadre:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return <div className="cadre-form-page">
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
                label="工号"
                name="employee_no"
                rules={[{ required: true, message: '请输入工号' }]}
              >
                <Input autoComplete="off" />
              </Form.Item>

              <Form.Item
                label="姓名"
                name="name"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input autoComplete="off" />
              </Form.Item>

              <Form.Item label="手机号" name="phone">
                <Input placeholder="请输入手机号" autoComplete="off" />
              </Form.Item>

              <Form.Item label="性别" name="gender">
                <Select placeholder="请选择性别" options={GENDER_OPTIONS} />
              </Form.Item>

              <Form.Item label="出生日期" name="birth_date">
                <DatePicker style={{ width: '100%' }} placeholder="请选择出生日期" />
              </Form.Item>
            </div>
          </div>

          {/* 组织信息 */}
          <div className="form-section">
            <div className="form-section-title">组织信息</div>
            <div className="form-row">
              <Form.Item label="部门" name="department_id">
                <TreeSelect
                  placeholder="请选择部门"
                  treeData={departmentTree}
                  allowClear
                  showSearch
                  treeDefaultExpandAll
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="岗位" name="position_id">
                <Select placeholder="请选择岗位" allowClear showSearch optionFilterProp="children">
                  {positionList.map(pos => (
                    <Select.Option key={pos.id} value={pos.id}>
                      {pos.position_name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="岗级" name="job_grade">
                <Input placeholder="请输入岗级" autoComplete="off" />
              </Form.Item>

              <Form.Item label="管理层级" name="management_level">
                <Select placeholder="请选择管理层级" options={MANAGEMENT_LEVEL_OPTIONS} />
              </Form.Item>

              <Form.Item label="管理归属" name="management_attribution">
                <Select placeholder="请选择管理归属" options={MANAGEMENT_ATTRIBUTION_OPTIONS} />
              </Form.Item>
            </div>
          </div>

          {/* 教育背景 */}
          <div className="form-section">
            <div className="form-section-title">教育背景</div>
            <div className="form-row">
              <Form.Item label="毕业院校" name="graduated_school">
                <Input placeholder="请输入毕业院校" autoComplete="off" />
              </Form.Item>

              <Form.Item label="学历" name="education">
                <Select placeholder="请选择学历" options={EDUCATION_OPTIONS} />
              </Form.Item>

              <Form.Item label="政治面貌" name="political_status" className="full-width">
                <Select placeholder="请选择政治面貌" options={POLITICAL_STATUS_OPTIONS} />
              </Form.Item>
            </div>
          </div>

          {/* 工作信息 */}
          <div className="form-section">
            <div className="form-section-title">工作信息</div>
            <div className="form-row">
              <Form.Item label="入职时间" name="entry_date">
                <DatePicker style={{ width: '100%' }} placeholder="请选择入职时间" />
              </Form.Item>

              <Form.Item label="工作省份" name="work_province">
                <Input placeholder="请输入工作省份" autoComplete="off" />
              </Form.Item>

              <Form.Item label="学生兵级届" name="student_soldier_class" className="student-soldier-class-item">
                <Input placeholder="请输入学生兵级届" autoComplete="off" />
              </Form.Item>

              <Form.Item label="是否外派" name="is_dispatched" valuePropName="checked">
                <Checkbox />
              </Form.Item>
            </div>
          </div>

          {/* 状态信息 */}
          <div className="form-section">
            <div className="form-section-title">状态信息</div>
            <div className="form-row">
              <Form.Item label="状态" name="status">
                <Select placeholder="请选择状态" options={CADRE_STATUS_OPTIONS} />
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

export default CadreEdit;
