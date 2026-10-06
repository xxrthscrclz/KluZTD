import { AlarmClock, CalendarCheck2, CircleDot, MessageSquareWarning, Trophy, UserRoundCheck } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';
import { issueIndex, openIssueMap } from '@/utils/issues';
import { summarize } from '@/utils/task';

function Tile({
  icon,
  label,
  value,
  tone,
  onClick,
  active,
  testId,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
  onClick?: () => void;
  active?: boolean;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      data-testid={testId}
      aria-pressed={active}
      className={`flex min-w-[7.25rem] flex-none items-center gap-2.5 rounded-xl bg-bg-surface px-3 py-2 text-left transition-shadow sm:min-w-[8.5rem] sm:flex-1 sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-3 ${
        active ? 'shadow-card ring-2 ring-accent/50' : 'shadow-card enabled:hover:shadow-card-hover'
      }`}
    >
      <div className={`grid size-7 flex-none place-items-center rounded-lg sm:size-9 sm:rounded-xl ${tone}`}>{icon}</div>
      <div className="flex min-w-0 flex-col">
        <div className="text-lg leading-none font-extrabold tabular-nums sm:text-[1.35rem]">{value}</div>
        <div className="mt-0.5 truncate text-[0.7rem] font-medium text-text-muted sm:mt-1 sm:text-xs">{label}</div>
      </div>
    </button>
  );
}

/** 보드 위 현재 상태 요약 — 누르면 해당 조건으로 필터 */
export default function StatusSummary() {
  const tasks = useTaskStore((s) => s.tasks);
  const days = useTaskStore((s) => s.days);
  const filter = useUiStore((s) => s.boardFilter);
  const setFilter = useUiStore((s) => s.setBoardFilter);
  const s = useMemo(() => summarize(tasks, openIssueMap(issueIndex(days))), [tasks, days]);
  const ic = 'size-[18px]';

  const toggleDue = (due: 'overdue' | 'today') => setFilter({ due: filter.due === due ? 'all' : due });

  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:gap-2.5 sm:px-0 sm:pb-1">
      <Tile testId="stat-doing" icon={<CircleDot className={ic} />} label="진행 중" value={s.doing} tone="bg-status-doing-soft text-status-doing" />
      <Tile
        testId="stat-overdue"
        icon={<AlarmClock className={ic} />}
        label="마감 지남"
        value={s.overdue}
        tone={s.overdue ? 'bg-danger-soft text-danger' : 'bg-bg-muted text-text-muted'}
        onClick={() => toggleDue('overdue')}
        active={filter.due === 'overdue'}
      />
      <Tile
        testId="stat-today"
        icon={<CalendarCheck2 className={ic} />}
        label="오늘 마감"
        value={s.dueToday}
        tone={s.dueToday ? 'bg-warn-soft text-warn' : 'bg-bg-muted text-text-muted'}
        onClick={() => toggleDue('today')}
        active={filter.due === 'today'}
      />
      <Tile
        testId="stat-delegated"
        icon={<UserRoundCheck className={ic} />}
        label="담당자 있는 일"
        value={s.delegated}
        tone="bg-status-waiting-soft text-status-waiting"
        onClick={() => setFilter({ delegate: filter.delegate === 'others' ? 'all' : 'others' })}
        active={filter.delegate === 'others'}
      />
      <Tile
        testId="stat-issues"
        icon={<MessageSquareWarning className={ic} />}
        label="미해결 이슈"
        value={s.openIssues}
        tone={s.openIssues ? 'bg-danger-soft text-danger' : 'bg-bg-muted text-text-muted'}
      />
      <Tile testId="stat-done" icon={<Trophy className={ic} />} label="이번 주 완료" value={s.doneThisWeek} tone="bg-status-done-soft text-status-done" />
    </div>
  );
}
