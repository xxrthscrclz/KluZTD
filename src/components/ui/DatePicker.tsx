import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import Popover from '@/components/ui/Popover';
import { addDays, fromDateKey, monthGrid, nextWeekday, startOfToday, toDateKey, WEEKDAYS } from '@/utils/date';

type Props = {
  value: string | null;
  onChange: (value: string | null) => void;
  label?: string;
  /** 트리거 안을 직접 그릴 때 */
  renderTrigger?: (value: string | null) => ReactNode;
  triggerClassName?: string;
  testId?: string;
  /** '지우기' 버튼 보이기 */
  clearable?: boolean;
};

const QUICK = [
  { label: '오늘', get: () => startOfToday() },
  { label: '내일', get: () => addDays(startOfToday(), 1) },
  { label: '금요일', get: () => nextWeekday(5, new Date(), true) },
  { label: '다음 주 월', get: () => nextWeekday(1) },
];

/** 브라우저 기본 date 입력 대신 쓰는 달력 */
export default function DatePicker({ value, onChange, label = '마감일', renderTrigger, triggerClassName = '', testId, clearable = true }: Props) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const selected = value ? fromDateKey(value) : null;
  const [view, setView] = useState(() => selected ?? startOfToday());
  const [focusKey, setFocusKey] = useState(() => toDateKey(selected ?? startOfToday()));

  useEffect(() => {
    if (!open) return;
    const base = (value && fromDateKey(value)) || startOfToday();
    setView(new Date(base.getFullYear(), base.getMonth(), 1));
    setFocusKey(toDateKey(base));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    gridRef.current?.querySelector<HTMLElement>(`[data-key="${focusKey}"]`)?.focus({ preventScroll: true });
  }, [open, focusKey, view]);

  const pick = (key: string | null) => {
    onChange(key);
    setOpen(false);
    anchorRef.current?.focus({ preventScroll: true });
  };

  const moveFocus = (days: number) => {
    const current = fromDateKey(focusKey) ?? startOfToday();
    const next = addDays(current, days);
    setFocusKey(toDateKey(next));
    if (next.getMonth() !== view.getMonth() || next.getFullYear() !== view.getFullYear()) {
      setView(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  };

  const onGridKey = (e: KeyboardEvent) => {
    const map: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (e.key in map) {
      e.preventDefault();
      moveFocus(map[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(focusKey);
    }
  };

  const today = toDateKey(new Date());
  const days = monthGrid(view.getFullYear(), view.getMonth());
  const shiftMonth = (n: number) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1));

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex min-w-0 items-center gap-2 text-left transition-colors ${triggerClassName}`}
      >
        {renderTrigger ? (
          renderTrigger(value)
        ) : (
          <>
            <CalendarDays className="size-4 text-text-muted" />
            <div className="truncate">{value ?? '날짜 없음'}</div>
          </>
        )}
      </button>

      <Popover anchorRef={anchorRef} open={open} onClose={() => setOpen(false)} title={label} placement="bottom-start">
        <div className="flex w-full flex-col gap-3 p-3 sm:w-[18.5rem]" data-testid="date-picker">
          <div className="grid grid-cols-4 gap-1.5">
            {QUICK.map((q) => {
              const key = toDateKey(q.get());
              return (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => pick(key)}
                  className={`h-8 rounded-lg text-xs font-semibold transition-colors ${
                    value === key ? 'bg-text-primary text-bg-surface' : 'bg-bg-muted text-text-secondary hover:bg-bg-active hover:text-text-primary'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <div className="pl-1 text-sm font-bold tabular-nums">
              {view.getFullYear()}년 {view.getMonth() + 1}월
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                aria-label="이전 달"
                onClick={() => shiftMonth(-1)}
                className="grid size-7 place-items-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = startOfToday();
                  setView(new Date(t.getFullYear(), t.getMonth(), 1));
                  setFocusKey(toDateKey(t));
                }}
                className="h-7 rounded-lg px-2 text-xs font-semibold text-text-secondary hover:bg-bg-hover"
              >
                이번 달
              </button>
              <button
                type="button"
                aria-label="다음 달"
                onClick={() => shiftMonth(1)}
                className="grid size-7 place-items-center rounded-lg text-text-muted hover:bg-bg-hover hover:text-text-primary"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-center text-[0.7rem] font-semibold text-text-muted">
            {WEEKDAYS.map((w, i) => (
              <div key={w} className={`py-1 ${i === 0 ? 'text-danger/80' : i === 6 ? 'text-accent/80' : ''}`}>
                {w}
              </div>
            ))}
          </div>

          <div ref={gridRef} role="grid" onKeyDown={onGridKey} className="-mt-2 grid grid-cols-7 gap-y-0.5">
            {days.map((d) => {
              const key = toDateKey(d);
              const inMonth = d.getMonth() === view.getMonth();
              const isSel = key === value;
              const isToday = key === today;
              const dow = d.getDay();
              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  data-key={key}
                  tabIndex={key === focusKey ? 0 : -1}
                  aria-selected={isSel}
                  aria-label={`${d.getMonth() + 1}월 ${d.getDate()}일`}
                  onClick={() => pick(key)}
                  className={`relative mx-auto grid size-9 place-items-center rounded-full text-[0.82rem] tabular-nums transition-colors sm:size-8 ${
                    isSel
                      ? 'bg-accent font-bold text-white'
                      : `hover:bg-bg-hover ${inMonth ? (dow === 0 ? 'text-danger' : dow === 6 ? 'text-accent-ink' : 'text-text-primary') : 'text-text-muted/60'}`
                  } ${isToday && !isSel ? 'font-bold ring-1 ring-accent/50 ring-inset' : ''}`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          {value && clearable ? (
            <button
              type="button"
              onClick={() => pick(null)}
              className="flex h-8 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-text-muted hover:bg-danger-soft hover:text-danger"
            >
              <X className="size-3.5" />
              {label} 지우기
            </button>
          ) : null}
        </div>
      </Popover>
    </>
  );
}
