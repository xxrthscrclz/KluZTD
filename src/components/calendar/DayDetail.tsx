import { ArrowRight, ListChecks, ListPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { DelegateChip, DueChip, ProjectChip, StatusBadge } from '@/components/ui/Badges';
import { useTaskParam } from '@/hooks/useTaskParam';
import { useTaskStore } from '@/stores/taskStore';
import { toast } from '@/stores/toastStore';
import type { Task } from '@/types/task';
import type { DaySummary } from '@/utils/calendar';
import { formatDate, todayIsoKey } from '@/utils/date';
import { docToText } from '@/utils/doc';

function Check({ done, onClick, label }: { done: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={onClick}
      className={`grid size-[1.1rem] flex-none place-items-center rounded-[5px] border-[1.5px] ${
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

function Section({ title, count, children }: { title: string; count?: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-text-muted">
        {title}
        {count !== undefined ? <div className="tabular-nums">{count}</div> : null}
      </div>
      {children}
    </div>
  );
}

/**
 * 고른 날짜의 모든 것 — 여기서 할 일을 추가하면 그날 체크리스트에 올라가고 상태 관리(진행 예정)에도 생긴다.
 */
export default function DayDetail({ summary }: { summary: DaySummary }) {
  const addDayTask = useTaskStore((s) => s.addDayTask);
  const toggleDone = useTaskStore((s) => s.toggleDone);
  const planTask = useTaskStore((s) => s.planTask);
  const projects = useTaskStore((s) => s.projects);
  const { open } = useTaskParam();
  const [title, setTitle] = useState('');
  const key = summary.key;
  const dailyPath = key === todayIsoKey() ? '/daily' : `/daily/${key}`;

  const add = () => {
    const t = title.trim();
    if (!t) return;
    addDayTask(key, t);
    setTitle('');
    toast({ message: `${formatDate(key)} 체크리스트에 추가 — 상태 관리에도 보여요`, tone: 'success' }, 2600);
  };

  const meta = (t: Task) => {
    const project = projects.find((p) => p.id === t.projectId);
    return (
      <>
        {project ? <ProjectChip name={project.name} color={project.color} /> : null}
        {t.delegate ? <DelegateChip name={t.delegate} /> : null}
      </>
    );
  };

  const empty = !summary.planned.length && !summary.dueOnly.length && !summary.completedElsewhere.length && !summary.issues.length;

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-bg-surface p-4 shadow-card" data-testid="cal-detail">
      <div className="flex items-center gap-2">
        <div className="text-lg font-extrabold tracking-[-0.02em]" data-testid="cal-detail-title">
          {formatDate(key)}
        </div>
        <Link
          to={dailyPath}
          className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-text-secondary hover:bg-bg-hover hover:text-text-primary"
        >
          <ListChecks className="size-3.5" />
          일일 관리
          <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border-default bg-bg-raised px-3 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20">
        <Plus className="size-4 flex-none text-text-muted" />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) add();
          }}
          placeholder="이 날 할 일 추가 — Enter"
          aria-label="일정 추가"
          data-testid="cal-add"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </div>

      {empty ? <div className="px-1 py-4 text-center text-sm text-text-muted">이 날은 비어 있어요</div> : null}

      {summary.planned.length ? (
        <Section title="체크리스트" count={summary.planned.length}>
          {summary.planned.map((t) => (
            <div key={t.id} data-testid="cal-detail-task" className="anim-rise flex min-h-9 items-center gap-2 rounded-lg px-1 hover:bg-bg-hover">
              <Check done={t.status === 'done'} label={`«${t.title}» 완료`} onClick={() => toggleDone(t.id)} />
              <button type="button" onClick={() => open(t.id)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left">
                <div className={`min-w-0 flex-1 truncate text-sm ${t.status === 'done' ? 'text-text-muted line-through' : ''}`}>{t.title}</div>
                {meta(t)}
                {t.due ? <DueChip due={t.due} done={t.status === 'done'} /> : null}
                {t.status === 'doing' || t.status === 'waiting' ? <StatusBadge status={t.status} /> : null}
              </button>
            </div>
          ))}
        </Section>
      ) : null}

      {summary.dueOnly.length ? (
        <Section title="이날 마감 · 체크리스트에 없음" count={summary.dueOnly.length}>
          {summary.dueOnly.map((t) => (
            <div key={t.id} data-testid="cal-detail-due" className="anim-rise flex min-h-9 items-center gap-2 rounded-lg px-1 hover:bg-bg-hover">
              <button type="button" onClick={() => open(t.id)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left">
                <div className="min-w-0 flex-1 truncate text-sm">{t.title}</div>
                {meta(t)}
                <StatusBadge status={t.status} />
              </button>
              {t.status !== 'done' ? (
                <button
                  type="button"
                  onClick={() => planTask(t.id, key)}
                  aria-label={`«${t.title}» 이날 체크리스트에 넣기`}
                  className="flex h-7 flex-none items-center gap-1 rounded-lg px-2 text-xs font-semibold text-accent-ink hover:bg-accent-soft"
                >
                  <ListPlus className="size-3.5" />
                  넣기
                </button>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {summary.completedElsewhere.length ? (
        <Section title="이날 완료한 일" count={summary.completedElsewhere.length}>
          {summary.completedElsewhere.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => open(t.id)}
              className="flex min-h-9 items-center gap-2 rounded-lg px-1 text-left text-sm text-text-secondary hover:bg-bg-hover"
            >
              <div className="text-status-done">✓</div>
              <div className="min-w-0 flex-1 truncate">{t.title}</div>
            </button>
          ))}
        </Section>
      ) : null}

      {summary.issues.length ? (
        <Section title="이슈" count={summary.issues.length}>
          {summary.issues.map((is) => (
            <Link key={is.id} to={dailyPath} className="flex min-h-9 items-center gap-2 rounded-lg px-1 text-sm hover:bg-bg-hover">
              <div className={`size-2 flex-none rounded-full ${is.resolved ? 'bg-status-done' : 'bg-danger'}`} />
              <div className="min-w-0 flex-1 truncate text-text-secondary">{docToText(is.doc).split('\n')[0] || '(빈 이슈)'}</div>
            </Link>
          ))}
        </Section>
      ) : null}
    </div>
  );
}
