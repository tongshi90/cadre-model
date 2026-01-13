import DashboardScreen from '@/pages/DashboardScreen';

/**
 * 全屏大屏页面
 * 直接渲染大屏内容，不包含导航栏、logo、用户信息等
 * 用于 http://localhost:5173/dashboard 路由
 */
const DashboardFullScreen = () => {
  return <DashboardScreen />;
};

export default DashboardFullScreen;
