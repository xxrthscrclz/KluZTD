import { useMemo } from 'react';

import IssueList from '@/components/task/IssueList';
import { announceDelete } from '@/lib/feedback';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types/task';
import { formatDate, todayIsoKey } from '@/utils/date';
import { issuesOfTask } from '@/utils/issues';

/**
 * 할 일 상세의 이슈 — 일일 관리에서 이 할 일에 연결해 적은 것까지 모두.
 * 여기서 적으면 오늘 날짜의 이슈로 저장되고 이 할 일에 연결된다.
 */
export default function IssueLog({ task, focusIssueId }: { task: Task; focusIssueId: string | null }) {
  const days = useTaskStore((s) => s.days);
  const addIssue = useTaskStore((s) => s.addIssue);
  const updateIssue = useTaskStore((s) => s.updateIssue);
  const deleteIssue = useTaskStore((s) => s.deleteIssue);
  const issues = useMemo(() => issuesOfTask(days, task.id), [days, task.id]);
  const today = todayIsoKey();

  return (
    <IssueList
      issues={issues}
      highlight={focusIssueId ? { ids: [focusIssueId], token: 1 } : null}
      onAdd={() => addIssue(today, task.id)}
      onDoc={(id, doc) => updateIssue(id, { doc })}
      onToggle={(id) => updateIssue(id, { resolved: !issues.find((i) => i.id === id)?.resolved })}
      onDelete={(id) => announceDelete('이슈를 삭제했어요', deleteIssue(id))}
      renderMeta={(issue) =>
        issue.date !== today ? <div className="text-[0.7rem] text-text-muted">{formatDate(issue.date)} 일일 관리</div> : null
      }
    />
  );
}
