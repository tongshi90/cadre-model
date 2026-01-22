import { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined } from '@ant-design/icons';
import { departmentApi } from '@/services/departmentApi';
import './ListNew.css';

interface Department {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  status: number;
  description?: string;
  employee_count?: number;
  children?: Department[];
}

const DepartmentListNew = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<Department[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set([0])); // 默认展开根节点
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentNode, setCurrentNode] = useState<Department | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await departmentApi.getTree();
      const data = response.data.data || [];
      // 添加根节点 "全部部门"
      const rootData: Department = {
        id: 0,
        name: '全部部门',
        parent_id: null,
        sort_order: 0,
        status: 1,
        children: data,
      };
      setTreeData([rootData]);
    } catch (error) {
      console.error('Failed to fetch department tree:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 新增部门
  const handleCreate = (node: Department) => {
    setModalMode('create');
    setCurrentNode(null);
    setParentId(node.id === 0 ? null : node.id);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑部门
  const handleEdit = (node: Department) => {
    if (node.id === 0) return;
    setModalMode('edit');
    setCurrentNode(node);
    setParentId(node.parent_id);
    form.setFieldsValue({
      name: node.name,
      description: node.description,
      employee_count: node.employee_count,
    });
    setModalVisible(true);
  };

  // 删除部门
  const handleDelete = (node: Department) => {
    if (node.id === 0) return;
    setDeleteConfirm(node);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await departmentApi.delete(deleteConfirm.id);
      message.success(response.data.message || '删除成功');
      setDeleteConfirm(null);
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 处理 employee_count：转换为数字，空值设为 0
      const employeeCount = values.employee_count
        ? parseInt(values.employee_count, 10)
        : 0;

      if (modalMode === 'edit' && currentNode) {
        await departmentApi.update(currentNode.id, {
          name: values.name,
          description: values.description,
          employee_count: employeeCount,
        });
        message.success('更新成功');
      } else {
        await departmentApi.create({
          name: values.name,
          parent_id: parentId,
          description: values.description,
          employee_count: employeeCount,
          sort_order: 0,
        });
        message.success('创建成功');
      }
      setModalVisible(false);
      fetchData();
    } catch (error: any) {
      if (error.errorFields) return;
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 计算子节点数量
  const countChildren = (node: Department): number => {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.length + node.children.reduce((sum, child) => sum + countChildren(child), 0);
  };

  // 切换节点展开/折叠
  const toggleExpand = (nodeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpandedKeys = new Set(expandedKeys);
    if (newExpandedKeys.has(nodeId)) {
      newExpandedKeys.delete(nodeId);
    } else {
      newExpandedKeys.add(nodeId);
    }
    setExpandedKeys(newExpandedKeys);
  };

  // 渲染树节点
  const renderTreeNode = (node: Department, level: number = 0): React.ReactNode => {
    const isHovered = hoveredNodeId === node.id;
    const isRoot = node.id === 0;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedKeys.has(node.id);

    return (
      <div key={node.id} className="tree-node-wrapper">
        <div
          className={`tree-item ${level === 0 ? 'root-item' : ''} ${isHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
        >
          {/* 层级缩进 */}
          <div className="tree-indent" style={{ width: `${level * 20}px` }} />

          {/* 展开/折叠图标 */}
          <div
            className="tree-toggle"
            onClick={(e) => hasChildren && toggleExpand(node.id, e)}
            style={{ cursor: hasChildren ? 'pointer' : 'default' }}
          >
            {hasChildren ? (
              <CaretRightOutlined className={`expand-icon ${isExpanded ? 'expanded' : ''}`} />
            ) : (
              <span className="tree-leaf-dot" />
            )}
          </div>

          {/* 节点名称 */}
          <span className={`tree-label ${level === 0 ? 'root-label' : ''}`}>
            {node.name}
          </span>

          {/* 操作按钮 */}
          <div className={`tree-actions ${isHovered || level === 0 ? 'visible' : ''}`}>
            <button
              className="action-btn add-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCreate(node);
              }}
              title="新增子机构"
            >
              <PlusOutlined />
            </button>
            {!isRoot && (
              <>
                <button
                  className="action-btn edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(node);
                  }}
                  title="编辑"
                >
                  <EditOutlined />
                </button>
                <button
                  className="action-btn delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(node);
                  }}
                  title="删除"
                >
                  <DeleteOutlined />
                </button>
              </>
            )}
          </div>
        </div>

        {/* 子节点 - 只在展开时显示 */}
        {hasChildren && isExpanded && (
          <div className="tree-children">
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="department-page">
      <div className="tree-wrapper">
        {loading ? (
          <div className="tree-loading">
            <div className="spinner"></div>
            <p className="loading-text">加载中...</p>
          </div>
        ) : (
          <div className="tree-root">
            {treeData.map((node) => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={modalMode === 'create' ? '新增部门' : '编辑部门'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        okText="确定"
        cancelText="取消"
        width={480}
        className="dept-modal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="部门名称"
            name="name"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>

          {parentId !== null && modalMode === 'create' && (
            <div className="parent-info">
              <span className="parent-label">上级部门：</span>
              <span className="parent-value">
                {parentId === null ? '根部门' : treeData[0].children?.find(d => d.id === parentId)?.name || '-'}
              </span>
            </div>
          )}

          <Form.Item
            label="员工数量"
            name="employee_count"
            rules={[
              {
                validator(_, value) {
                  // 允许为空
                  if (value === undefined || value === null || value === '') {
                    return Promise.resolve();
                  }
                  // 转换为数字
                  const num = Number(value);
                  // 必须是整数
                  if (!Number.isInteger(num)) {
                    return Promise.reject(new Error('员工数量必须是整数'));
                  }
                  // 必须大于0
                  if (num <= 0) {
                    return Promise.reject(new Error('员工数量必须大于0'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="text"
              placeholder="请输入员工数量（选填）"
            />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <Input.TextArea
              rows={3}
              placeholder="请输入部门描述（选填）"
              showCount
              maxLength={200}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        title="确认删除"
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onOk={confirmDelete}
        okText="确定删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        className="delete-modal"
      >
        {deleteConfirm && (
          <div className="delete-confirm-content">
            <p className="delete-warning">
              确定要删除部门 <strong>"{deleteConfirm.name}"</strong> 吗？
            </p>
            {countChildren(deleteConfirm) > 0 && (
              <p className="delete-info">
                此操作将同时删除该部门下的 {countChildren(deleteConfirm)} 个子部门
              </p>
            )}
            <p className="delete-hint">
              注意：如果该部门或其子部门下已有人才，则无法删除
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepartmentListNew;
