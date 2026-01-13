import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import Prototype from '@/pages/Prototype';
import DashboardScreen from '@/pages/DashboardScreen';
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
    element: <DashboardFullScreen />,
  },
  {
    path: '/dashboard/detail/:type',
    element: <DashboardDetail />,
  },
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'department',
        element: <DepartmentListNew />,
      },
      {
        path: 'cadre',
        element: <CadreGrid />,
      },
      {
        path: 'cadre/table',
        element: <CadreList />,
      },
      {
        path: 'cadre/create',
        element: <CadreCreate />,
      },
      {
        path: 'cadre/:id',
        element: <CadreDetailNew />,
      },
      {
        path: 'cadre/:id/edit',
        element: <CadreEdit />,
      },
      {
        path: 'position',
        element: <PositionListNew />,
      },
      {
        path: 'position/create',
        element: <PositionCreate />,
      },
      {
        path: 'position/:id',
        element: <PositionDetail />,
      },
      {
        path: 'position/:id/edit',
        element: <PositionEdit />,
      },
      {
        path: 'match',
        element: <MatchAnalysisNew />,
      },
      {
        path: 'match/results',
        element: <MatchResult />,
      },
      {
        path: 'match/results/:id',
        element: <MatchReport />,
      },
    ],
  },
]);

export default router;
