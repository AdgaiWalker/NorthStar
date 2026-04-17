import { create } from 'zustand';
import { ContentItem, ContentAsset, Domain, FolderMeta } from '@/types';
import { STORAGE_KEYS, storageGet, storageSet } from '@/utils/storage';
import { isContentItemArray, isContentAssetArray, isFolderMetaArray } from '@/utils/guards';
import { MOCK_ARTICLES } from '@/constants';

// 文件树节点类型
export interface TreeNode {
  type: 'folder' | 'content';
  path?: string;      // 文件夹路径
  contentId?: string; // 内容ID
  name: string;       // 显示名称
  domain?: Domain;    // 领域
  children: TreeNode[];
}

interface ContentState {
  items: ContentItem[];
  assets: ContentAsset[];
  folders: FolderMeta[];
  selectedFolder: string | null;
  storageResetDetected: boolean;

  // 内容 Actions
  createDraft: (opts?: { domain?: Domain; folder?: string }) => string;
  updateDraft: (id: string, patch: Partial<ContentItem>) => void;
  publish: (id: string) => void;
  unpublish: (id: string) => void;
  delete: (id: string) => void;
  upsertAsset: (asset: ContentAsset) => void;

  // 文件夹 Actions
  createFolder: (path: string, domain?: Domain) => void;
  updateFolder: (path: string, patch: { domain?: Domain }) => void;
  deleteFolder: (path: string) => void;
  setSelectedFolder: (path: string | null) => void;
  moveContent: (contentId: string, targetFolder: string | null) => void;
  updateSortIndex: (updates: { id: string; sortIndex: number }[]) => void;

  // Selectors
  getPublishedArticlesByDomain: (domain: Domain) => ContentItem[];
  getArticleById: (id: string) => ContentItem | undefined;
  getContentsByFolder: (folder: string | null) => ContentItem[];
  getFolderTree: () => TreeNode[];
  getInheritedDomain: (folder: string | null) => Domain | undefined;
}

