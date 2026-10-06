import { BellRing, ChevronDown, ListPlus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DelegateChip, DueChip, ProjectChip, StatusBadge } from '@/components/ui/Badges';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTaskParam } from '@/hooks/useTaskParam';
import { useTaskStore } from '@/stores/taskStore';
import { toast } from '@/stores/toastStore';
import { todayIsoKey } from '@/utils/date';
import { URGENT_DAYS, urgentUnplanned } from '@/utils/task';

/** 마감 임박 알림이 몇 개인지 (내비 배지용) */
export function useUrgentCount() {
  const tasks = useTaskStore((s) => s.tasks);
  return useMemo(() => urgentUnplanned(tasks, todayIsoKey()).length, [tasks]);
}

/**
 * 빨간 알림 — 상태 관리에서 마감이 3일 안(또는 지남)인데 체크리스트에 안 올린 할 일.
 * 누르면 오늘 체크리스트로 바로 넣는다.
 */
export default function UrgentPanel() {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const planTask = useTaskStore((s) => s.planTask);
  const { open } = useTaskParam();
  const today = todayIsoKey();
  const list = useMemo(() => urgentUnplanned(tasks, today), [tasks, today]);
  const isMobile = useIsMobile();
  const [expanded, setExpanded] = useState(false);
  // 체크리스트를 밀어내지 않게 — 가장 급한 몇 개만 먼저 (모바일 1개, 넓은 화면 3개)
  const limit = isMobile ? 1 : 3;
  const shown = expanded ? list : list.slice(0, limit);
  const hidden = list.length - shown.length;

  if (!list.length) return null;

  const planAll = () => {
    for (const t of list) planTask(t.id, today);
    toast({ message: `${list.length}개를 오늘 체크리스트에 넣었어요`, tone: 'success' }, 2400);
  };

  return (
    <div
      role="alert"
      data-testid="urgent-panel"
      className="anim-rise flex flex-col gap-2.5 rounded-2xl border border-danger/30 bg-danger-soft p-3.5"
    >
      <div className="flex items-center gap-2">
        <div className="grid size-7 place-items-center rounded-lg bg-danger text-white">
          <BellRing className="size-4" />
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="text-sm font-bold text-danger">마감 임박 · 체크리스트에 없음</div>
          <div className="text-[0.7rem] text-danger/80">마감 {URGENT_DAYS}일 전부터 알려 드려요</div>
        </div>
        <div className="ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-danger px-1.5 text-xs font-bold text-white tabular-nums">{list.length}</div>
      </div>

      <div className="flex flex-col gap-1.5">
        {shown.map((t) => {
          const project = projects.find((p) => p.id === t.projectId);
          return (
            <div key={t.id} data-testid="urgent-item" className="anim-rise flex flex-col gap-1.5 rounded-xl bg-bg-surface p-2.5 shadow-card">
              <button type="button" onClick={() => open(t.id)} className="flex min-w-0 items-center gap-2 text-left">
                <div className="min-w-0 flex-1 truncate text-sm font-semibold">{t.title}</div>
                {t.due ? <DueChip due={t.due} /> : null}
              </button>
              <div className="flex flex-wrap items-center gap-1">
                <StatusBadge status={t.status} />
                {project ? <ProjectChip name={project.name} color={project.color} /> : null}
                {t.delegate ? <DelegateChip name={t.delegate} /> : null}
                <button
                  type="button"
                  onClick={() => {
                    planTask(t.id, today);
                    toast({ message: `«${t.title}» → 오늘 체크리스트`, tone: 'success' }, 2200);
                  }}
                  className="ml-auto flex h-7 items-center gap-1 rounded-lg bg-danger px-2.5 text-xs font-semibold text-white hover:opacity-90"
                >
                  <ListPlus className="size-3.5" />
                  오늘에 넣기
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {hidden > 0 || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          data-testid="urgent-more"
          className="flex h-8 items-center justify-center gap-1 rounded-lg text-xs font-semibold text-danger hover:bg-danger/10"
        >
          {expanded ? '접기' : `${hidden}개 더 보기`}
          <ChevronDown className={`size-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      ) : null}

      {list.length > 1 ? (
        <button
          type="button"
          onClick={planAll}
          className="h-8 rounded-lg text-xs font-semibold text-danger hover:bg-danger/10"
          data-testid="urgent-plan-all"
        >
          모두 오늘 체크리스트에 넣기
        </button>
      ) : null}
    </div>
  );
}
