import { Language } from './types';

// 国际化字典（最小化：仅覆盖全局导航与用户中心关键文案）
const dictionary: Record<string, Record<Language, string>> = {
  // 底部导航
  'nav.home': { zh: '首页', en: 'Home' },
  'nav.campus': { zh: '校内', en: 'Campus' },
  'nav.solution': { zh: '方案', en: 'Solution' },
  'nav.me': { zh: '我的', en: 'Me' },

  // 用户中心侧边栏
  'me.profile': { zh: '个人资料', en: 'Profile' },
  'me.solutions': { zh: '我的方案', en: 'My Solutions' },
  'me.favorites': { zh: '收藏夹', en: 'Favorites' },
  'me.credits': { zh: '我的额度', en: 'Credits' },
  'me.certification': { zh: '学生认证', en: 'Student Cert' },
  'me.settings': { zh: '设置', en: 'Settings' },

  // 通用按钮
  'btn.back': { zh: '返回', en: 'Back' },
  'btn.submit': { zh: '提交', en: 'Submit' },
  'btn.cancel': { zh: '取消', en: 'Cancel' },
  'btn.delete': { zh: '删除', en: 'Delete' },
  'btn.export': { zh: '导出', en: 'Export' },
  'btn.goHome': { zh: '去首页逛逛', en: 'Browse Home' },
  'btn.goLogin': { zh: '去登录', en: 'Login' },
  'btn.goCertification': { zh: '去学生认证', en: 'Verify Student' },

  // 状态文案
  'empty.favorites': { zh: '还没有收藏任何工具', en: 'No favorites yet' },
  'empty.solutions': { zh: '还没有生成过方案', en: 'No solutions yet' },
  'locked.campus': { zh: '校内专属内容', en: 'Campus Only' },
  'locked.login': { zh: '请先登录', en: 'Please login first' },
};

/**
 * 获取翻译文案
 * @param key 字典键
 * @param lang 当前语言
 * @returns 翻译后的文案，未找到时返回 key
 */
export const t = (key: string, lang: Language): string => {
  const entry = dictionary[key];
  if (!entry) return key;
  return entry[lang] ?? entry['zh'] ?? key;
};
