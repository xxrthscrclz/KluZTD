import { ListPlus } from 'lucide-react';
import { useMemo } from 'react';

import { ProjectChip, StatusBadge } from '@/components/ui/Badges';
import { useTaskParam } from '@/hooks/useTaskParam';
import { useTaskStore } from '@/stores/taskStore';
import { dueButNotPlanned } from '@/utils/task';

/** 이 날짜가 마감인데 이날 체크리스트에는 없는 할 일 — 한 번에 넣을 수 있게 */
export default function DayDueSection({ date }: { date: string }) {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const planTask = useTaskStore((s) => s.planTask);
  const { open } = useTaskParam();
  const list = useMemo(() => dueButNotPlanned(tasks, date), [tasks, date]);
  if (!list.length) return null;

  return (
    <div className="mt-2 flex flex-col gap-1 border-t border-border-default pt-3" data-testid="day-due">
      <div className="pl-[1.625rem] text-xs font-bold text-text-muted">이날 마감 · 체크리스트에 없음 {list.length}</div>
      {list.map((t) => {
        const project = projects.find((p) => p.id === t.projectId);
        return (
          <div key={t.id} data-testid="day-due-task" className="anim-rise flex min-h-9 items-center gap-2 rounded-lg pr-1 pl-[1.625rem] hover:bg-bg-hover">
            <button type="button" onClick={() => open(t.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
              <div className="min-w-0 flex-1 truncate text-sm text-text-secondary">{t.title}</div>
              {project ? <ProjectChip name={project.name} color={project.color} /> : null}
              <StatusBadge status={t.status} />
            </button>
            <button
              type="button"
              onClick={() => planTask(t.id, date)}
              title="이날 체크리스트에 넣기"
              aria-label={`«${t.title}» 이날 체크리스트에 넣기`}
              className="flex h-7 flex-none items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent-ink hover:bg-accent-soft"
            >
              <ListPlus className="size-3.5" />
              넣기
            </button>
          </div>
        );
      })}
    </div>
  );
}
