import { ArrowLeft, CheckCircle2, CircleAlert, Play, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DelegateChip, DueChip, PROJECT_DOTS, StatusBadge } from '@/components/ui/Badges';
import IconButton from '@/components/ui/IconButton';
import { useDraftText } from '@/hooks/useDraftText';
import { useTaskParam } from '@/hooks/useTaskParam';
import { announceDelete } from '@/lib/feedback';
import { useTaskStore } from '@/stores/taskStore';
import { dayHeading, formatDate, formatTime, todayIsoKey } from '@/utils/date';
import { groupByDay, type ProjectSummary, type TimelineEntry } from '@/utils/project';

function Check({ done, onClick, label }: { done: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onClick}
      className={`grid size-[1.15rem] flex-none place-items-center rounded-[5px] border-[1.5px] ${
        done ? 'border-accent bg-accent text-white' : 'border-border-strong bg-bg-surface hover:border-accent'
      }`}
    >
      {done ? (
        <svg viewBox="0 0 12 12" className="anim-check size-3" aria-hidden>
          <path d="M2.5 6.2 5 8.6 9.5 3.8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
    </button>
  );
}

const KIND = {
  done: { icon: <CheckCircle2 className="size-3.5 text-status-done" />, label: '완료' },
  started: { icon: <Play className="size-3.5 text-status-doing" />, label: '시작' },
  issue: { icon: <CircleAlert className="size-3.5 text-danger" />, label: '이슈' },
} as const;

function TimelineRow({ entry, onOpen }: { entry: TimelineEntry; onOpen: (id: string) => void }) {
  const k = KIND[entry.kind];
  return (
    <button
      type="button"
      onClick={() => onOpen(entry.task.id)}
      data-testid="project-timeline-entry"
      className="relative flex min-h-9 items-start gap-2.5 rounded-lg px-2 py-1.5 text-left hover:bg-bg-hover"
    >
      <div className="mt-0.5 flex-none">{entry.kind === 'issue' && entry.issue?.resolved ? <CheckCircle2 className="size-3.5 text-status-done" /> : k.icon}</div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1.5 text-sm">
          <div className="flex-none text-xs text-text-muted tabular-nums">{formatTime(entry.at)}</div>
          <div className="flex-none text-xs font-semibold text-text-muted">{k.label}</div>
          <div className="min-w-0 truncate font-medium">{entry.task.title}</div>
        </div>
        {entry.text ? <div className="truncate text-xs text-text-secondary">{entry.text}</div> : null}
      </div>
    </button>
  );
}

/** 프로젝트 하나 — 남은 Next Action(마감일 순)과 지금까지 한 일 */
export default function ProjectDetail({ summary, onBack }: { summary: ProjectSummary; onBack?: () => void }) {
  const updateProject = useTaskStore((s) => s.updateProject);
  const deleteProject = useTaskStore((s) => s.deleteProject);
  const addTask = useTaskStore((s) => s.addTask);
  const toggleDone = useTaskStore((s) => s.toggleDone);
  const { open } = useTaskParam();
  const { project } = summary;
  const name = useDraftText(project.name, (next) => updateProject(project.id, { name: next }));
  const [draft, setDraft] = useState('');
  const total = summary.tasks.length;
  const today = todayIsoKey();

  const add = () => {
    if (!draft.trim()) return;
    addTask({ title: draft.trim(), status: 'todo', projectId: project.id });
    setDraft('');
  };

  return (
    <div key={project.id} className="@container anim-fade flex min-w-0 flex-col gap-5" data-testid="project-detail">
      <div className="flex items-center gap-2">
        {onBack ? (
          <IconButton label="프로젝트 목록" onClick={onBack}>
            <ArrowLeft className="size-[18px]" />
          </IconButton>
        ) : null}
        <button
          type="button"
          aria-label="색 바꾸기"
          title="색 바꾸기"
          onClick={() => updateProject(project.id, { color: (project.color % 6) + 1 })}
          className="grid size-8 flex-none place-items-center rounded-lg hover:bg-bg-hover"
        >
          <div className={`size-3.5 rounded-full ${PROJECT_DOTS[project.color]}`} />
        </button>
        <input
          value={name.value}
          onChange={(e) => name.onChange(e.target.value)}
          onBlur={name.commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.currentTarget.blur();
          }}
          aria-label="프로젝트 이름"
          data-testid="project-name"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 text-[1.45rem] font-extrabold tracking-[-0.025em] outline-none focus:bg-bg-muted"
        />
        <IconButton
          label="프로젝트 삭제"
          onClick={() => announceDelete(`«${project.name}» 프로젝트를 지웠어요 (할 일은 남아요)`, deleteProject(project.id))}
          className="hover:!text-danger"
        >
          <Trash2 className="size-4" />
        </IconButton>
      </div>

      <div className="grid grid-cols-2 gap-2 @lg:grid-cols-4">
        {[
          { label: '남은 할 일', value: summary.nextActions.length, tone: '' },
          { label: '완료', value: summary.done.length, tone: 'text-status-done' },
          { label: '마감 지남', value: summary.overdue, tone: summary.overdue ? 'text-danger' : '' },
          { label: '미해결 이슈', value: summary.openIssues, tone: summary.openIssues ? 'text-danger' : '' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col rounded-xl bg-bg-surface px-3.5 py-2.5 shadow-card">
            <div className={`text-xl font-extrabold tabular-nums ${s.tone}`}>{s.value}</div>
            <div className="text-xs text-text-muted">{s.label}</div>
          </div>
        ))}
      </div>
      {total ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-muted">
          <div className="h-full rounded-full bg-status-done transition-[width]" style={{ width: `${(summary.done.length / total) * 100}%` }} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-2xl bg-bg-surface p-4 shadow-card" data-testid="project-next">
        <div className="flex items-center gap-2">
          <div className="text-base font-bold">Next Action</div>
          <div className="text-xs text-text-muted">마감일 가까운 순</div>
        </div>
        {summary.nextActions.map((t) => {
          const overdue = t.due ? t.due < today : false;
          return (
            <div key={t.id} data-testid="project-next-item" className="anim-rise flex min-h-10 items-center gap-2.5 rounded-lg px-1 hover:bg-bg-hover">
              <Check done={false} label={`«${t.title}» 완료`} onClick={() => toggleDone(t.id)} />
              <button type="button" onClick={() => open(t.id)} className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1 py-1.5 text-left">
                <div className={`min-w-0 flex-1 truncate text-sm ${overdue ? 'font-semibold text-danger' : ''}`}>{t.title}</div>
                {t.delegate ? <DelegateChip name={t.delegate} /> : null}
                {t.plannedOn ? (
                  <div className="text-[0.7rem] text-text-muted">{t.plannedOn === today ? '오늘 체크리스트' : `${formatDate(t.plannedOn)} 체크리스트`}</div>
                ) : null}
                {t.due ? <DueChip due={t.due} /> : <div className="text-[0.7rem] text-text-muted">마감 없음</div>}
                <StatusBadge status={t.status} />
              </button>
            </div>
          );
        })}
        {!summary.nextActions.length ? <div className="px-1 py-2 text-sm text-text-muted">남은 할 일이 없어요</div> : null}
        <div className="flex min-h-10 items-center gap-2 rounded-lg px-1 text-text-muted focus-within:text-text-primary">
          <Plus className="size-[1.15rem] flex-none" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) add();
            }}
            placeholder="이 프로젝트에 할 일 추가 (상태 관리 진행 예정으로)"
            aria-label="프로젝트에 할 일 추가"
            data-testid="project-task-add"
            className="h-9 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3" data-testid="project-timeline">
        <div className="px-1 text-base font-bold">한 일</div>
        {summary.timeline.length ? (
          groupByDay(summary.timeline).map(([day, entries]) => (
            <div key={day} className="flex flex-col gap-1">
              <div className="px-2 text-xs font-bold text-text-muted">{dayHeading(day)}</div>
              <div className="flex flex-col border-l-2 border-border-default pl-2">
                {entries.map((e) => (
                  <TimelineRow key={e.id} entry={e} onOpen={open} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-text-muted">
            아직 기록이 없어요 — 할 일을 시작·완료하거나 이슈를 적으면 여기에 쌓여요
          </div>
        )}
      </div>
    </div>
  );
}
