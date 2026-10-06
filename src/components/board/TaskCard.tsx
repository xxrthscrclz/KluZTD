import { useSortable } from '@dnd-kit/sortable';
import { SORT_TRANSITION } from '@/lib/motion';
import { CSS } from '@dnd-kit/utilities';
import { ListChecks, NotebookText } from 'lucide-react';
import { forwardRef, memo, type HTMLAttributes, type KeyboardEvent } from 'react';

import { DelegateChip, DueChip, IssueCount, PriorityIcon, ProjectChip, StatusDot } from '@/components/ui/Badges';
import { useTaskStore } from '@/stores/taskStore';
import { formatDate, todayIsoKey } from '@/utils/date';
import type { Task } from '@/types/task';
import { isDocEmpty } from '@/utils/doc';
import type { IssueStat } from '@/utils/issues';

type CardProps = {
  task: Task;
  onOpen?: (id: string) => void;
  overlay?: boolean;
  dragging?: boolean;
  /** 연결된 이슈 수 */
  issueStat?: IssueStat;
} & HTMLAttributes<HTMLDivElement>;

/** 보드 카드 겉모습 (드래그 오버레이에서도 그대로 씀) */
export const TaskCardBody = memo(
  forwardRef<HTMLDivElement, CardProps>(function TaskCardBody({ task, onOpen, overlay = false, dragging = false, issueStat, style, ...rest }, ref) {
    const issueTotal = issueStat?.total ?? 0;
    const done = task.status === 'done';
    const hasNote = !isDocEmpty(task.note);
    const project = useTaskStore((s) => (task.projectId ? s.projects.find((p) => p.id === task.projectId) : undefined));
    const hasMeta = task.due || task.delegate || issueTotal || hasNote || project || task.plannedOn;

    return (
      <div
        ref={ref}
        style={style}
        {...rest}
        role="button"
        tabIndex={overlay ? -1 : 0}
        aria-roledescription="카드"
        aria-label={`${task.title || '제목 없음'} — Enter 열기, Space 집어서 옮기기`}
        onClick={() => onOpen?.(task.id)}
        onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
          rest.onKeyDown?.(e);
          if (e.key === 'Enter' && !dragging && !e.defaultPrevented) onOpen?.(task.id);
        }}
        data-testid={overlay ? 'task-card-overlay' : 'task-card'}
        data-status={task.status}
        className={`group/card flex cursor-pointer touch-manipulation flex-col gap-2 rounded-xl bg-bg-surface px-3 py-2.5 text-left transition-[box-shadow,opacity] select-none ${
          overlay ? 'rotate-[1.5deg] cursor-grabbing shadow-drag' : 'anim-pop shadow-card hover:shadow-card-hover'
        } ${dragging ? 'opacity-35' : ''}`}
      >
        <div className="flex items-start gap-2">
          {done ? (
            <StatusDot status="done" className="mt-[0.2rem]" />
          ) : task.priority ? (
            <PriorityIcon priority={task.priority} className="mt-[0.2rem]" />
          ) : null}
          <div
            className={`line-clamp-3 min-w-0 flex-1 text-[0.88rem] leading-snug font-medium break-words ${
              done ? 'text-text-muted' : 'text-text-primary'
            }`}
          >
            {task.title || '제목 없음'}
          </div>
        </div>
        {hasMeta ? (
          <div className="flex flex-wrap items-center gap-1">
            {project ? <ProjectChip name={project.name} color={project.color} /> : null}
            {task.due ? <DueChip due={task.due} done={done} /> : null}
            {task.delegate ? <DelegateChip name={task.delegate} /> : null}
            <IssueCount open={issueStat?.open ?? 0} total={issueTotal} />
            {task.plannedOn && !done ? (
              <div
                className={`inline-flex h-[22px] items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-semibold ${
                  task.plannedOn === todayIsoKey() ? 'bg-accent-soft text-accent-ink' : 'bg-bg-muted text-text-muted'
                }`}
                title="체크리스트에 올린 날"
              >
                <ListChecks className="size-3" />
                {task.plannedOn === todayIsoKey() ? '오늘' : formatDate(task.plannedOn)}
              </div>
            ) : null}
            {hasNote ? (
              <div className="grid h-[22px] w-[22px] place-items-center rounded-md text-text-muted" title="메모 있음">
                <NotebookText className="size-3.5" />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }),
);

/** 끌 수 있는 카드 — 드래그 핸들러와 포커스가 한 요소에 모인다 */
export default function TaskCard({ task, onOpen, issueStat }: { task: Task; onOpen: (id: string) => void; issueStat?: IssueStat }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    transition: SORT_TRANSITION,
    data: { type: 'card', status: task.status },
  });
  return (
    <TaskCardBody
      ref={setNodeRef}
      task={task}
      onOpen={onOpen}
      issueStat={issueStat}
      dragging={isDragging}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
    />
  );
}
