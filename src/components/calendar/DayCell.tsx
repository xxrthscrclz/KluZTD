import { useDroppable } from '@dnd-kit/core';
import { CheckCheck, MessageSquareWarning } from 'lucide-react';

import ScheduleChip from '@/components/calendar/ScheduleChip';
import { useTaskParam } from '@/hooks/useTaskParam';
import type { DaySummary } from '@/utils/calendar';

type Props = {
  date: Date;
  summary: DaySummary;
  inMonth: boolean;
  isToday: boolean;
  selected: boolean;
  compact: boolean;
  onSelect: () => void;
  onOpenDay: () => void;
};

const MAX_CHIPS = 3;

/** 달력 한 칸: 날짜 · 체크리스트 할 일·이날 마감(끌어서 이동) · 진행 · 완료 · 이슈 */
export default function DayCell({ date, summary, inMonth, isToday, selected, compact, onSelect, onOpenDay }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${summary.key}` });
  const { open } = useTaskParam();
  const dow = date.getDay();
  const doneItems = summary.planned.filter((t) => t.status === 'done').length;
  const openIssues = summary.issues.filter((i) => !i.resolved).length;
  const chips = [
    ...summary.planned.map((t) => ({ task: t, kind: 'planned' as const })),
    ...summary.dueOnly.map((t) => ({ task: t, kind: 'due' as const })),
  ];
  const extraChips = Math.max(0, chips.length - MAX_CHIPS);

  return (
    <div
      ref={setNodeRef}
      role="gridcell"
      aria-selected={selected}
      aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일`}
      tabIndex={selected ? 0 : -1}
      data-testid="cal-day"
      data-date={summary.key}
      onClick={onSelect}
      onDoubleClick={onOpenDay}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpenDay();
      }}
      className={`flex min-w-0 cursor-pointer flex-col gap-1 border-t border-l border-border-default p-1.5 transition-colors outline-none ${
        compact ? 'min-h-[4.25rem]' : 'min-h-[7.5rem]'
      } ${inMonth ? 'bg-bg-surface' : 'bg-bg-raised'} ${selected ? 'relative z-[1] ring-2 ring-accent ring-inset' : 'hover:bg-bg-hover'} ${
        isOver ? 'bg-accent-soft' : ''
      }`}
    >
      <div className="flex items-center gap-1">
        <div
          className={`grid size-6 flex-none place-items-center rounded-full text-[0.78rem] font-semibold tabular-nums ${
            isToday
              ? 'bg-accent text-white'
              : !inMonth
                ? 'text-text-muted/60'
                : dow === 0
                  ? 'text-danger'
                  : dow === 6
                    ? 'text-accent-ink'
                    : 'text-text-primary'
          }`}
        >
          {date.getDate()}
        </div>
        {!compact && summary.planned.length ? (
          <div className="ml-auto flex items-center gap-1 text-[0.66rem] font-semibold text-text-muted tabular-nums" title="체크리스트">
            <CheckCheck className="size-3" />
            {doneItems}/{summary.planned.length}
          </div>
        ) : null}
        {!compact && openIssues ? (
          <div className={`flex items-center gap-0.5 text-[0.66rem] font-semibold text-danger ${summary.planned.length ? '' : 'ml-auto'}`} title="미해결 이슈">
            <MessageSquareWarning className="size-3" />
            {openIssues}
          </div>
        ) : null}
      </div>

      {compact ? (
        // 모바일: 점으로만
        <div className="flex flex-wrap gap-0.5 px-0.5">
          {summary.planned.slice(0, 4).map((t) => (
            <div key={t.id} className={`size-1.5 rounded-full ${t.status === 'done' ? 'bg-status-done' : 'bg-accent'}`} />
          ))}
          {summary.dueOnly.length ? <div className="size-1.5 rounded-full ring-1 ring-danger" /> : null}
          {openIssues ? <div className="size-1.5 rounded-full bg-danger" /> : null}
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-0.5">
          {chips.slice(0, MAX_CHIPS).map(({ task, kind }) => (
            <ScheduleChip key={`${kind}-${task.id}`} task={task} kind={kind} onOpen={open} />
          ))}
          {extraChips ? <div className="px-1 text-[0.68rem] font-semibold text-text-muted">+{extraChips}개 더</div> : null}
          {summary.completedElsewhere.length ? (
            <div className="truncate px-1 text-[0.68rem] text-status-done">✓ {summary.completedElsewhere.length}개 완료</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
