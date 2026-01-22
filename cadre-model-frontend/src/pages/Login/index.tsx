import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      await dispatch(login(values)).unwrap();
      message.success('登录成功');
      navigate('/home');
    } catch (error: any) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* 背景效果 */}
      <div className="login-background">
        <div className="bg-grid bg-noise"></div>
        <div className="glow-spot glow-spot-gold" style={{ width: '700px', height: '700px', top: '-250px', right: '-200px' }}></div>
        <div className="glow-spot glow-spot-blue" style={{ width: '600px', height: '600px', bottom: '-200px', left: '-200px' }}></div>
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      {/* 登录卡片 */}
      <div className="login-container">
        <div className="login-card">
          {/* 装饰角落 */}
          <div className="decorative-corner decorative-corner-tl"></div>
          <div className="decorative-corner decorative-corner-tr"></div>
          <div className="decorative-corner decorative-corner-bl"></div>
          <div className="decorative-corner decorative-corner-br"></div>

          {/* Logo 区域 */}
          <div className="login-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polygon points="50,5 95,30 95,70 50,95 5,70 5,30" stroke="currentColor" strokeWidth="2" fill="none"/>
                <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="currentColor" opacity="0.3"/>
                <circle cx="50" cy="50" r="10" fill="currentColor"/>
              </svg>
            </div>
            <h1 className="login-title animate-fadeInDown">Talkweb</h1>
            <p className="login-subtitle animate-fadeInUp animation-delay-200">人才管理全量模型平台</p>
          </div>

          {/* 装饰线 */}
          <div className="login-divider">
            <div className="divider-line"></div>
          </div>

          {/* 登录表单 */}
          <div className="login-form-container animate-fadeInUp animation-delay-300">
            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              autoComplete="off"
              layout="vertical"
              requiredMark={false}
            >
              <Form.Item
                label={<span className="form-label">用户名</span>}
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder="请输入用户名"
                  size="large"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item
                label={<span className="form-label">密码</span>}
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="请输入密码"
                  size="large"
                  className="login-input"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  size="large"
                  className="login-button"
                >
                  登录
                </Button>
              </Form.Item>
            </Form>
          </div>

          {/* 底部装饰 */}
          <div className="login-footer">
            <div className="footer-text">
              <span className="footer-dot"></span>
              <span>智能决策 · 数据驱动 · 精准匹配</span>
              <span className="footer-dot"></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
