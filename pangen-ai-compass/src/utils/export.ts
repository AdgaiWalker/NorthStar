import { UserSolution, Tool } from '@/types';

const MIME_TYPES = {
  md: 'text/markdown',
  txt: 'text/plain',
  csv: 'text/csv',
} as const;

const sanitize = (text: string) => text.replace(/[#*`]/g, '');

const formatSolutionContent = (solution: UserSolution, format: 'md' | 'txt' | 'csv', tools: Tool[]) => {
  const toolNames = solution.toolIds
    .map(tid => tools.find(t => t.id === tid)?.name || tid)
    .join(', ');

  switch (format) {
    case 'md':
      return `# ${solution.title}\n\n**目标**: ${solution.targetGoal}\n**创建时间**: ${solution.createdAt}\n**工具组合**: ${toolNames}\n\n---\n\n${solution.aiAdvice}`;
    case 'txt':
      return `标题: ${solution.title}\n目标: ${solution.targetGoal}\n创建时间: ${solution.createdAt}\n工具组合: ${toolNames}\n\n----------------\n\n${sanitize(solution.aiAdvice)}`;
    case 'csv': {
      const esc = (v: string) => v.replace(/"/g, '""');
      return `ID,Title,Target Goal,Created At,Tools,AI Advice\n"${esc(solution.id)}","${esc(solution.title)}","${esc(solution.targetGoal)}","${esc(solution.createdAt)}","${esc(toolNames)}","${esc(solution.aiAdvice)}"`;
    }
    default:
      return '';
  }
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 导出方案为文件
 */
export const exportSolutionToFile = (
  solution: UserSolution,
  format: 'md' | 'txt' | 'csv',
  tools: Tool[]
) => {
  const content = formatSolutionContent(solution, format, tools);
  downloadFile(content, `${solution.title.replace(/\s+/g, '_')}.${format}`, MIME_TYPES[format]);
};
