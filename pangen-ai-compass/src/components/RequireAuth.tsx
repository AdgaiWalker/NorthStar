import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

// 最小访问控制：未登录跳转登录页，后续可扩展角色校验
export const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isLoggedIn } = useAppStore();
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
