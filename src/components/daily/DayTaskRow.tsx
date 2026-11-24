import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarArrowUp, GripVertical, Info, ListX, Maximize2, MessageSquarePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

import { DelegateField, DueField, PriorityField, ProjectField, StatusField } from '@/components/task/fields';
import Popover from '@/components/ui/Popover';
import { useTaskParam } from '@/hooks/useTaskParam';
import { exitMs, SORT_TRANSITION } from '@/lib/motion';
import type { Task } from '@/types/task';
import { todayIsoKey } from '@/utils/date';

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
  /** '이슈 기록': 새 이슈 */
  onIssue: () => void;
  /** 이슈 아이콘: 연결된 이슈로 이동만 */
  onShowIssues: () => void;
};

/**
 * 체크리스트 한 줄 = 할 일 하나. 줄에는 체크·제목만, 나머지는 ⓘ 정보 카드 안에.
 * 노션처럼 Enter 새 줄, 빈 줄 Backspace 삭제.
 */
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
  const [info, setInfo] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const infoRef = useRef<HTMLButtonElement>(null);
  const editing = useRef(false);
  const { open } = useTaskParam();
  const done = task.status === 'done';
  const hasInfo = Boolean(task.due || task.delegate || task.projectId || task.priority || task.status === 'doing' || task.status === 'waiting');
  const urgent = !done && Boolean(task.due && task.due <= todayIsoKey());
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
    setInfo(false);
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
      className={`group/item flex min-h-10 items-center gap-1.5 rounded-lg pr-1 hover:bg-bg-hover ${leaving ? 'anim-collapse' : 'anim-rise'} ${
        isDragging ? 'z-10 bg-bg-surface opacity-80 shadow-drag' : ''
      }`}
    >
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

      <button
        ref={infoRef}
        type="button"
        aria-label="정보"
        title="정보 (마감·담당자·프로젝트·메모)"
        aria-expanded={info}
        data-testid="row-info"
        onClick={() => setInfo((v) => !v)}
        className={`relative grid size-8 flex-none place-items-center rounded-lg transition-colors ${
          info ? 'bg-bg-active text-text-primary' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
        }`}
      >
        <Info className="size-4" />
        {hasInfo ? (
          <div className={`absolute top-1.5 right-1.5 size-1.5 rounded-full ${urgent ? 'bg-danger' : 'bg-accent'}`} aria-hidden data-testid="row-info-dot" />
        ) : null}
      </button>

      <Popover anchorRef={infoRef} open={info} onClose={() => setInfo(false)} placement="bottom-end" title={task.title || '할 일'}>
        <div className="flex w-full flex-col gap-1 p-2 sm:w-[19rem]" data-testid="row-info-card">
          <InfoRow label="상태">
            <StatusField task={task} />
          </InfoRow>
          <InfoRow label="마감일">
            <DueField task={task} />
          </InfoRow>
          <InfoRow label="담당자">
            <DelegateField task={task} />
          </InfoRow>
          <InfoRow label="프로젝트">
            <ProjectField task={task} />
          </InfoRow>
          <InfoRow label="우선순위">
            <PriorityField task={task} />
          </InfoRow>

          <div className="mt-1 grid grid-cols-2 gap-1 border-t border-border-default pt-2">
            <Action icon={<Maximize2 className="size-3.5" />} label="자세히 (메모)" onClick={() => (setInfo(false), open(task.id))} />
            <Action icon={<MessageSquarePlus className="size-3.5" />} label="이슈 기록" onClick={() => (setInfo(false), onIssue())} />
            {!done ? <Action icon={<CalendarArrowUp className="size-3.5" />} label="다음 날로 미루기" onClick={() => leaveThen(onPostpone)} /> : null}
            <Action icon={<ListX className="size-3.5" />} label="체크리스트에서 빼기" onClick={() => leaveThen(onUnplan)} />
            <Action icon={<Trash2 className="size-3.5" />} label="삭제" danger onClick={() => leaveThen(onDelete)} />
          </div>
        </div>
      </Popover>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid min-h-9 grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-1">
      <div className="pl-1 text-[0.78rem] text-text-muted">{label}</div>
      <div className="flex min-w-0 items-center">{children}</div>
    </div>
  );
}

function Action({ icon, label, onClick, danger = false }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-8 min-w-0 items-center gap-1.5 rounded-lg px-2 text-left text-[0.78rem] font-medium ${
        danger ? 'text-danger hover:bg-danger-soft' : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
      }`}
    >
      <div className="flex-none">{icon}</div>
      <div className="truncate">{label}</div>
    </button>
  );
}
