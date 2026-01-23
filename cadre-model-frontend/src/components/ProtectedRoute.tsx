import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const user = useSelector((state: RootState) => state.auth.user);

  // 如果需要管理员权限，但当前用户是人才，则跳转到人才详情页
  if (requireAdmin && user?.user_type === 'cadre') {
    return <Navigate to={`/cadre/${user.cadre_id}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
