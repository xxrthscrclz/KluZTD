import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarArrowUp, GripVertical, ListX, Maximize2, MessageSquarePlus, MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { DelegateField, DueField, ProjectField } from '@/components/task/fields';
import { PriorityIcon, StatusBadge } from '@/components/ui/Badges';
import IconButton from '@/components/ui/IconButton';
import Popover from '@/components/ui/Popover';
import { useTaskParam } from '@/hooks/useTaskParam';
import { exitMs, SORT_TRANSITION } from '@/lib/motion';
import type { Task } from '@/types/task';

type Props = {
  task: Task;
  /** 이 할 일에 연결된 그날 이슈 수 */
  issueCount: { open: number; total: number };
  autoFocus: boolean;
  onFocused: () => void;
  onToggle: () => void;
  onTitle: (title: string) => void;
  /** Enter: 아래에 새 줄 */
  onEnter: () => void;
  /** 빈 줄에서 Backspace: 지우고 위 줄로 */
  onRemoveEmpty: () => void;
  /** 빈 채로 포커스를 잃음 */
  onBlank: () => void;
  onDelete: () => void;
  onPostpone: () => void;
  /** 체크리스트에서만 빼기 (상태 관리에는 남음) */
  onUnplan: () => void;
  /** 메뉴 '이슈 기록': 새 이슈 */
  onIssue: () => void;
  /** 이슈 아이콘: 연결된 이슈로 이동만 */
  onShowIssues: () => void;
};

