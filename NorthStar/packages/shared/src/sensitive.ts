/**
 * 敏感词管控模块
 *
 * 两层防护：
 * 1. 输入拦截：搜索 query 命中敏感词 → 直接拒绝
 * 2. 输出过滤：AI 返回 summary 命中敏感词 → 降级为 fallback
 */

// ===== 分类敏感词库 =====

const POLITICAL: string[] = [
  // 政治类
];

const PORNOGRAPHIC: string[] = [
  '色情', '裸体', '裸照', ' AV ', '情色', '成人视频',
  '淫秽', '黄色视频', '黄色网站',
];

const VIOLENCE: string[] = [
  '杀人', '砍人', '捅人', '炸弹制作', '自制武器',
  '虐待动物', '自残', '自杀方法',
];

const GAMBLING: string[] = [
  '赌博', '博彩', '彩票预测', '时时彩', '百家乐',
  '老虎机', '赌场', '下注',
];

const CONTRABAND: string[] = [
  '代开发票', '买卖枪支', '迷药', '假钞',
  '信用卡套现', '洗钱',
];

const ABUSE: string[] = [
  '傻逼', '操你', '妈的', '狗日的', '王八蛋',
  '去死', '滚蛋',
];

/** 合并后的完整词库 */
const ALL_SENSITIVE_WORDS: string[] = [
  ...POLITICAL,
  ...PORNOGRAPHIC,
  ...VIOLENCE,
  ...GAMBLING,
  ...CONTRABAND,
  ...ABUSE,
];

/** 敏感词匹配结果 */
export interface SensitiveCheckResult {
  hit: boolean;
  words: string[];
}

/**
 * 检查文本是否包含敏感词
 * @param text 待检查文本
 * @returns 命中结果，包含命中的敏感词列表
 */
export const checkSensitiveWords = (text: string): SensitiveCheckResult => {
  const lower = text.toLowerCase();
  const words: string[] = [];

  for (const word of ALL_SENSITIVE_WORDS) {
    if (word && lower.includes(word.toLowerCase())) {
      words.push(word);
    }
  }

  return { hit: words.length > 0, words };
};
