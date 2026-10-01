import { CONTEXTS } from '@/constants/lists';
import { useGtdStore } from '@/stores/gtdStore';
import type { Item, Priority } from '@/types/gtd';
import { daysFromTodayInput } from '@/utils/date';
import { PRIORITY_LABEL } from '@/utils/priority';

type Props = {
  item: Item;
};

const fieldLabel =
  'text-[0.68rem] font-extrabold tracking-[0.08em] text-text-muted uppercase';
const inputClass =
  'w-full rounded-xl border border-border-default bg-bg-surface px-3 py-2 text-sm font-medium text-text-primary outline-none placeholder:text-text-muted focus:border-accent/50';

/** 정리(clarify) — 수집한 항목에 맥락을 붙이는 편집 패널 */
export default function ItemDetail({ item }: Props) {
  const updateItem = useGtdStore((s) => s.updateItem);
  const projects = useGtdStore((s) => s.projects);

  const patch = (p: Partial<Item>) => updateItem(item.id, p);
  const activeProjects = projects.filter((p) => p.status !== 'done' || p.id === item.projectId);

  return (
    <div className="mt-3 flex flex-col gap-3.5 border-t border-border-default pt-3.5">
      <div className="flex flex-col gap-1.5">
        <div className={fieldLabel}>제목</div>
        <input
          value={item.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="무엇을 하는 일인가"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className={fieldLabel}>메모</div>
        <textarea
          value={item.note}
          onChange={(e) => patch({ note: e.target.value })}
          rows={2}
          placeholder="왜 하는지, 어떻게 할지 — 다음에 봤을 때 바로 이해되게"
          className={`${inputClass} resize-y leading-relaxed`}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className={fieldLabel}>중요도</div>
        <div className="flex flex-wrap gap-1.5">
          {(['high', 'normal', 'low'] as Priority[]).map((priority) => {
            const on = item.priority === priority;
            return (
              <button
                key={priority}
                type="button"
                onClick={() => patch({ priority })}
                className={`motion-pop rounded-full border px-2.5 py-1 text-xs font-bold ${
                  on
                    ? 'border-accent/35 bg-bg-accent-soft text-accent-ink'
                    : 'border-border-default text-text-secondary hover:border-accent/30 hover:text-accent-ink'
                }`}
              >
                {PRIORITY_LABEL[priority]}
              </button>
            );
          })}
        </div>
        <div className="text-[0.7rem] font-medium text-text-muted">
          «지금 할 일»은 마감 → 오늘 하기 → 중요 → 마감 임박 순으로 줄 세웁니다.
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className={fieldLabel}>실행 상황</div>
        <div className="flex flex-wrap gap-1.5">
          {CONTEXTS.map((ctx) => {
            const on = item.context === ctx;
            return (
              <button
                key={ctx}
                type="button"
                onClick={() => patch({ context: on ? '' : ctx })}
                className={`motion-pop rounded-full border px-2.5 py-1 text-xs font-bold ${
                  on
                    ? 'border-accent/35 bg-bg-accent-soft text-accent-ink'
                    : 'border-border-default text-text-secondary hover:border-accent/30 hover:text-accent-ink'
                }`}
              >
                {ctx}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <div className={fieldLabel}>날짜</div>
          <input
            type="date"
            value={item.due}
            onChange={(e) => patch({ due: e.target.value })}
            className={inputClass}
          />
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: '오늘', days: 0 },
              { label: '내일', days: 1 },
              { label: '다음 주', days: 7 },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => patch({ due: daysFromTodayInput(q.days) })}
                className="motion-pop rounded-full border border-border-default px-2.5 py-1 text-xs font-bold text-text-secondary hover:border-accent/30 hover:text-accent-ink"
              >
                {q.label}
              </button>
            ))}
            {item.due ? (
              <button
                type="button"
                onClick={() => patch({ due: '' })}
                className="motion-pop rounded-full px-2.5 py-1 text-xs font-bold text-text-muted hover:text-danger"
              >
                지우기
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className={fieldLabel}>대기 대상</div>
          <input
            value={item.waitingFor}
            onChange={(e) => patch({ waitingFor: e.target.value })}
            placeholder="누구의 답을 기다리는가"
            className={inputClass}
          />
          <div className="text-[0.7rem] font-medium text-text-muted">
            남에게 넘긴 일이면 «대기» 리스트로 옮겨 두세요.
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className={fieldLabel}>프로젝트</div>
        <select
          value={item.projectId ?? ''}
          onChange={(e) => patch({ projectId: e.target.value || null })}
          className={inputClass}
        >
          <option value="">단독 행동 (프로젝트 없음)</option>
          {activeProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
