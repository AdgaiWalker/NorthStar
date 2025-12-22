import { RouteObject } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { ArticleReadPage } from './pages/ArticleReadPage';
import { SolutionNewPage } from './pages/SolutionNewPage';
import { UserCenterPage } from './pages/UserCenterPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';

// 路由配置
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/tool/:toolId',
    element: <ToolDetailPage />,
  },
  {
    path: '/article/:articleId',
    element: <ArticleReadPage />,
  },
  {
    path: '/solution/new',
    element: <SolutionNewPage />,
  },
  {
    path: '/me',
    element: <UserCenterPage />,
  },
  {
    path: '/me/:tab',
    element: <UserCenterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '/admin/:section',
    element: <AdminPage />,
  },
];
