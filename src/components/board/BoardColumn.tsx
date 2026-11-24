import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Archive, ChevronRight, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import TaskCard from '@/components/board/TaskCard';
import { StatusDot } from '@/components/ui/Badges';
import EmptyState from '@/components/ui/EmptyState';
import IconButton from '@/components/ui/IconButton';
import { statusTone } from '@/components/ui/tone';
import { STATUS } from '@/constants/status';
import { useTaskStore } from '@/stores/taskStore';
import type { BoardStatus, Task } from '@/types/task';
import type { IssueStat } from '@/utils/issues';

import { columnDropId } from './dnd';

type Props = {
  status: BoardStatus;
  tasks: Task[];
  total: number;
  onOpen: (id: string) => void;
  /** 완료 칸: 일주일 지나 아카이브로 넘어간 개수 */
  archivedCount?: number;
  filtered: boolean;
  className?: string;
  /** 모바일: 위 탭에 이미 칸 이름이 있으니 머리글 대신 추가 버튼만 */
  bare?: boolean;
  issues: Map<string, IssueStat>;
  /** 드래그 중인 카드가 이 칸으로 옮겨질 참 */
  isTarget?: boolean;
};


export default function BoardColumn({ status, tasks, total, onOpen, archivedCount = 0, filtered, className = '', bare = false, issues, isTarget = false }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: columnDropId(status), data: { type: 'column', status } });
  const addTask = useTaskStore((s) => s.addTask);
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const def = STATUS[status];

  const startAdding = () => {
    setAdding(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = () => {
    const t = title.trim();
    if (!t) {
      setAdding(false);
      return;
    }
    addTask({ title: t, status }, 'top');
    setTitle('');
    inputRef.current?.focus();
  };

  return (
    <div
      role="region"
      aria-label={def.label}
      data-testid={`column-${status}`}
      data-target={isTarget || undefined}
      className={`relative flex min-h-0 min-w-0 flex-col rounded-2xl outline-2 -outline-offset-2 transition-[background-color,outline-color,box-shadow] ${
        isTarget || isOver ? `${statusTone[status].soft} outline-dashed ${statusTone[status].outline}` : 'bg-bg-sunken outline-transparent'
      } ${className}`}
    >
      {bare ? (
        <button
          type="button"
          onClick={startAdding}
          className="mx-2 mt-2 mb-1 flex h-10 flex-none items-center justify-center gap-1.5 rounded-xl border border-dashed border-border-strong text-sm font-semibold text-text-muted active:bg-bg-hover"
        >
          <Plus className="size-4" />
          {def.label}에 추가
        </button>
      ) : (
        <div className="flex flex-none items-center gap-2 px-3 pt-3 pb-2">
          <StatusDot status={status} />
          <div className="text-[0.84rem] font-bold">{def.label}</div>
          {isTarget ? (
            <div className={`anim-pop rounded-full px-2 py-0.5 text-[0.68rem] font-bold ${statusTone[status].text} bg-bg-surface`} data-testid="drop-target-label">
              여기로 이동
            </div>
          ) : null}
          <div className="text-[0.8rem] font-semibold text-text-muted tabular-nums" data-testid="column-count">
            {filtered && tasks.length !== total ? `${tasks.length}/${total}` : total}
          </div>
          <IconButton label={`${def.label}에 추가`} size="sm" className="ml-auto" onClick={startAdding}>
            <Plus className="size-4" />
          </IconButton>
        </div>
      )}

      <div ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
        {adding ? (
          <div className="anim-pop rounded-xl bg-bg-surface p-1 shadow-card">
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.nativeEvent.isComposing) return;
                if (e.key === 'Enter') submit();
                if (e.key === 'Escape') {
                  setTitle('');
                  setAdding(false);
                }
              }}
              onBlur={() => {
                if (!title.trim()) setAdding(false);
              }}
              placeholder="제목 입력 후 Enter"
              aria-label={`${def.label}에 새 할 일`}
              className="h-9 w-full rounded-lg bg-transparent px-2.5 text-sm outline-none placeholder:text-text-muted"
            />
          </div>
        ) : null}

        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onOpen={onOpen} issueStat={issues.get(task.id)} />
          ))}
        </SortableContext>

        {!tasks.length && !adding ? (
          <EmptyState compact title={filtered ? '조건에 맞는 항목 없음' : '비어 있음'} description={filtered ? undefined : def.hint} />
        ) : null}

        {archivedCount > 0 ? (
          <Link
            to="/archive"
            data-testid="archive-link"
            className="flex h-9 flex-none items-center justify-center gap-1.5 rounded-xl text-xs font-semibold text-text-muted hover:bg-bg-hover hover:text-text-primary"
          >
            <Archive className="size-3.5" />
            일주일 지난 {archivedCount}개는 아카이브에
            <ChevronRight className="size-3.5" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
