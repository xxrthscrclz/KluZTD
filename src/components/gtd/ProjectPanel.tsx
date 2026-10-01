import { useMemo } from 'react';

import ItemRow from '@/components/gtd/ItemRow';
import QuickCapture from '@/components/gtd/QuickCapture';
import Button from '@/components/ui/Button';
import { useGtdStore } from '@/stores/gtdStore';
import type { ProjectStatus } from '@/types/gtd';
import { itemsInProject } from '@/utils/item';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: '진행 중',
  paused: '멈춤',
  done: '완료',
};

const fieldLabel = 'text-[0.68rem] font-extrabold tracking-[0.08em] text-text-muted uppercase';
const inputClass =
  'w-full rounded-xl border border-border-default bg-bg-surface px-3 py-2 text-sm font-medium text-text-primary outline-none placeholder:text-text-muted focus:border-accent/50';

/** 프로젝트 한 건 — 원하는 결과와 그에 묶인 항목들 */
export default function ProjectPanel({ projectId }: { projectId: string }) {
  const projects = useGtdStore((s) => s.projects);
  const allItems = useGtdStore((s) => s.items);
  const updateProject = useGtdStore((s) => s.updateProject);
  const deleteProject = useGtdStore((s) => s.deleteProject);

  const project = projects.find((p) => p.id === projectId) ?? null;
  const items = useMemo(() => itemsInProject(allItems, projectId), [allItems, projectId]);
  const openCount = items.filter((i) => !i.done).length;

  if (!project) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-sm font-medium text-text-muted">
        프로젝트를 찾을 수 없습니다
      </div>
    );
  }

  const remove = () => {
    if (!confirm(`«${project.name}» 프로젝트를 삭제할까요?\n묶여 있던 항목은 단독 행동으로 남습니다.`))
      return;
    deleteProject(project.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3.5 rounded-2xl border border-border-default bg-bg-surface/70 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 flex-col gap-1.5">
            <div className={fieldLabel}>프로젝트</div>
            <input
              value={project.name}
              onChange={(e) => updateProject(project.id, { name: e.target.value })}
              placeholder="프로젝트 이름"
              className="mt-1.5 w-full rounded-xl border border-transparent bg-transparent px-0 font-display text-2xl font-extrabold text-text-primary outline-none focus:border-border-default focus:px-3 focus:py-1"
            />
          </div>
          <Button variant="danger" size="sm" onClick={remove}>
            삭제
          </Button>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className={fieldLabel}>원하는 결과</div>
          <input
            value={project.outcome}
            onChange={(e) => updateProject(project.id, { outcome: e.target.value })}
            placeholder="무엇이 어떻게 되면 이 프로젝트는 끝나는가"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className={fieldLabel}>메모</div>
          <textarea
            value={project.note}
            onChange={(e) => updateProject(project.id, { note: e.target.value })}
            rows={2}
            placeholder="배경, 참고할 것"
            className={`${inputClass} resize-y leading-relaxed`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className={`${fieldLabel} mr-1.5`}>상태</div>
          {(Object.keys(STATUS_LABEL) as ProjectStatus[]).map((status) => {
            const on = project.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => updateProject(project.id, { status })}
                className={`motion-pop rounded-full border px-2.5 py-1 text-xs font-bold ${
                  on
                    ? 'border-accent/35 bg-bg-accent-soft text-accent-ink'
                    : 'border-border-default text-text-secondary hover:border-accent/30 hover:text-accent-ink'
                }`}
              >
                {STATUS_LABEL[status]}
              </button>
            );
          })}
        </div>
      </div>

      <QuickCapture
        projectId={project.id}
        list="next"
        placeholder="이 프로젝트의 다음 행동 — Enter로 추가"
        label="추가"
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="font-display text-lg font-extrabold text-text-primary">묶인 항목</div>
          <div className="text-sm font-extrabold tabular-nums text-text-muted">
            남은 {openCount}개 / 전체 {items.length}개
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-sm font-medium text-text-muted">
            아직 묶인 항목이 없습니다 — 위에서 다음 행동을 하나 적어 보세요
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
