import { Plus, UserRound, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { Avatar } from '@/components/ui/Badges';
import Popover from '@/components/ui/Popover';

type Props = {
  value: string | null;
  suggestions: string[];
  onChange: (value: string | null) => void;
  label?: string;
  placeholder?: string;
  renderTrigger?: (value: string | null) => ReactNode;
  triggerClassName?: string;
  testId?: string;
};

/** 위임 대상 입력 — 전에 쓴 이름을 추천하고, 새 이름도 바로 쓸 수 있다 */
export default function Combobox({
  value,
  suggestions,
  onChange,
  label = '담당자',
  placeholder = '누가 맡나요? (이름 입력)',
  renderTrigger,
  triggerClassName = '',
  testId,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const items = useMemo(() => {
    const q = query.trim();
    const list = suggestions.filter((s) => s !== value && s.toLowerCase().includes(q.toLowerCase())).slice(0, 8);
    const exact = suggestions.some((s) => s === q);
    const rows: { kind: 'pick' | 'create'; name: string }[] = list.map((name) => ({ kind: 'pick', name }));
    if (q && !exact && q !== value) rows.unshift({ kind: 'create', name: q });
    return rows;
  }, [query, suggestions, value]);

  const choose = (name: string | null) => {
    onChange(name);
    setOpen(false);
    anchorRef.current?.focus({ preventScroll: true });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const row = items[active];
      if (row) choose(row.name);
      else if (query.trim()) choose(query.trim());
    }
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex min-w-0 items-center gap-2 text-left transition-colors ${triggerClassName}`}
      >
        {renderTrigger ? (
          renderTrigger(value)
        ) : value ? (
          <>
            <Avatar name={value} />
            <div className="truncate">{value}</div>
          </>
        ) : (
          <>
            <UserRound className="size-4 text-text-muted" />
            <div className="text-text-muted">비어 있음</div>
          </>
        )}
      </button>

      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} title={label}>
        <div className="flex w-full flex-col sm:w-64">
          <div className="border-b border-border-default p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
              placeholder={placeholder}
              aria-controls={listId}
              className="h-9 w-full rounded-lg bg-bg-muted px-3 text-sm outline-none placeholder:text-text-muted focus:bg-bg-surface focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div id={listId} role="listbox" className="flex flex-col gap-px p-1">
            {items.map((row, i) => (
              <div
                key={`${row.kind}-${row.name}`}
                role="option"
                aria-selected={i === active}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(row.name)}
                className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm sm:min-h-8 ${i === active ? 'bg-bg-hover' : ''}`}
              >
                {row.kind === 'create' ? (
                  <>
                    <div className="grid size-5 place-items-center rounded-full bg-accent-soft text-accent-ink">
                      <Plus className="size-3" strokeWidth={2.6} />
                    </div>
                    <div className="flex min-w-0 gap-1">
                      <div className="truncate font-semibold">{row.name}</div>
                      <div className="flex-none text-text-muted">— 담당자로</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Avatar name={row.name} />
                    <div className="truncate">{row.name}</div>
                  </>
                )}
              </div>
            ))}
            {!items.length ? (
              <div className="px-2.5 py-2 text-xs text-text-muted">
                {suggestions.length ? '일치하는 이름이 없어요' : '이름을 입력하고 Enter'}
              </div>
            ) : null}
            {value ? (
              <div
                role="option"
                aria-selected={false}
                onClick={() => choose(null)}
                className="mt-1 flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg border-t border-border-default px-2.5 text-sm text-text-muted hover:bg-danger-soft hover:text-danger sm:min-h-8"
              >
                <X className="size-4" />
                담당자 빼기 ({value})
              </div>
            ) : null}
          </div>
        </div>
      </Popover>
    </>
  );
}
