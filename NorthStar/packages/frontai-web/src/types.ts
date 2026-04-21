// 从 @ns/shared re-export 所有共享类型，保持现有 import 路径兼容
export type {
  Domain,
  CampusDomain,
  ExperienceTab,
  Topic,
  Tool,
  Article,
  User,
  UserSolution,
  ThemeMode,
  Language,
  ExportFormat,
  CertificationStatus,
  StudentCertification,
  LibraryMode,
  ContentStatus,
  ContentVisibility,
  ContentItem,
  ContentAsset,
  FolderMeta,
  AnalyticsEvent,
  UserStats,
  PlatformStats,
} from '@ns/shared';

// enum 必须用值导出
export { ContentType } from '@ns/shared';

// frontai-web 本地类型
export type ViewState =
  | { type: 'home' }
  | { type: 'tool-detail'; toolId: string }
  | { type: 'article-read'; articleId: string; topicId?: string }
  | { type: 'login' }
  | {
      type: 'user-center';
      tab?: 'profile' | 'history' | 'favorites' | 'creator' | 'solutions' | 'stats' | 'settings';
    }
  | { type: 'solution-generate'; toolIds: string[] }
  | {
      type: 'admin';
      section?:
        | 'dashboard'
        | 'content'
        | 'users'
        | 'approvals'
        | 'tools'
        | 'stats'
        | 'payments'
        | 'ai'
        | 'settings'
        | 'analytics';
    };
