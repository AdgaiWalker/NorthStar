import React from 'react';
import type { Domain } from '../../types';

interface DomainBadgeProps {
  domain: Domain;
  inherited?: boolean;  // 是否为继承的领域
  size?: 'sm' | 'md';
}

/**
 * 领域色彩徽章组件
 * creative=紫色, dev=蓝色, work=绿色
 */
export const DomainBadge: React.FC<DomainBadgeProps> = ({
  domain,
  inherited = false,
  size = 'sm',
}) => {
  const colorMap: Record<Domain, string> = {
    creative: 'bg-purple-100 text-purple-800 border-purple-300',
    dev: 'bg-blue-100 text-blue-800 border-blue-300',
    work: 'bg-green-100 text-green-800 border-green-300',
  };

  const labelMap: Record<Domain, string> = {
    creative: '创作',
    dev: '开发',
    work: '办公',
  };

  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${colorMap[domain]} ${sizeClass}`}
    >
      {labelMap[domain]}
      {inherited && (
        <span className="text-[10px] opacity-70">·继承</span>
      )}
    </span>
  );
};