const newId = () => `cnt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

const safeIso = (raw: string): string => {
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? nowIso() : d.toISOString();
};

// 领域到文件夹路径的映射
const DOMAIN_FOLDER_MAP: Record<Domain, string> = {
  creative: '/创作',
  dev: '/开发',
  work: '/办公',
};

// 默认种子文件夹
const SEED_FOLDERS: FolderMeta[] = [
  { path: '/创作', domain: 'creative', createdAt: nowIso() },
  { path: '/开发', domain: 'dev', createdAt: nowIso() },
  { path: '/办公', domain: 'work', createdAt: nowIso() },
];

const SEED_CONTENT_ITEMS: ContentItem[] = MOCK_ARTICLES.map((a) => {
  const t = safeIso(a.date);
  const tags: string[] = [];
  if (a.isFeatured) tags.push('featured');
  if (a.topicId) tags.push(`topic:${a.topicId}`);

  return {
    id: a.id,
    type: 'article',
    title: a.title,
    summary: a.summary,
    coverImageUrl: a.imageUrl,
    domain: a.domain,
    status: 'published',
    visibility: 'public' as const,
    schoolId: undefined,
    schoolName: undefined,
    tags,
    relatedToolIds: a.relatedToolId ? [a.relatedToolId] : [],
    markdown: a.content,
    createdAt: t,
    updatedAt: t,
    publishedAt: t,
    stats: { views: a.stats.views, likes: a.stats.likes },
    folder: DOMAIN_FOLDER_MAP[a.domain], // 根据领域分配到对应文件夹
  };
});

export const useContentStore = create<ContentState>((set, get) => {
  const initItems = storageGet<ContentItem[]>(
    STORAGE_KEYS.contentItems,
    SEED_CONTENT_ITEMS,
    isContentItemArray
  );
  const initAssets = storageGet<ContentAsset[]>(STORAGE_KEYS.contentAssets, [], isContentAssetArray);
  const initFolders = storageGet<FolderMeta[]>(STORAGE_KEYS.contentFolders, SEED_FOLDERS, isFolderMetaArray);

  // 首次启动：将种子内容落盘，保证后续编辑可持续。
  if (localStorage.getItem(STORAGE_KEYS.contentItems) === null && initItems.value.length) {
    storageSet(STORAGE_KEYS.contentItems, initItems.value);
  }
  if (localStorage.getItem(STORAGE_KEYS.contentFolders) === null && initFolders.value.length) {
    storageSet(STORAGE_KEYS.contentFolders, initFolders.value);
  }

  const persist = (items = get().items, assets = get().assets, folders = get().folders) => {
    storageSet(STORAGE_KEYS.contentItems, items);
    storageSet(STORAGE_KEYS.contentAssets, assets);
    storageSet(STORAGE_KEYS.contentFolders, folders);
  };

  return {
    items: initItems.value,
    assets: initAssets.value,
    folders: initFolders.value,
    selectedFolder: null,
    storageResetDetected: initItems.resetDetected || initAssets.resetDetected || initFolders.resetDetected,

    createDraft: (opts) => {
      const id = newId();
      // 如果指定了文件夹，尝试继承该文件夹的领域
      const folder = opts?.folder ?? get().selectedFolder;
      const inheritedDomain = folder ? get().getInheritedDomain(folder) : undefined;
      const item: ContentItem = {
        id,
        type: 'article',
        title: '未命名文章',
        summary: '',
        coverImageUrl: '',
        domain: opts?.domain ?? inheritedDomain ?? 'creative',
        status: 'draft',
        visibility: 'public',
        tags: [],
        relatedToolIds: [],
        markdown: '',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        stats: { views: 0, likes: 0 },
        folder: folder ?? undefined,
      };
      const items = [item, ...get().items];
      set({ items });
      persist(items);
      return id;
    },

    updateDraft: (id, patch) => {
      const items = get().items.map((it) =>
        it.id === id ? { ...it, ...patch, updatedAt: nowIso() } : it
      );
      set({ items });
      persist(items);
    },

    publish: (id) => {
      const items = get().items.map((it): ContentItem =>
        it.id === id ? { ...it, status: 'published' as const, publishedAt: nowIso(), updatedAt: nowIso() } : it
      );
      set({ items });
      persist(items);
    },

    unpublish: (id) => {
      const items = get().items.map((it): ContentItem =>
        it.id === id ? { ...it, status: 'draft' as const, publishedAt: undefined, updatedAt: nowIso() } : it
      );
      set({ items });
      persist(items);
    },

    delete: (id) => {
      const items = get().items.filter((it) => it.id !== id);
      set({ items });
      persist(items);
    },

    upsertAsset: (asset) => {
      const existing = get().assets;
      const idx = existing.findIndex((a) => a.id === asset.id);
      const next = idx >= 0 ? existing.map((a, i) => (i === idx ? asset : a)) : [asset, ...existing];
      set({ assets: next });
      persist(undefined, next);
    },

    // 文件夹 Actions
    createFolder: (path, domain) => {
      const existing = get().folders;
      if (existing.some((f) => f.path === path)) return; // 已存在
      const folder: FolderMeta = { path, domain, createdAt: nowIso() };
      const folders = [...existing, folder];
      set({ folders });
      persist(undefined, undefined, folders);
    },

    updateFolder: (path, patch) => {
      const folders = get().folders.map((f) =>
        f.path === path ? { ...f, ...patch } : f
      );
      set({ folders });
      persist(undefined, undefined, folders);
    },

    deleteFolder: (path) => {
      // 删除文件夹时，将其下内容移到未分类
      const folders = get().folders.filter((f) => f.path !== path && !f.path.startsWith(path + '/'));
      const items = get().items.map((it) =>
        it.folder === path || it.folder?.startsWith(path + '/') ? { ...it, folder: undefined } : it
      );
      set({ folders, items });
      persist(items, undefined, folders);
    },

    setSelectedFolder: (path) => {
      set({ selectedFolder: path });
    },

    moveContent: (contentId, targetFolder) => {
      const items = get().items.map((it) =>
        it.id === contentId ? { ...it, folder: targetFolder ?? undefined, updatedAt: nowIso() } : it
      );
      set({ items });
      persist(items);
    },

    updateSortIndex: (updates) => {
      const updatesMap = new Map(updates.map((u) => [u.id, u.sortIndex]));
      const items = get().items.map((it) =>
        updatesMap.has(it.id)
          ? { ...it, sortIndex: updatesMap.get(it.id), updatedAt: nowIso() }
          : it
      );
      set({ items });
      persist(items);
    },

    // Selectors
    getPublishedArticlesByDomain: (domain) =>
      get().items.filter((it) => it.type === 'article' && it.status === 'published' && it.domain === domain),

    getArticleById: (id) => get().items.find((it) => it.id === id),

    getContentsByFolder: (folder) => {
      if (folder === null) {
        // 未分类内容
        return get().items.filter((it) => !it.folder);
      }
      return get().items.filter((it) => it.folder === folder);
    },

    getFolderTree: () => {
      const folders = get().folders;
      const items = get().items;

      // 构建文件夹树
      const rootNodes: TreeNode[] = [];
      const folderMap = new Map<string, TreeNode>();

      // 按路径深度排序
      const sortedFolders = [...folders].sort((a, b) => a.path.localeCompare(b.path));

      for (const f of sortedFolders) {
        const parts = f.path.split('/').filter(Boolean);
        const name = parts[parts.length - 1];
        const node: TreeNode = {
          type: 'folder',
          path: f.path,
          name,
          domain: f.domain,
          children: [],
        };
        folderMap.set(f.path, node);

        if (parts.length === 1) {
          // 根级文件夹
          rootNodes.push(node);
        } else {
          // 子文件夹，找父级
          const parentPath = '/' + parts.slice(0, -1).join('/');
          const parent = folderMap.get(parentPath);
          if (parent) {
            parent.children.push(node);
          } else {
            rootNodes.push(node);
          }
        }
      }

      // 将内容添加到对应文件夹
      for (const item of items) {
        const contentNode: TreeNode = {
          type: 'content',
          contentId: item.id,
          name: item.title || '未命名文章',
          domain: item.domain,
          children: [],
        };
        if (item.folder) {
          const folderNode = folderMap.get(item.folder);
          if (folderNode) {
            folderNode.children.push(contentNode);
          }
        }
      }

      // 未分类内容节点
      const uncategorized = items.filter((it) => !it.folder);
      if (uncategorized.length > 0) {
        const uncatNode: TreeNode = {
          type: 'folder',
          path: null as unknown as string, // 特殊标识
          name: '未分类',
          children: uncategorized.map((it) => ({
            type: 'content',
            contentId: it.id,
            name: it.title || '未命名文章',
            domain: it.domain,
            children: [],
          })),
        };
        rootNodes.push(uncatNode);
      }

      // 递归排序函数
      const sortNodes = (nodes: TreeNode[]) => {
        nodes.sort((a, b) => {
          // 文件夹优先
          if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
          }
          // 尝试使用 sortIndex
          // 注意：目前只有 ContentItem 有 sortIndex，文件夹暂无 (Type Definition updated but not Store logic for Folders yet)
          // 如果需要支持文件夹排序，也需要给文件夹添加 sortIndex 并在此处理
          
          // 对于 Content，查找对应的 Item 获取 sortIndex
          const getItemSortIndex = (node: TreeNode) => {
             if (node.type === 'content' && node.contentId) {
                const it = items.find(i => i.id === node.contentId);
                return it?.sortIndex ?? 0;
             }
             return 0;
          };

          const idxA = getItemSortIndex(a);
          const idxB = getItemSortIndex(b);
          
          if (idxA !== idxB) return idxA - idxB;
          
          return a.name.localeCompare(b.name);
        });
        
        nodes.forEach(node => {
          if (node.children.length > 0) {
            sortNodes(node.children);
          }
        });
      };
      
      sortNodes(rootNodes);

      return rootNodes;
    },

    getInheritedDomain: (folder) => {
      if (!folder) return undefined;
      const folders = get().folders;
      // 从当前文件夹开始，向上查找绑定了领域的文件夹
      const parts = folder.split('/').filter(Boolean);
      for (let i = parts.length; i > 0; i--) {
        const currentPath = '/' + parts.slice(0, i).join('/');
        const f = folders.find((fd) => fd.path === currentPath);
        if (f?.domain) return f.domain;
      }
      return undefined;
    },
  };
});
