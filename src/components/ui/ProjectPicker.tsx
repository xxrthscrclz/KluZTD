import { FolderPlus, Plus, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { PROJECT_DOTS } from '@/components/ui/Badges';
import Popover from '@/components/ui/Popover';
import { useTaskStore } from '@/stores/taskStore';

type Props = {
  value: string | null;
  onChange: (projectId: string | null) => void;
  renderTrigger?: (projectId: string | null) => ReactNode;
  triggerClassName?: string;
  testId?: string;
};

/** 프로젝트 고르기 — 있는 걸 고르거나, 새 이름을 적고 Enter 로 바로 만든다 */
export default function ProjectPicker({ value, onChange, renderTrigger, triggerClassName = '', testId }: Props) {
  const projects = useTaskStore((s) => s.projects);
  const addProject = useTaskStore((s) => s.addProject);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const current = projects.find((p) => p.id === value) ?? null;

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: { kind: 'pick' | 'create'; id: string; name: string; color: number }[] = projects
      .filter((p) => p.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
      .map((p) => ({ kind: 'pick', id: p.id, name: p.name, color: p.color }));
    if (q && !projects.some((p) => p.name.toLowerCase() === q)) list.unshift({ kind: 'create', id: '', name: query.trim(), color: 0 });
    return list;
  }, [projects, query]);

  const choose = (row: (typeof rows)[number] | undefined) => {
    if (!row) return;
    onChange(row.kind === 'create' ? addProject(row.name) : row.id);
    setOpen(false);
    anchorRef.current?.focus({ preventScroll: true });
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(rows.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(rows[active]);
    }
  };

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label="프로젝트"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex min-w-0 items-center gap-2 text-left ${triggerClassName}`}
      >
        {renderTrigger ? (
          renderTrigger(value)
        ) : current ? (
          <>
            <div className={`size-2 flex-none rounded-full ${PROJECT_DOTS[current.color]}`} />
            <div className="truncate">{current.name}</div>
          </>
        ) : (
          <>
            <FolderPlus className="size-4 text-text-muted" />
            <div className="text-text-muted">비어 있음</div>
          </>
        )}
      </button>

      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} title="프로젝트">
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
              placeholder="프로젝트 찾기 또는 새로 만들기"
              aria-controls={listId}
              className="h-9 w-full rounded-lg bg-bg-muted px-3 text-sm outline-none placeholder:text-text-muted focus:bg-bg-surface focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div id={listId} role="listbox" aria-label="프로젝트" className="flex max-h-72 flex-col gap-px overflow-y-auto p-1">
            {rows.map((row, i) => (
              <div
                key={`${row.kind}-${row.id || row.name}`}
                role="option"
                aria-selected={i === active}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(row)}
                className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-sm sm:min-h-8 ${i === active ? 'bg-bg-hover' : ''}`}
              >
                {row.kind === 'create' ? (
                  <>
                    <div className="grid size-5 place-items-center rounded-full bg-accent-soft text-accent-ink">
                      <Plus className="size-3" strokeWidth={2.6} />
                    </div>
                    <div className="flex min-w-0 gap-1">
                      <div className="flex-none text-text-muted">새 프로젝트</div>
                      <div className="truncate font-semibold">{row.name}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`size-2.5 flex-none rounded-full ${PROJECT_DOTS[row.color]}`} />
                    <div className={`truncate ${row.id === value ? 'font-semibold' : ''}`}>{row.name}</div>
                  </>
                )}
              </div>
            ))}
            {!rows.length ? <div className="px-2.5 py-2 text-xs text-text-muted">이름을 적고 Enter 로 새 프로젝트</div> : null}
            {value ? (
              <div
                role="option"
                aria-selected={false}
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="mt-1 flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg border-t border-border-default px-2.5 text-sm text-text-muted hover:bg-danger-soft hover:text-danger sm:min-h-8"
              >
                <X className="size-4" />
                프로젝트 빼기
              </div>
            ) : null}
          </div>
        </div>
      </Popover>
    </>
  );
}
