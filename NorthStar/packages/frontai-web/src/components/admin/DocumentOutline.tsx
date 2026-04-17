import React, { useEffect, useMemo, useRef, useState } from 'react';
import { extractDocTocWithLineIndex, TocLineItem } from '@/utils/docMarkdown';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentOutlineProps {
  markdown: string;
  /**
   * 编辑器当前“活跃行”（0-based），用于高亮所在章节。
   */
  activeLineIndex?: number;
  onScrollTo?: (lineIndex: number) => void;
  className?: string;
}

/**
 * 文档大纲组件 (飞书风格)
 * 常驻在编辑器左侧，显示文章目录结构
 */
export const DocumentOutline: React.FC<DocumentOutlineProps> = ({ 
  markdown,
  activeLineIndex,
  onScrollTo,
  className = ''
}) => {
  const toc = useMemo<TocLineItem[]>(() => {
    return extractDocTocWithLineIndex(markdown);
  }, [markdown]);

  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const activeIndex = useMemo(() => {
    if (activeLineIndex == null) return -1;
    let idx = -1;
    for (let i = 0; i < toc.length; i++) {
      if (toc[i].lineIndex <= activeLineIndex) idx = i;
      else break;
    }
    return idx;
  }, [activeLineIndex, toc]);

  useEffect(() => {
    if (isCollapsed) return;
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, isCollapsed]);

  // 处理点击跳转
  const handleItemClick = (item: TocLineItem) => {
    onScrollTo?.(item.lineIndex);
  };

  if (toc.length === 0) {
    return null; // 没有目录时不显示
  }

  // 折叠状态只显示一个小图标
  if (isCollapsed) {
    return (
      <div className={`h-full border-r border-slate-100 bg-white py-4 flex flex-col items-center ${className}`} style={{ width: '40px' }}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
          title="展开目录"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`h-full border-r border-slate-100 bg-white flex flex-col ${className}`} style={{ width: '240px' }}>
      {/* 头部 */}
      <div className="flex items-center justify-start px-2 py-2 border-b border-slate-50">
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
          title="收起目录"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto py-2 px-2 custom-scrollbar">
        {toc.map((item, idx) => {
          const isActive = idx === activeIndex;
          return (
            <button
              key={`${item.id}-${idx}`}
              ref={isActive ? activeItemRef : null}
              onClick={() => handleItemClick(item)}
              className={`
                group flex items-center w-full text-left py-1.5 px-2 rounded-md transition-colors border-l-2
                ${isActive ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-slate-50'}
              `}
              style={{ 
                paddingLeft: `${(item.depth - 1) * 12 + 8}px`,
                fontSize: item.depth === 1 ? '14px' : '13px'
              }}
            >
              <div className={`
                truncate w-full
                ${item.depth === 1 ? 'font-medium' : ''}
                ${isActive ? 'text-blue-700' : item.depth === 1 ? 'text-slate-800' : 'text-slate-600'}
                ${!isActive ? 'group-hover:text-blue-600' : ''}
              `}>
                {item.text}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
