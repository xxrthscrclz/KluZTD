import { useState } from 'react';

import Button from '@/components/ui/Button';
import { useGtdStore } from '@/stores/gtdStore';

/** 수집(capture) — 머릿속에 있는 걸 일단 수집함에 넣는 입력창 */
export default function QuickCapture() {
  const captureItem = useGtdStore((s) => s.captureItem);
  const [title, setTitle] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    captureItem(title);
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
        placeholder="머릿속에 있는 것 아무거나 — Enter로 수집함에 넣기"
        className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-medium text-text-primary outline-none placeholder:text-text-muted"
      />
      <Button size="sm" onClick={submit}>
        수집
      </Button>
    </div>
  );
}
