import { FolderPlus } from 'lucide-react';
import { useState } from 'react';

import { PROJECT_DOTS } from '@/components/ui/Badges';
import type { ProjectSummary } from '@/utils/project';

type Props = {
  summaries: ProjectSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => void;
};

/** 프로젝트 목록 — 남은 일·완료·지연이 한눈에 */
export default function ProjectList({ summaries, selectedId, onSelect, onCreate }: Props) {
  const [name, setName] = useState('');
  const create = () => {
    if (!name.trim()) return;
    onCreate(name.trim());
    setName('');
  };

  return (
    <div className="flex flex-col gap-2" data-testid="project-list">
      <div className="flex items-center gap-2 rounded-xl border border-border-default bg-bg-surface px-3 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/20">
        <FolderPlus className="size-4 flex-none text-text-muted" />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) create();
          }}
          placeholder="새 프로젝트 — Enter"
          aria-label="새 프로젝트"
          data-testid="project-add"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </div>

      {summaries.map((s) => {
        const total = s.tasks.length;
        const done = s.done.length;
        const active = s.project.id === selectedId;
        return (
          <button
            key={s.project.id}
            type="button"
            onClick={() => onSelect(s.project.id)}
            aria-current={active}
            data-testid="project-item"
            className={`anim-rise flex flex-col gap-2 rounded-xl px-3.5 py-3 text-left ${
              active ? 'bg-bg-surface shadow-card ring-2 ring-accent/40' : 'bg-bg-surface/60 hover:bg-bg-surface hover:shadow-card'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`size-2.5 flex-none rounded-full ${PROJECT_DOTS[s.project.color]}`} />
              <div className="min-w-0 flex-1 truncate text-sm font-semibold">{s.project.name}</div>
              {s.overdue ? (
                <div className="rounded-md bg-danger-soft px-1.5 text-[0.7rem] font-bold text-danger tabular-nums">지연 {s.overdue}</div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
                <div className="h-full rounded-full bg-status-done transition-[width]" style={{ width: total ? `${(done / total) * 100}%` : '0%' }} />
              </div>
              <div className="text-[0.7rem] font-semibold text-text-muted tabular-nums">
                남은 {s.nextActions.length} · 완료 {done}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
