import type { Doc } from '@/types/task';

/** 문서의 순수 텍스트 (검색·미리보기용) */
export function docToText(doc: Doc | null | undefined): string {
  if (!doc) return '';
  const out: string[] = [];
  const walk = (node: Doc) => {
    if (node.type === 'text' && node.text) out.push(node.text);
    if (node.type === 'hardBreak') out.push('\n');
    node.content?.forEach(walk);
    if (node.type && node.type !== 'text' && BLOCK_TYPES.has(node.type)) out.push('\n');
  };
  walk(doc);
  return out
    .join('')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

const BLOCK_TYPES = new Set([
  'paragraph',
  'heading',
  'codeBlock',
  'blockquote',
  'listItem',
  'taskItem',
  'tableRow',
  'callout',
]);

export function isDocEmpty(doc: Doc | null | undefined): boolean {
  if (!doc) return true;
  const hasContent = (node: Doc): boolean => {
    if (node.type === 'text') return Boolean(node.text?.trim());
    if (node.type && ['horizontalRule', 'table', 'image', 'codeBlock', 'callout'].includes(node.type)) return true;
    return node.content?.some(hasContent) ?? false;
  };
  return !hasContent(doc);
}
