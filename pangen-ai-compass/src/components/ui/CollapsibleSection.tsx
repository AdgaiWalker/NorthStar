import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * 可折叠分组组件
 * 用于属性面板中的分组展示
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 px-1 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        <span>{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="pb-3 px-1 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
};