/** 체크리스트 한 줄 = 할 일 하나. 노션처럼 Enter 새 줄, 빈 줄 Backspace 삭제. 마감·담당자·프로젝트는 바로 옆에서 */
export default function DayTaskRow({
  task,
  issueCount,
  autoFocus,
  onFocused,
  onToggle,
  onTitle,
  onEnter,
  onRemoveEmpty,
  onBlank,
  onDelete,
  onPostpone,
  onUnplan,
  onIssue,
  onShowIssues,
}: Props) {
  const [title, setTitle] = useState(task.title);
  const [menu, setMenu] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLButtonElement>(null);
  const editing = useRef(false);
  const { open } = useTaskParam();
  const done = task.status === 'done';
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    transition: SORT_TRANSITION,
  });

  useEffect(() => {
    if (!editing.current) setTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const leaveThen = (fn: () => void) => {
    setLeaving(true);
    setTimeout(fn, exitMs());
  };

  const commit = () => {
    editing.current = false;
    if (!title.trim()) onBlank();
    else if (title.trim() !== task.title) onTitle(title.trim());
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      onToggle();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!title.trim()) return;
      editing.current = false;
      if (title.trim() !== task.title) onTitle(title.trim());
      onEnter();
    } else if (e.key === 'Backspace' && title === '') {
      e.preventDefault();
      onRemoveEmpty();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      data-testid="day-item"
      data-done={done}
      className={`group/item flex flex-wrap items-center gap-x-1.5 rounded-lg py-0.5 pr-1 hover:bg-bg-hover @2xl:flex-nowrap ${
        leaving ? 'anim-collapse' : 'anim-rise'
      } ${isDragging ? 'z-10 bg-bg-surface opacity-80 shadow-drag' : ''}`}
    >
      <div className="flex min-h-9 min-w-[12rem] flex-1 items-center gap-1.5">
        <button
          ref={setActivatorNodeRef}
          type="button"
          aria-label="끌어서 순서 바꾸기"
          className="grid h-8 w-5 flex-none cursor-grab touch-none place-items-center text-text-muted opacity-0 group-hover/item:opacity-100 focus-visible:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>

        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? '완료 해제' : '완료'}
          onClick={onToggle}
          className={`grid size-[1.15rem] flex-none place-items-center rounded-[5px] border-[1.5px] ${
            done ? 'border-accent bg-accent text-white' : 'border-border-strong bg-bg-surface hover:border-accent'
          }`}
        >
          {done ? (
            <svg viewBox="0 0 12 12" className="anim-check size-3" aria-hidden>
              <path d="M2.5 6.2 5 8.6 9.5 3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : null}
        </button>

        {task.priority && !done ? <PriorityIcon priority={task.priority} /> : null}

        <input
          ref={inputRef}
          value={title}
          onChange={(e) => {
            editing.current = true;
            setTitle(e.target.value);
          }}
          onBlur={commit}
          onFocus={onFocused}
          onKeyDown={onKey}
          placeholder="할 일"
          aria-label="할 일"
          className={`h-9 min-w-0 flex-1 bg-transparent px-1.5 text-[0.95rem] transition-[color,text-decoration-color] outline-none placeholder:text-text-muted ${
            done ? 'text-text-muted line-through decoration-border-strong' : 'text-text-primary'
          }`}
        />

        {task.status === 'doing' || task.status === 'waiting' ? <StatusBadge status={task.status} /> : null}
        {issueCount.total ? (
          <button
            type="button"
            onClick={onShowIssues}
            aria-label={`연결된 이슈 ${issueCount.total}개 보기`}
            data-testid="row-issue-count"
            title={`이슈 ${issueCount.total}개 (미해결 ${issueCount.open}) — 눌러서 보기`}
            className={`flex h-[22px] flex-none items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-semibold tabular-nums ${
              issueCount.open ? 'bg-danger-soft text-danger' : 'bg-bg-muted text-text-muted'
            }`}
          >
            <MessageSquarePlus className="size-3" />
            {issueCount.open ? `${issueCount.open}/${issueCount.total}` : issueCount.total}
          </button>
        ) : null}
      </div>

      {/* 정보: 마감 · 담당자 · 프로젝트 — 값이 있으면 늘 보이고, 없으면 마우스를 올렸을 때 */}
      <div className="flex w-full flex-wrap items-center gap-0.5 pl-[3.25rem] @2xl:w-auto @2xl:flex-nowrap @2xl:pl-0" data-testid="day-item-info">
        <Slot filled={Boolean(task.due)}>
          <DueField task={task} chip />
        </Slot>
        <Slot filled={Boolean(task.delegate)}>
          <DelegateField task={task} chip />
        </Slot>
        <Slot filled={Boolean(task.projectId)}>
          <ProjectField task={task} chip />
        </Slot>
        <IconButton label="자세히 (메모·이슈)" size="sm" onClick={() => open(task.id)} className="@2xl:opacity-0 @2xl:group-hover/item:opacity-100 @2xl:focus-visible:opacity-100">
          <Maximize2 className="size-3.5" />
        </IconButton>
        <IconButton
          ref={menuRef}
          label="더 보기"
          size="sm"
          active={menu}
          onClick={() => setMenu((v) => !v)}
          className="@2xl:opacity-0 @2xl:group-hover/item:opacity-100 @2xl:focus-visible:opacity-100"
        >
          <MoreHorizontal className="size-4" />
        </IconButton>
      </div>

      <Popover anchorRef={menuRef} open={menu} onClose={() => setMenu(false)} placement="bottom-end" title={task.title || '할 일'}>
        <div className="flex min-w-52 flex-col p-1">
          <MenuItem icon={<MessageSquarePlus className="size-4" />} label="이슈 기록" hint="아래 이슈 칸에 이 할 일과 연결해서" onClick={() => (setMenu(false), onIssue())} />
          {!done ? (
            <MenuItem icon={<CalendarArrowUp className="size-4" />} label="다음 날로 미루기" onClick={() => (setMenu(false), leaveThen(onPostpone))} />
          ) : null}
          <MenuItem
            icon={<ListX className="size-4" />}
            label="체크리스트에서 빼기"
            hint="상태 관리에는 그대로 남아요"
            onClick={() => (setMenu(false), leaveThen(onUnplan))}
          />
          <MenuItem icon={<Trash2 className="size-4" />} label="삭제" danger onClick={() => (setMenu(false), leaveThen(onDelete))} />
        </div>
      </Popover>
    </div>
  );
}

/** 값이 없는 정보 칩은 카드가 넓을 때 마우스를 올렸을 때만 보인다 (좁으면 항상) */
function Slot({ filled, children }: { filled: boolean; children: ReactNode }) {
  return (
    <div className={filled ? '' : '@2xl:opacity-0 @2xl:group-hover/item:opacity-100 @2xl:focus-within:opacity-100'}>{children}</div>
  );
}

function MenuItem({ icon, label, hint, onClick, danger = false }: { icon: ReactNode; label: string; hint?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm ${
        danger ? 'text-danger hover:bg-danger-soft' : 'text-text-primary hover:bg-bg-hover'
      }`}
    >
      <div className={danger ? '' : 'text-text-muted'}>{icon}</div>
      <div className="flex min-w-0 flex-col">
        <div>{label}</div>
        {hint ? <div className="text-xs text-text-muted">{hint}</div> : null}
      </div>
    </button>
  );
}
