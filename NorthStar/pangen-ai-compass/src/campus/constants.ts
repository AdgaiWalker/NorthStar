// 校园生活分类定义
import {
  Plane,
  UtensilsCrossed,
  ShoppingBag,
  Bus,
  FileText,
  Calendar,
  Repeat,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface CampusCategoryDef {
  slug: string;
  name: string;
  icon: LucideIcon;
  color: string;
  description: string;
  sortOrder: number;  // 排序权重
  enabled: boolean;   // 是否在 UI 中展示
}

export const CAMPUS_CATEGORIES: CampusCategoryDef[] = [
  { slug: 'arrival', name: '新生报到', icon: Plane, color: '#3B82F6', description: '报到流程、宿舍、必带清单', sortOrder: 1, enabled: true },
  { slug: 'food', name: '吃', icon: UtensilsCrossed, color: '#F59E0B', description: '食堂档口测评、周边美食实测', sortOrder: 2, enabled: true },
  { slug: 'shopping', name: '买', icon: ShoppingBag, color: '#8B5CF8', description: '日用品、教材、二手渠道', sortOrder: 3, enabled: true },
  { slug: 'transport', name: '出行', icon: Bus, color: '#10B981', description: '校园地图实测、公交/拼车/出行路线', sortOrder: 4, enabled: true },
  { slug: 'admin', name: '办事', icon: FileText, color: '#6366F1', description: '选课攻略、补卡流程、奖助学金、快递点', sortOrder: 5, enabled: true },
  { slug: 'activity', name: '活动', icon: Calendar, color: '#EC4899', description: '社团招新实评、校园活动预告、比赛信息', sortOrder: 6, enabled: true },
  { slug: 'secondhand', name: '二手', icon: Repeat, color: '#F97316', description: '教材流转、闲置转让、毕业清仓', sortOrder: 7, enabled: true },
  { slug: 'pitfalls', name: '避坑', icon: ShieldAlert, color: '#EF4444', description: '踩过的雷，千万别做的事', sortOrder: 8, enabled: true },
];

export function getCategoryBySlug(slug: string): CampusCategoryDef | undefined {
  return CAMPUS_CATEGORIES.find((c) => c.slug === slug);
}
