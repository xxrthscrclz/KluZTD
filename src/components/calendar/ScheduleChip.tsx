import { useDraggable } from '@dnd-kit/core';

import { statusTone } from '@/components/ui/tone';
import type { Task } from '@/types/task';

/** 달력 칸 안의 일정 — 끌어서 다른 날로 옮길 수 있다 */
/** kind: planned = 그날 체크리스트, due = 그날 마감(체크리스트엔 없음) */
export function ScheduleChipBody({ task, overlay = false, kind = 'planned' }: { task: Task; overlay?: boolean; kind?: 'planned' | 'due' }) {
  const done = task.status === 'done';
  return (
    <div
      className={`flex h-[1.35rem] min-w-0 items-center gap-1.5 rounded-md px-1.5 text-[0.72rem] font-medium ${
        kind === 'due' ? 'border border-dashed border-danger/50 bg-bg-surface' : statusTone[task.status].soft
      } ${overlay ? 'shadow-drag' : ''}`}
      title={kind === 'due' ? '이날 마감 (체크리스트에는 없음)' : undefined}
    >
      <div className={`size-1.5 flex-none rounded-full ${statusTone[task.status].dot}`} />
      <div className={`truncate ${done ? 'text-text-muted line-through' : 'text-text-primary'}`}>{task.title}</div>
    </div>
  );
}

export default function ScheduleChip({ task, onOpen, kind = 'planned' }: { task: Task; onOpen: (id: string) => void; kind?: 'planned' | 'due' }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `${kind}:${task.id}`, data: { taskId: task.id, kind } });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid="cal-chip"
      title={`${task.title} — 눌러서 열기, 끌어서 다른 날로`}
      className={`min-w-0 cursor-grab touch-none active:cursor-grabbing ${isDragging ? 'opacity-30' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(task.id);
      }}
    >
      <ScheduleChipBody task={task} kind={kind} />
    </div>
  );
}
