import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';

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
  /** 완료 칸: 남은(숨겨진) 개수와 펼치기 */
  hiddenCount?: number;
  onShowMore?: () => void;
  filtered: boolean;
  className?: string;
  /** 모바일: 위 탭에 이미 칸 이름이 있으니 머리글 대신 추가 버튼만 */
  bare?: boolean;
  issues: Map<string, IssueStat>;
};


export default function BoardColumn({ status, tasks, total, onOpen, hiddenCount = 0, onShowMore, filtered, className = '', bare = false, issues }: Props) {
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
      className={`flex min-h-0 min-w-0 flex-col rounded-2xl bg-bg-sunken transition-[box-shadow,background-color] ${
        isOver ? `ring-2 ${statusTone[status].ring}` : ''
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
          <div className="text-[0.8rem] font-semibold text-text-muted tabular-nums" data-testid="column-count">
            {filtered && tasks.length + hiddenCount !== total ? `${tasks.length + hiddenCount}/${total}` : total}
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

        {hiddenCount > 0 ? (
          <button
            type="button"
            onClick={onShowMore}
            className="h-9 flex-none rounded-xl text-xs font-semibold text-text-muted hover:bg-bg-hover hover:text-text-primary"
          >
            {hiddenCount}개 더 보기
          </button>
        ) : null}
      </div>
    </div>
  );
}
