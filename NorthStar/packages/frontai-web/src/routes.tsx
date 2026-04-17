import { RouteObject, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { ToolDetailPage } from './pages/ToolDetailPage';
import { ArticleReadPage } from './pages/ArticleReadPage';
import { SolutionNewPage } from './pages/SolutionNewPage';
import { UserCenterPage } from './pages/UserCenterPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './layouts/AdminLayout';
import { ReviewQueuePage } from './pages/admin/ReviewQueuePage';
import { ReviewDetailPage } from './pages/admin/ReviewDetailPage';
import { UnassignedPoolPage } from './pages/admin/UnassignedPoolPage';
import { ReviewersPage } from './pages/admin/ReviewersPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { RequireAuth } from './components/RequireAuth';
import { ContentListPage } from './pages/admin/ContentListPage';
import { ContentEditorPage } from './pages/admin/ContentEditorPage';
import { ContentStudioPage } from './pages/admin/ContentStudioPage';

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
    element: (
      <RequireAuth>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="studio" replace /> },
      
      // 内容工作室
      { path: 'studio', element: <ContentStudioPage /> },
      { path: 'studio/:contentId', element: <ContentStudioPage /> },
      
      // 内容管理
      { path: 'content', element: <ContentListPage /> },
      { path: 'content/new', element: <ContentEditorPage /> },
      { path: 'content/:contentId/edit', element: <ContentEditorPage /> },
      
      // 审核工作台
      { path: 'review', element: <ReviewQueuePage /> },
      { path: 'review/pool', element: <UnassignedPoolPage /> },
      { path: 'review/reviewers', element: <ReviewersPage /> },
      { path: 'review/:taskId', element: <ReviewDetailPage /> },
      { path: 'audit', element: <AuditLogPage /> },
      
      // 用户管理 (Placeholder)
      { path: 'users', element: <div className="p-8">用户管理模块开发中...</div> },
      
      // 工具管理 (Placeholder)
      { path: 'tools', element: <div className="p-8">工具管理模块开发中...</div> },
      
      // 数据中心 (Placeholder)
      { path: 'analytics', element: <div className="p-8">数据中心模块开发中...</div> },
      
      // 支付管理 (Placeholder)
      { path: 'payments', element: <div className="p-8">支付管理模块开发中...</div> },
      
      // 系统设置 (Placeholder)
      { path: 'settings', element: <div className="p-8">系统设置模块开发中...</div> },
    ],
  },
];
