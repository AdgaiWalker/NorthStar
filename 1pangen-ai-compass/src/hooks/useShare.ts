import { useState } from 'react';
import { UI_DELAY } from '@/constants/ui';

/**
 * 分享/复制相关的通用 Hook
 */
export const useShare = () => {
  const [copied, setCopied] = useState(false);

  const copyText = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), UI_DELAY.COPY_FEEDBACK);
  };

  return {
    copied,
    copyText,
  };
};
