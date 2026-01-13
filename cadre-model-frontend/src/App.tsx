import { Outlet } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import ScrollToTop from '@/components/ScrollToTop';
import AIChat from '@/components/AIChat';
import './App.css';

function App() {
  return (
    <div className="app-container">
      {/* 路由切换时重置滚动位置 */}
      <ScrollToTop />

      {/* 背景装饰 */}
      <div className="app-background">
        <div className="bg-grid bg-noise"></div>
        <div className="glow-spot glow-spot-gold" style={{ width: '600px', height: '600px', top: '-200px', right: '-200px' }}></div>
        <div className="glow-spot glow-spot-blue" style={{ width: '500px', height: '500px', bottom: '-150px', left: '-150px' }}></div>
      </div>

      {/* 顶部导航栏 */}
      <Navigation />

      {/* 主内容区域 */}
      <main className="app-main">
        <Outlet />
      </main>

      {/* AI对话悬浮按钮 */}
      <AIChat iframeUrl="http://192.168.18.77:3000/zh/chat" />
    </div>
  );
}

export default App;
