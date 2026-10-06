import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import Popover from '@/components/ui/Popover';

export type SelectOption<T extends string> = {
  value: T;
  label: string;
  icon?: ReactNode;
  hint?: string;
};

type Props<T extends string> = {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  label: string;
  /** 트리거 모양: field(입력칸) · ghost(속성 줄) · chip(필터 칩) */
  variant?: 'field' | 'ghost' | 'chip';
  /** 트리거 안을 직접 그리고 싶을 때 */
  renderValue?: (option: SelectOption<T> | undefined) => ReactNode;
  className?: string;
  /** chip 변형에서 '선택됨' 강조 */
  highlighted?: boolean;
  disabled?: boolean;
  testId?: string;
};

const triggerClass = {
  field:
    'h-9 w-full justify-between rounded-[10px] bg-bg-surface px-3 text-sm shadow-card hover:bg-bg-raised',
  ghost: 'h-8 justify-start rounded-lg px-2 text-sm hover:bg-bg-hover',
  chip: 'h-8 flex-none justify-between rounded-full border px-3 text-[0.8rem] font-semibold whitespace-nowrap',
} as const;

/** 브라우저 기본 select 대신 쓰는 목록 상자 — 키보드(↑↓ Enter Esc, 글자 입력 이동) 지원 */
export default function Select<T extends string>({
  value,
  options,
  onChange,
  label,
  variant = 'field',
  renderValue,
  className = '',
  highlighted = false,
  disabled = false,
  testId,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = useId();
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    requestAnimationFrame(() => listRef.current?.focus({ preventScroll: true }));
  }, [open, options, value]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) anchorRef.current?.focus({ preventScroll: true });
  };

  const choose = (opt: SelectOption<T>) => {
    onChange(opt.value);
    close();
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[active];
      if (opt) choose(opt);
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      // 글자를 치면 그 글자로 시작하는 항목으로
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : '') + e.key.toLowerCase(), at: now };
      const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.current.text));
      if (idx >= 0) setActive(idx);
    }
  };

  const onTriggerKey = (e: KeyboardEvent) => {
    // 열린 직후 포커스가 목록으로 옮겨지기 전에 친 키도 목록이 받게 한다
    if (open) {
      onListKey(e);
      return;
    }
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      setOpen(true);
    }
  };

  const chipTone = highlighted
    ? 'border-accent/40 bg-accent-soft text-accent-ink'
    : 'border-border-default bg-bg-surface text-text-secondary hover:border-border-strong hover:text-text-primary';

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-testid={testId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKey}
        className={`inline-flex min-w-0 items-center gap-2 text-left transition-colors disabled:opacity-50 ${
          triggerClass[variant]
        } ${variant === 'chip' ? chipTone : 'text-text-primary'} ${open && variant !== 'chip' ? 'bg-bg-hover' : ''} ${className}`}
      >
        {renderValue ? (
          renderValue(selected)
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            {selected?.icon}
            <div className="truncate">{selected?.label ?? label}</div>
          </div>
        )}
        {variant !== 'ghost' ? (
          <ChevronDown
            className={`size-3.5 flex-none text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
            strokeWidth={2.2}
          />
        ) : null}
      </button>

      <Popover anchorRef={anchorRef} open={open} onClose={() => close(false)} matchWidth={variant === 'field'} title={label}>
        <div
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className="flex min-w-44 flex-col gap-px p-1 outline-none"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(opt)}
                className={`flex min-h-9 cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm sm:min-h-8 ${
                  i === active ? 'bg-bg-hover' : ''
                }`}
              >
                {opt.icon ? <div className="grid w-4 flex-none place-items-center">{opt.icon}</div> : null}
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className={`truncate ${isSelected ? 'font-semibold text-text-primary' : 'text-text-primary'}`}>
                    {opt.label}
                  </div>
                  {opt.hint ? <div className="truncate text-xs text-text-muted">{opt.hint}</div> : null}
                </div>
                <Check
                  className={`size-4 flex-none text-accent ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                  strokeWidth={2.4}
                />
              </div>
            );
          })}
        </div>
      </Popover>
    </>
  );
}
