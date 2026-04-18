// 校园生活分类定义（纯数据，无 UI 依赖）

export interface CampusCategoryDef {
  slug: string;
  name: string;
  iconName: string; // lucide-react 图标名，前端使用时按名引入
  color: string;
  description: string;
  sortOrder: number;
  enabled: boolean;
}

export const CAMPUS_CATEGORIES: CampusCategoryDef[] = [
  { slug: 'arrival', name: '新生报到', iconName: 'Plane', color: '#3B82F6', description: '报到流程、宿舍、必带清单', sortOrder: 1, enabled: true },
  { slug: 'food', name: '吃', iconName: 'UtensilsCrossed', color: '#F59E0B', description: '食堂档口测评、周边美食实测', sortOrder: 2, enabled: true },
  { slug: 'shopping', name: '买', iconName: 'ShoppingBag', color: '#8B5CF8', description: '日用品、教材、二手渠道', sortOrder: 3, enabled: true },
  { slug: 'transport', name: '出行', iconName: 'Bus', color: '#10B981', description: '校园地图实测、公交/拼车/出行路线', sortOrder: 4, enabled: true },
  { slug: 'admin', name: '办事', iconName: 'FileText', color: '#6366F1', description: '选课攻略、补卡流程、奖助学金、快递点', sortOrder: 5, enabled: true },
  { slug: 'activity', name: '活动', iconName: 'Calendar', color: '#EC4899', description: '社团招新实评、校园活动预告、比赛信息', sortOrder: 6, enabled: true },
  { slug: 'secondhand', name: '二手', iconName: 'Repeat', color: '#F97316', description: '教材流转、闲置转让、毕业清仓', sortOrder: 7, enabled: true },
  { slug: 'pitfalls', name: '避坑', iconName: 'ShieldAlert', color: '#EF4444', description: '踩过的雷，千万别做的事', sortOrder: 8, enabled: true },
];

import type { CampusDomain } from './types';

// 展示层领域（用户在首页看到的分组）

// 领域 → 分类映射
export const DOMAIN_MAP: Record<CampusDomain, string[]> = {
  daily: ['arrival', 'food', 'transport'],
  growth: ['admin', 'activity'],
  deal: ['shopping', 'secondhand', 'pitfalls'],
};

// 分类 → 领域反查
export function getDomainForCategory(slug: string): CampusDomain {
  for (const [domain, cats] of Object.entries(DOMAIN_MAP)) {
    if (cats.includes(slug)) return domain as CampusDomain;
  }
  return 'daily';
}

// 领域元数据
export const CAMPUS_DOMAINS: Record<CampusDomain, { name: string; color: string }> = {
  daily: { name: '日常起居', color: '#3B82F6' },
  growth: { name: '成长提升', color: '#6366F1' },
  deal: { name: '精明消费', color: '#F59E0B' },
};

export function getCategoryBySlug(slug: string): CampusCategoryDef | undefined {
  return CAMPUS_CATEGORIES.find((c) => c.slug === slug);
}
