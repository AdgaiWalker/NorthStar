import React from 'react';
import type { Domain, CampusDomain } from '@/types';

interface DomainBadgeProps {
  domain: Domain | CampusDomain;
  inherited?: boolean;
  size?: 'sm' | 'md';
}

const colorMap: Record<string, string> = {
  creative: 'bg-purple-100 text-purple-800 border-purple-300',
  dev: 'bg-blue-100 text-blue-800 border-blue-300',
  work: 'bg-green-100 text-green-800 border-green-300',
  daily: 'bg-blue-100 text-blue-800 border-blue-300',
  growth: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  deal: 'bg-amber-100 text-amber-800 border-amber-300',
};

const labelMap: Record<string, string> = {
  creative: '创作',
  dev: '开发',
  work: '办公',
  daily: '日常起居',
  growth: '成长提升',
  deal: '精明消费',
};

export const DomainBadge: React.FC<DomainBadgeProps> = ({
  domain,
  inherited = false,
  size = 'sm',
}) => {
  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-1';
  const color = colorMap[domain] || 'bg-slate-100 text-slate-800 border-slate-300';
  const label = labelMap[domain] || domain;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${color} ${sizeClass}`}
    >
      {label}
      {inherited && (
        <span className="text-[10px] opacity-70">·继承</span>
      )}
    </span>
  );
};
