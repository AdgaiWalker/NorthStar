import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen, FileText, Plus, Settings } from 'lucide-react';
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  PointerSensor, 
  closestCenter, 
  DragEndEvent, 
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TreeNode } from '../../store/useContentStore';
import { DomainBadge } from '../ui/DomainBadge';
import type { Domain } from '../../types';

interface FileTreeProps {
  tree: TreeNode[];
  selectedContentId: string | null;
  onSelectContent: (id: string) => void;
  onCreateContent: (folder: string | null) => void;
  onCreateFolder?: (parentPath: string | null) => void;
  onSetFolderDomain?: (path: string, domain: Domain) => void;
  onMoveContent?: (contentId: string, targetFolder: string | null) => void;
  onReorderContent?: (updates: { id: string; sortIndex: number }[]) => void;
}

interface TreeNodeItemProps {
  node: TreeNode;
  depth: number;
  selectedContentId: string | null;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onSelectContent: (id: string) => void;
  onCreateContent: (folder: string | null) => void;
  onSetFolderDomain?: (path: string, domain: Domain) => void;
}

// Sortable Item Wrapper
const SortableNode = ({ id, children, disabled }: { id: string, children: React.ReactNode, disabled?: boolean }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none', // Required for PointerSensor
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  depth,
  selectedContentId,
  expandedPaths,
  onToggleExpand,
  onSelectContent,
  onCreateContent,
  onSetFolderDomain,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const paddingLeft = depth * 16;
  
  // Content Node
  if (node.type === 'content') {
    const isSelected = node.contentId === selectedContentId;
    return (
      <SortableNode id={node.contentId!}>
        <div
          onClick={() => {
            // 防止 eslint no-unused-expressions：显式判断
            if (node.contentId) onSelectContent(node.contentId);
          }}
          className={`flex items-center gap-2 w-full px-2 py-1.5 text-left text-sm rounded-md transition-colors cursor-pointer ${
            isSelected
              ? 'bg-blue-100 text-blue-900'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
          style={{ paddingLeft: paddingLeft + 8 }}
        >
          <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate flex-1 select-none">{node.name}</span>
          {node.domain && (
            <DomainBadge domain={node.domain} size="sm" />
          )}
        </div>
      </SortableNode>
    );
  }

  // Folder Node
  const isExpanded = node.path ? expandedPaths.has(node.path) : true;
  const hasChildren = node.children.length > 0;
  const isUncategorized = node.path === null;
  
  // Folders are drop targets (Sortable items) but disabled for dragging themselves for now
  return (
    <SortableNode id={node.path || 'uncategorized'} disabled={true}>
      <div>
        <div
          className="group flex items-center gap-1 w-full px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer relative"
          style={{ paddingLeft }}
          onClick={() => node.path && onToggleExpand(node.path)}
        >
          {/* Icons & Name */}
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
          ) : <span className="w-4" />}
          
          {isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />}
          
          <span className="truncate flex-1 font-medium select-none">{node.name}</span>

          {node.domain && !isUncategorized && <DomainBadge domain={node.domain} size="sm" />}

          {/* Actions */}
          {!isUncategorized && (
            <div className="hidden group-hover:flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCreateContent(node.path ?? null); }}
                className="p-0.5 rounded hover:bg-slate-200"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
              </button>
              {onSetFolderDomain && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-0.5 rounded hover:bg-slate-200"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
            </div>
          )}

           {/* 领域菜单 */}
          {showMenu && onSetFolderDomain && node.path && (
            <div
              className="absolute right-0 top-full mt-1 z-20 bg-white border rounded-md shadow-lg py-1"
              onClick={(e) => e.stopPropagation()}
            >
              {(['creative', 'dev', 'work'] as Domain[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    onSetFolderDomain(node.path!, d);
                    setShowMenu(false);
                  }}
                  className={`block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100 ${
                    node.domain === d ? 'bg-slate-50 font-medium' : ''
                  }`}
                >
                  <DomainBadge domain={d} size="sm" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="flex flex-col">
             <SortableContext 
                items={node.children.map(c => c.contentId || c.path || 'uncategorized')}
                strategy={verticalListSortingStrategy}
             >
              {node.children.map((child, idx) => (
                <TreeNodeItem
                  key={child.type === 'content' ? child.contentId : child.path ?? idx}
                  node={child}
                  depth={depth + 1}
                  selectedContentId={selectedContentId}
                  expandedPaths={expandedPaths}
                  onToggleExpand={onToggleExpand}
                  onSelectContent={onSelectContent}
                  onCreateContent={onCreateContent}
                  onSetFolderDomain={onSetFolderDomain}
                />
              ))}
            </SortableContext>
          </div>
        )}
      </div>
    </SortableNode>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({
  tree,
  selectedContentId,
  onSelectContent,
  onCreateContent,
  onCreateFolder,
  onSetFolderDomain,
  onMoveContent,
  onReorderContent,
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const paths = new Set<string>();
    tree.forEach((node) => { if (node.path) paths.add(node.path); });
    return paths;
  });

  const handleToggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !onMoveContent || !onReorderContent) return;

    if (active.id !== over.id) {
       // active.id is contentId
       // over.id can be contentId or folderPath
       const activeId = String(active.id);
       const overId = String(over.id);

       // Check if over is a folder
       const isOverFolder = overId.startsWith('/') || overId === 'uncategorized';
       
       if (isOverFolder) {
         // Moved to folder
         const targetFolder = overId === 'uncategorized' ? null : overId;
         onMoveContent(activeId, targetFolder);
       } else {
         // Dropped on another content item?
         // For now, treat as NO-OP or log it.
         // Real implementation needs to identify parent of 'over' and move 'active' to that parent with specific index.
         console.log('Reorder logic not fully implemented yet');
       }
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">文件</span>
        {onCreateFolder && (
          <button
            type="button"
            onClick={() => onCreateFolder(null)}
            className="p-1 rounded hover:bg-slate-100"
          >
            <Plus className="w-4 h-4 text-slate-500" />
          </button>
        )}
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-y-auto py-2">
           <SortableContext 
              items={tree.map(n => n.contentId || n.path || 'uncategorized')}
              strategy={verticalListSortingStrategy}
           >
            {tree.map((node, idx) => (
              <TreeNodeItem
                key={node.type === 'content' ? node.contentId : node.path ?? idx}
                node={node}
                depth={0}
                selectedContentId={selectedContentId}
                expandedPaths={expandedPaths}
                onToggleExpand={handleToggleExpand}
                onSelectContent={onSelectContent}
                onCreateContent={onCreateContent}
                onSetFolderDomain={onSetFolderDomain}
              />
            ))}
          </SortableContext>
        </div>
        
        <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
           {/* Optional: Render drag preview */}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
