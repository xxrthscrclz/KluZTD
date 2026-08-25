import { LISTS } from '@/constants/lists';
import { useGtdStore } from '@/stores/gtdStore';
import type { Item } from '@/types/gtd';
import { formatDateKo } from '@/utils/date';

type Props = {
  item: Item;
};

export default function ItemRow({ item }: Props) {
  const toggleDone = useGtdStore((s) => s.toggleDone);
  const moveItem = useGtdStore((s) => s.moveItem);
  const deleteItem = useGtdStore((s) => s.deleteItem);
  const projects = useGtdStore((s) => s.projects);

  const project = projects.find((p) => p.id === item.projectId) ?? null;

  return (
    <div className="motion-pop flex items-start gap-3 rounded-2xl border border-border-default bg-bg-surface/70 px-3.5 py-3 hover:border-accent/25 hover:shadow-[0_8px_22px_rgba(29,111,232,0.1)]">
      <button
        type="button"
        onClick={() => toggleDone(item.id)}
        aria-label={item.done ? '완료 해제' : '완료'}
        className={`mt-0.5 size-5 shrink-0 rounded-lg border transition ${
          item.done
            ? 'border-accent bg-accent text-text-inverse'
            : 'border-border-strong hover:border-accent'
        }`}
      >
        {item.done ? '✓' : ''}
      </button>

      <div className="min-w-0 flex-1">
        <div
          className={`text-sm font-bold ${
            item.done ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {item.title}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-text-secondary">
          {project ? (
            <div className="rounded-full bg-bg-accent-soft px-2 py-0.5 font-bold text-accent-ink">
              {project.name}
            </div>
          ) : null}
          {item.context ? <div className="text-text-muted">{item.context}</div> : null}
          {item.waitingFor ? <div className="text-warn">→ {item.waitingFor}</div> : null}
          {item.due ? <div className="text-text-muted">{formatDateKo(item.due)}</div> : null}
        </div>
        {item.note ? (
          <div className="mt-1.5 text-[0.78rem] leading-relaxed font-medium text-text-secondary">
            {item.note}
          </div>
        ) : null}
      </div>

      <select
        value={item.list}
        onChange={(e) => moveItem(item.id, e.target.value as Item['list'])}
        className="shrink-0 rounded-xl border border-border-default bg-bg-surface px-2 py-1 text-xs font-bold text-text-secondary outline-none"
      >
        {LISTS.filter((l) => l.id !== 'done').map((l) => (
          <option key={l.id} value={l.id}>
            {l.title}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => deleteItem(item.id)}
        aria-label="삭제"
        className="motion-pop shrink-0 rounded-xl px-2 py-1 text-xs font-bold text-text-muted hover:text-danger"
      >
        삭제
      </button>
    </div>
  );
}
