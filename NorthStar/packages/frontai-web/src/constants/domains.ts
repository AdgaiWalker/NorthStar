import { Domain } from '@/types';
import { Monitor, Video, Building2 } from 'lucide-react';

export const DOMAIN_CONFIG: Record<Domain, {
  key: Domain;
  label: string;
  icon: React.ElementType;
  description: string;
  requiresAuth: boolean;
}> = {
  creative: {
    key: 'creative',
    label: '影视创作',
    icon: Video,
    description: 'AI 视频与图像生成',
    requiresAuth: false,
  },
  dev: {
    key: 'dev',
    label: '编程开发',
    icon: Monitor,
    description: '代码助手与开发工具',
    requiresAuth: false,
  },
  work: {
    key: 'work',
    label: '通用办公',
    icon: Building2,
    description: '文档、PPT 与效率工具',
    requiresAuth: false,
  },
};

export const DOMAIN_LIST: Domain[] = ['creative', 'dev', 'work'];
