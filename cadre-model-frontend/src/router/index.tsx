import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Prototype from '@/pages/Prototype';
import DashboardFullScreen from '@/pages/DashboardFullScreen';
import DashboardDetail from '@/pages/DashboardDetail';
import CadreGrid from '@/pages/Cadre/Grid';
import CadreList from '@/pages/Cadre/List';
import CadreDetailNew from '@/pages/Cadre/DetailNew';
import CadreCreate from '@/pages/Cadre/Create';
import CadreEdit from '@/pages/Cadre/Edit';
import PositionListNew from '@/pages/Position/ListNew';
import PositionDetail from '@/pages/Position/Detail';
import PositionCreate from '@/pages/Position/Create';
import DepartmentListNew from '@/pages/Department/ListNew';
import PositionEdit from '@/pages/Position/Edit';
import MatchAnalysisNew from '@/pages/Match/AnalysisNew';
import MatchResult from '@/pages/Match/Result';
import MatchReport from '@/pages/Match/Report';
import App from '@/App';
import ProtectedRoute from '@/components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/prototype',
    element: <Prototype />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute requireAdmin><DashboardFullScreen /></ProtectedRoute>,
  },
  {
    path: '/dashboard/detail/:type',
    element: <ProtectedRoute requireAdmin><DashboardDetail /></ProtectedRoute>,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'home',
        element: <ProtectedRoute requireAdmin><Home /></ProtectedRoute>,
      },
      {
        path: 'department',
        element: <ProtectedRoute requireAdmin><DepartmentListNew /></ProtectedRoute>,
      },
      {
        path: 'cadre',
        element: <ProtectedRoute requireAdmin><CadreGrid /></ProtectedRoute>,
      },
      {
        path: 'cadre/table',
        element: <ProtectedRoute requireAdmin><CadreList /></ProtectedRoute>,
      },
      {
        path: 'cadre/create',
        element: <ProtectedRoute requireAdmin><CadreCreate /></ProtectedRoute>,
      },
      {
        path: 'cadre/:id',
        element: <CadreDetailNew />,
      },
      {
        path: 'cadre/:id/edit',
        element: <ProtectedRoute requireAdmin><CadreEdit /></ProtectedRoute>,
      },
      {
        path: 'position',
        element: <ProtectedRoute requireAdmin><PositionListNew /></ProtectedRoute>,
      },
      {
        path: 'position/create',
        element: <ProtectedRoute requireAdmin><PositionCreate /></ProtectedRoute>,
      },
      {
        path: 'position/:id',
        element: <ProtectedRoute requireAdmin><PositionDetail /></ProtectedRoute>,
      },
      {
        path: 'position/:id/edit',
        element: <ProtectedRoute requireAdmin><PositionEdit /></ProtectedRoute>,
      },
      {
        path: 'match',
        element: <ProtectedRoute requireAdmin><MatchAnalysisNew /></ProtectedRoute>,
      },
      {
        path: 'match/results',
        element: <ProtectedRoute requireAdmin><MatchResult /></ProtectedRoute>,
      },
      {
        path: 'match/results/:id',
        element: <ProtectedRoute requireAdmin><MatchReport /></ProtectedRoute>,
      },
    ],
  },
]);

export default router;
