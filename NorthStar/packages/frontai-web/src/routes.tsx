import { RouteObject, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { ToolsPage } from './pages/ToolsPage';
import { ArticleReadPage } from './pages/ArticleReadPage';
import { SolutionNewPage } from './pages/SolutionNewPage';
import { SolutionDetailPage } from './pages/SolutionDetailPage';
import { UserCenterPage } from './pages/UserCenterPage';
import { LoginPage } from './pages/LoginPage';
import { NewsPage } from './pages/NewsPage';
import { LegalPage } from './pages/LegalPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ContentStudioPage } from './pages/ContentStudioPage';
import { ContentStudioEditPage } from './pages/ContentStudioEditPage';

// 路由配置
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/tools',
    element: <ToolsPage />,
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
    path: '/news',
    element: <NewsPage />,
  },
  {
    path: '/solution/new',
    element: <SolutionNewPage />,
  },
  {
    path: '/solution/:solutionId',
    element: <SolutionDetailPage />,
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
    path: '/legal/:type',
    element: <LegalPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/studio',
    element: <ContentStudioPage />,
  },
  {
    path: '/studio/:id/edit',
    element: <ContentStudioEditPage />,
  },
  {
    path: '/admin',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/admin/*',
    element: <Navigate to="/" replace />,
  },
];
