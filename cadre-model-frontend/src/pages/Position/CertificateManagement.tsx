import { useState, useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CaretRightOutlined } from '@ant-design/icons';
import { certificateApi } from '@/services/certificateApi';
import '../Department/ListNew.css';

interface CertificateType {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  status: number;
  description?: string;
  children?: CertificateType[];
}

const CertificateManagement = () => {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<CertificateType[]>([]);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set([0])); // 默认展开根节点
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [currentNode, setCurrentNode] = useState<CertificateType | null>(null);
  const [parentId, setParentId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CertificateType | null>(null);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await certificateApi.getTree();
      const data = response.data.data || [];
      // 添加根节点 "全部证书"
      const rootData: CertificateType = {
        id: 0,
        name: '全部证书',
        parent_id: null,
        sort_order: 0,
        status: 1,
        children: data,
      };
      setTreeData([rootData]);
    } catch (error) {
      console.error('Failed to fetch certificate tree:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 新增节点
  const handleCreate = (node: CertificateType) => {
    setModalMode('create');
    setCurrentNode(null);
    setParentId(node.id === 0 ? null : node.id);
    form.resetFields();
    setModalVisible(true);
  };

  // 编辑节点
  const handleEdit = (node: CertificateType) => {
    if (node.id === 0) return;
    setModalMode('edit');
    setCurrentNode(node);
    setParentId(node.parent_id);
    form.setFieldsValue({
      name: node.name,
      description: node.description,
    });
    setModalVisible(true);
  };

  // 删除节点
  const handleDelete = (node: CertificateType) => {
    if (node.id === 0) return;
    setDeleteConfirm(node);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await certificateApi.delete(deleteConfirm.id);
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

      if (modalMode === 'edit' && currentNode) {
        await certificateApi.update(currentNode.id, {
          name: values.name,
          description: values.description,
        });
        message.success('更新成功');
      } else {
        await certificateApi.create({
          name: values.name,
          parent_id: parentId,
          description: values.description,
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
  const countChildren = (node: CertificateType): number => {
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
  const renderTreeNode = (node: CertificateType, level: number = 0): React.ReactNode => {
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
            {/* 只在根节点和一级节点显示新增按钮（最多支持二级证书） */}
            {level < 2 && (
              <button
                className="action-btn add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreate(node);
                }}
                title={level === 0 ? '新增证书类型' : '新增证书名'}
              >
                <PlusOutlined />
              </button>
            )}
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
        title={modalMode === 'create'
          ? (parentId === null ? '新增证书类型' : '新增证书名')
          : (parentId === null ? '编辑证书类型' : '编辑证书名')
        }
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
            label={parentId === null ? '证书类型名称' : '证书名称'}
            name="name"
            rules={[{ required: true, message: `请输入${parentId === null ? '证书类型' : '证书'}名称` }]}
          >
            <Input placeholder={`请输入${parentId === null ? '证书类型' : '证书'}名称`} />
          </Form.Item>

          {parentId !== null && modalMode === 'create' && (
            <div className="parent-info">
              <span className="parent-label">所属证书类型：</span>
              <span className="parent-value">
                {treeData[0].children?.find(d => d.id === parentId)?.name || '-'}
              </span>
            </div>
          )}

          <Form.Item label="描述" name="description">
            <Input.TextArea
              rows={3}
              placeholder={`请输入${parentId === null ? '证书类型' : '证书'}描述（选填）`}
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
              确定要删除 <strong>"{deleteConfirm.name}"</strong> 吗？
            </p>
            {countChildren(deleteConfirm) > 0 && (
              <p className="delete-info">
                此操作将同时删除该节点下的 {countChildren(deleteConfirm)} 个子节点
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificateManagement;
