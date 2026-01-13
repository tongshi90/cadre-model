import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { ConfigProvider, theme, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import router from './router';
import { RouterProvider } from 'react-router-dom';
import './assets/styles/index.css';

// 全局配置 message 组件
message.config({
  duration: 1.5,
  top: 55,
});

// Ant Design 主题配置
const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorBgElevated: 'rgba(19, 23, 41, 0.95)',
    colorBgSpotlight: 'rgba(212, 175, 55, 0.15)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
    colorPrimary: '#d4af37',
    borderRadius: 8,
    borderRadiusLG: 12,
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ConfigProvider locale={zhCN} theme={antdTheme}>
      <RouterProvider router={router} />
    </ConfigProvider>
  </Provider>
);
