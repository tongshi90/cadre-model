// 格式化日期
export const formatDate = (date: string | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
};

// 格式化日期时间
export const formatDateTime = (datetime: string | undefined): string => {
  if (!datetime) return '-';
  const d = new Date(datetime);
  return d.toLocaleString('zh-CN');
};

// 获取匹配等级文本
export const getMatchLevelText = (level: string | undefined): string => {
  const levelMap: Record<string, string> = {
    excellent: '优质',
    qualified: '合格',
    unqualified: '不合格',
  };
  return levelMap[level || ''] || '-';
};

// 获取匹配等级颜色
export const getMatchLevelColor = (level: string | undefined): string => {
  const colorMap: Record<string, string> = {
    excellent: '#52c41a',
    qualified: '#1890ff',
    unqualified: '#ff4d4f',
  };
  return colorMap[level || ''] || '#d9d9d9';
};

// 计算年龄
export const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// 防抖函数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 节流函数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
