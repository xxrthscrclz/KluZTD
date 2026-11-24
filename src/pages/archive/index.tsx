import { Archive, ArrowLeft, CheckCircle2, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import PageHeader from '@/components/layout/PageHeader';
import { ProjectChip } from '@/components/ui/Badges';
import EmptyState from '@/components/ui/EmptyState';
import IconButton from '@/components/ui/IconButton';
import SearchInput from '@/components/ui/SearchInput';
import { useTaskParam } from '@/hooks/useTaskParam';
import { useTaskStore } from '@/stores/taskStore';
import type { Task } from '@/types/task';
import { ARCHIVE_AFTER_DAYS, archivedTasks, doneAt } from '@/utils/archive';
import { formatDateTime } from '@/utils/date';
import { issueIndex } from '@/utils/issues';
import { EMPTY_FILTER, matchesFilter } from '@/utils/task';

/** 완료 시각 기준 'YYYY년 M월' 묶음 */
function groupByMonth(tasks: Task[]) {
  const groups: { key: string; label: string; tasks: Task[] }[] = [];
  for (const t of tasks) {
    const d = new Date(doneAt(t));
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: `${d.getFullYear()}년 ${d.getMonth() + 1}월`, tasks: [] };
      groups.push(g);
    }
    g.tasks.push(t);
  }
  return groups;
}

export default function ArchivePage() {
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const days = useTaskStore((s) => s.days);
  const moveTask = useTaskStore((s) => s.moveTask);
  const { open } = useTaskParam();
  const [query, setQuery] = useState('');

  const issues = useMemo(() => issueIndex(days), [days]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const all = useMemo(() => archivedTasks(tasks), [tasks]);
  const shown = useMemo(
    () => all.filter((t) => matchesFilter(t, { ...EMPTY_FILTER, query }, new Date(), issues.get(t.id)?.text)),
    [all, query, issues],
  );
  const groups = useMemo(() => groupByMonth(shown), [shown]);

  return (
    <div className="flex w-full max-w-4xl flex-1 flex-col gap-4 px-4 pt-3 pb-10 sm:px-6 sm:pt-7 lg:px-8">
      <PageHeader
        title="아카이브"
        description={`진행 완료한 지 ${ARCHIVE_AFTER_DAYS}일이 지난 할 일은 상태 관리에서 빠져 여기에 모여요.`}
        actions={
          <Link
            to="/status"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <ArrowLeft className="size-4" />
            상태 관리
          </Link>
        }
      />

      {all.length ? (
        <div className="flex items-center gap-3">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="제목·메모·이슈 검색"
            label="아카이브 검색"
            testId="archive-search"
            size="md"
            className="max-w-sm flex-1"
          />
          <div className="text-[0.82rem] font-semibold text-text-muted tabular-nums">
            {query.trim() ? `${shown.length}/${all.length}개` : `${all.length}개`}
          </div>
        </div>
      ) : null}

      {!all.length ? (
        <EmptyState
          icon={<Archive className="size-5" />}
          title="아카이브가 비어 있어요"
          description={`진행 완료한 지 ${ARCHIVE_AFTER_DAYS}일이 지나면 자동으로 여기로 옮겨져요.`}
        />
      ) : !shown.length ? (
        <EmptyState compact title="검색 결과 없음" />
      ) : (
        <div className="flex flex-col gap-6" data-testid="archive-list">
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 px-1">
                <div className="text-[0.84rem] font-bold">{g.label}</div>
                <div className="text-[0.8rem] font-semibold text-text-muted tabular-nums">{g.tasks.length}</div>
              </div>
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border-default bg-bg-surface">
                {g.tasks.map((t) => {
                  const project = t.projectId ? projectById.get(t.projectId) : undefined;
                  return (
                    <div
                      key={t.id}
                      data-testid="archive-row"
                      className="group flex items-center gap-2 border-b border-border-default pr-2 last:border-b-0 hover:bg-bg-hover"
                    >
                      <button
                        type="button"
                        onClick={() => open(t.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 py-2.5 pl-3.5 text-left"
                      >
                        <CheckCircle2 className="size-4 flex-none text-status-done" />
                        <div className="min-w-0 flex-1 truncate text-sm text-text-secondary">{t.title}</div>
                        {project ? <ProjectChip name={project.name} color={project.color} /> : null}
                        <div className="hidden flex-none text-xs text-text-muted tabular-nums sm:block">{formatDateTime(doneAt(t))}</div>
                      </button>
                      <IconButton
                        label={`«${t.title}» 다시 진행 예정으로`}
                        size="sm"
                        className="opacity-60 group-hover:opacity-100"
                        onClick={() => moveTask(t.id, 'todo')}
                      >
                        <RotateCcw className="size-3.5" />
                      </IconButton>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
