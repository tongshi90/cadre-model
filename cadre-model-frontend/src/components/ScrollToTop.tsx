import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 滚动位置重置组件
 * 在路由切换时自动将页面滚动到顶部
 */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 路由切换时滚动到顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
