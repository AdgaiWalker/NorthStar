import { RouteObject, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { ArticleReadPage } from './pages/ArticleReadPage';
import { SolutionNewPage } from './pages/SolutionNewPage';
import { UserCenterPage } from './pages/UserCenterPage';
import { CampusPage } from './pages/CampusPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { ReviewQueuePage } from './pages/admin/ReviewQueuePage';
import { ReviewDetailPage } from './pages/admin/ReviewDetailPage';
import { UnassignedPoolPage } from './pages/admin/UnassignedPoolPage';
import { ReviewersPage } from './pages/admin/ReviewersPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { RequireAuth } from './components/RequireAuth';

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
    path: '/campus',
    element: <CampusPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/admin',
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="review-queue" replace /> },
      { path: 'review-queue', element: <ReviewQueuePage /> },
      { path: 'review/:taskId', element: <ReviewDetailPage /> },
      { path: 'unassigned', element: <UnassignedPoolPage /> },
      { path: 'reviewers', element: <ReviewersPage /> },
      { path: 'audit', element: <AuditLogPage /> },
    ],
  },
];
