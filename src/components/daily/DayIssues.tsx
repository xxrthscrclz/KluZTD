import { useMemo } from 'react';

import IssueList, { type FocusRequest, type HighlightRequest } from '@/components/task/IssueList';
import Select, { type SelectOption } from '@/components/ui/Select';
import { announceDelete } from '@/lib/feedback';
import { useTaskStore } from '@/stores/taskStore';
import type { Issue } from '@/types/task';
import { dayTasks } from '@/utils/task';

const NONE = '__none__';

type Props = {
  date: string;
  focusRequest: FocusRequest;
  highlight: HighlightRequest;
};

/**
 * 체크리스트 아래 — 그날의 이슈. 각 이슈는 아무 할 일에나 연결할 수 있고,
 * 연결하면 그 할 일 상세·카드·프로젝트에도 같은 이슈로 보인다.
 */
export default function DayIssues({ date, focusRequest, highlight }: Props) {
  const day = useTaskStore((s) => s.days[date]);
  const tasks = useTaskStore((s) => s.tasks);
  const addIssue = useTaskStore((s) => s.addIssue);
  const updateIssue = useTaskStore((s) => s.updateIssue);
  const deleteIssue = useTaskStore((s) => s.deleteIssue);
  const issues = useMemo(() => day?.issues ?? [], [day]);

  // 그날 체크리스트 할 일 먼저, 그다음 아직 안 끝난 다른 할 일, 이미 연결된 할 일은 끝났어도 포함
  const options = useMemo<SelectOption<string>[]>(() => {
    const planned = dayTasks(tasks, date).filter((t) => t.title.trim());
    const plannedIds = new Set(planned.map((t) => t.id));
    const linked = new Set(issues.map((i) => i.taskId).filter(Boolean));
    const others = tasks
      .filter((t) => !plannedIds.has(t.id) && t.title.trim() && (t.status !== 'done' || linked.has(t.id)))
      .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    return [
      { value: NONE, label: '하루 전체' },
      ...planned.map((t) => ({ value: t.id, label: t.title, hint: '오늘 체크리스트' })),
      ...others.map((t) => ({ value: t.id, label: t.title, hint: '다른 할 일' })),
    ];
  }, [tasks, date, issues]);

  const relatedLabel = (issue: Issue) => options.find((o) => o.value === (issue.taskId ?? NONE))?.label ?? '하루 전체';

  return (
    <IssueList
      issues={issues}
      title="이슈"
      emptyTitle="오늘 생긴 이슈를 적어 두세요"
      emptyHint="막힌 것, 결정한 것, 다음에 할 것 — 할 일에 연결하면 그 할 일 상세에도 같이 보여요."
      testId="day-issues"
      focusRequest={focusRequest}
      highlight={highlight}
      onAdd={() => addIssue(date)}
      onDoc={(id, doc) => updateIssue(id, { doc })}
      onToggle={(id) => updateIssue(id, { resolved: !issues.find((i) => i.id === id)?.resolved })}
      onDelete={(id) => announceDelete('이슈를 삭제했어요', deleteIssue(id))}
      renderMeta={(issue) => (
        <Select
          value={options.some((o) => o.value === issue.taskId) ? (issue.taskId as string) : NONE}
          options={options}
          onChange={(v) => updateIssue(issue.id, { taskId: v === NONE ? null : v })}
          label="관련 할 일"
          variant="ghost"
          testId="issue-related"
          className="!h-6 max-w-[14rem] !px-1.5 !text-[0.72rem] text-text-secondary"
          renderValue={() => (
            <div className="flex min-w-0 items-center gap-1">
              <div className="flex-none text-text-muted">↳</div>
              <div className="truncate">{relatedLabel(issue)}</div>
            </div>
          )}
        />
      )}
    />
  );
}
