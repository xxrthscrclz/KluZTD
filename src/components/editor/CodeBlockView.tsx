import { NodeViewContent, NodeViewWrapper, type ReactNodeViewProps } from '@tiptap/react';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import Select, { type SelectOption } from '@/components/ui/Select';

export const CODE_LANGUAGES: SelectOption<string>[] = [
  { value: 'plaintext', label: '일반 텍스트' },
  { value: 'bash', label: 'Bash / Shell' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'json', label: 'JSON' },
  { value: 'yaml', label: 'YAML' },
  { value: 'sql', label: 'SQL' },
  { value: 'xml', label: 'HTML / XML' },
  { value: 'css', label: 'CSS' },
  { value: 'java', label: 'Java' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'swift', label: 'Swift' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'diff', label: 'Diff' },
  { value: 'ini', label: 'INI / TOML' },
];

/** 코드 블록 — 언어 선택 + 복사 */
export default function CodeBlockView({ node, updateAttributes, editor }: ReactNodeViewProps) {
  const [copied, setCopied] = useState(false);
  const language = (node.attrs.language as string | null) ?? 'plaintext';

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* 클립보드 권한 없음 */
    }
  };

  return (
    <NodeViewWrapper className="relative">
      <div contentEditable={false} className="absolute top-1.5 right-1.5 left-2 z-[1] flex items-center justify-between gap-2">
        {editor.isEditable ? (
          <Select
            value={CODE_LANGUAGES.some((l) => l.value === language) ? language : 'plaintext'}
            options={CODE_LANGUAGES}
            onChange={(v) => updateAttributes({ language: v === 'plaintext' ? null : v })}
            label="코드 언어"
            variant="ghost"
            className="!h-6 !px-1.5 !text-[0.72rem] font-medium text-text-muted"
          />
        ) : (
          <div className="px-1.5 text-[0.72rem] font-medium text-text-muted">
            {CODE_LANGUAGES.find((l) => l.value === language)?.label ?? language}
          </div>
        )}
        <button
          type="button"
          onClick={copy}
          aria-label="코드 복사"
          className="grid size-6 place-items-center rounded-md text-text-muted hover:bg-bg-active hover:text-text-primary"
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </button>
      </div>
      <pre>
        <NodeViewContent<'code'> as="code" className={language ? `language-${language}` : undefined} />
      </pre>
    </NodeViewWrapper>
  );
}
