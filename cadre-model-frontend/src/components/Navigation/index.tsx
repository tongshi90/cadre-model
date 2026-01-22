import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  LogoutOutlined,
  KeyOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Dropdown, Modal, Form, Input, message } from 'antd';
import { useAppSelector } from '@/store/hooks';
import { authApi } from '@/services/authApi';
import type { MenuProps } from 'antd';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const navItems = [
    { key: '/home', icon: <HomeOutlined />, label: '首页' },
    // { key: '/department', icon: <ApartmentOutlined />, label: '部门管理' },
    { key: '/cadre', icon: <UserOutlined />, label: '人才管理' },
    { key: '/position', icon: <TeamOutlined />, label: '岗位管理' },
    { key: '/match', icon: <BarChartOutlined />, label: '匹配分析' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handlePasswordChange = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await authApi.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success('密码修改成功，请重新登录');
      setPasswordModalVisible(false);
      form.resetFields();
      localStorage.removeItem('token');
      navigate('/login');
    } catch (error: any) {
      if (error.errorFields) {
        return;
      }
      message.error(error.response?.data?.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'changePassword',
      icon: <KeyOutlined />,
      label: '修改密码',
      onClick: () => setPasswordModalVisible(true),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="top-navigation">
        <div className="nav-container">
          {/* Logo */}
          <div className="nav-logo" onClick={() => window.open('/dashboard', '_blank')}>
            <div className="logo-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" stroke="currentColor" strokeWidth="2" fill="none"/>
                <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.3"/>
                <circle cx="50" cy="50" r="10" fill="currentColor"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-title">Talkweb</span>
              <span className="logo-subtitle">人才管理全量模型平台</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="nav-menu">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </div>

          {/* User Menu & Mobile Toggle */}
          <div className="nav-right">
            {/* Desktop User Menu */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['hover']}>
              <div className="nav-user">
                <div className="user-avatar">
                  <UserOutlined />
                </div>
                <span className="user-name">{user?.real_name || user?.username}</span>
              </div>
            </Dropdown>

            {/* Mobile Menu Toggle */}
            <button
              className="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="logo-icon">
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.3"/>
                  <circle cx="50" cy="50" r="10" fill="currentColor"/>
                </svg>
              </div>
              <span className="mobile-menu-title">菜单</span>
            </div>
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`mobile-nav-item ${location.pathname === item.key ? 'active' : ''}`}
                onClick={() => navigate(item.key)}
              >
                <span className="mobile-nav-icon">{item.icon}</span>
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          form.resetFields();
        }}
        onOk={handlePasswordChange}
        confirmLoading={loading}
        okText="确认修改"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="原始密码"
            name="old_password"
            rules={[{ required: true, message: '请输入原始密码' }]}
          >
            <Input.Password placeholder="请输入原始密码" size="large" />
          </Form.Item>

          <Form.Item
            label="新密码"
            name="new_password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, max: 18, message: '新密码长度为6-18位' },
              {
                pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]*$/,
                message: '新密码需要包含字母和数字',
              },
            ]}
          >
            <Input.Password placeholder="请输入新密码" size="large" />
          </Form.Item>

          <Form.Item
            label="确认新密码"
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请再次输入新密码" size="large" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Navigation;
