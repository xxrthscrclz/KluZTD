import { useState } from 'react';

import Button from '@/components/ui/Button';
import { useGtdStore } from '@/stores/gtdStore';
import type { Item, ListId } from '@/types/gtd';
import { todayInput } from '@/utils/date';

type Props = {
  /** 프로젝트 화면에서 쓰면 캡처한 항목이 그 프로젝트에 묶인다 */
  projectId?: string | null;
  /** 어느 리스트로 넣을지 (기본: 수집함) */
  list?: ListId;
  /** 캡처한 항목을 오늘 하기로 바로 찍는다 */
  pinToday?: boolean;
  placeholder?: string;
  label?: string;
};

/** 끝에 ! 를 붙이면 중요 표시 — '보고서 제출 !' */
function parseTitle(raw: string): { title: string; high: boolean } {
  const trimmed = raw.trim();
  const high = /\s*!+$/.test(trimmed) && trimmed.replace(/!+$/, '').trim().length > 0;
  return { title: high ? trimmed.replace(/\s*!+$/, '') : trimmed, high };
}

/** 수집(capture) — 머릿속에 있는 걸 일단 리스트에 넣는 입력창 */
export default function QuickCapture({
  projectId = null,
  list,
  pinToday = false,
  placeholder = '머릿속에 있는 것 아무거나 — Enter로 수집함에 넣기 (끝에 ! 붙이면 중요)',
  label = '수집',
}: Props) {
  const captureItem = useGtdStore((s) => s.captureItem);
  const [title, setTitle] = useState('');

  const submit = () => {
    const parsed = parseTitle(title);
    if (!parsed.title) return;
    const partial: Partial<Item> = {};
    if (projectId) partial.projectId = projectId;
    if (list) partial.list = list;
    if (parsed.high) partial.priority = 'high';
    if (pinToday) partial.todayPin = todayInput();
    captureItem(parsed.title, partial);
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
