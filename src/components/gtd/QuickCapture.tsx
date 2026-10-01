import { useState } from 'react';

import Button from '@/components/ui/Button';
import { useGtdStore } from '@/stores/gtdStore';
import type { Item, ListId } from '@/types/gtd';

type Props = {
  /** 프로젝트 화면에서 쓰면 캡처한 항목이 그 프로젝트에 묶인다 */
  projectId?: string | null;
  /** 어느 리스트로 넣을지 (기본: 수집함) */
  list?: ListId;
  placeholder?: string;
  label?: string;
};

/** 수집(capture) — 머릿속에 있는 걸 일단 리스트에 넣는 입력창 */
export default function QuickCapture({
  projectId = null,
  list,
  placeholder = '머릿속에 있는 것 아무거나 — Enter로 수집함에 넣기',
  label = '수집',
}: Props) {
  const captureItem = useGtdStore((s) => s.captureItem);
  const [title, setTitle] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    const partial: Partial<Item> = {};
    if (projectId) partial.projectId = projectId;
    if (list) partial.list = list;
    captureItem(title, partial);
    setTitle('');
  };

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-border-default bg-bg-surface/80 p-2 shadow-[var(--shadow-surface)] backdrop-blur-xl">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
        }}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
      />
      <Button size="sm" onClick={submit}>
        {label}
      </Button>
    </div>
  );
}
