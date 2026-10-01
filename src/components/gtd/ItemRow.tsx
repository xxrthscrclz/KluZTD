import { useState } from 'react';

import ItemDetail from '@/components/gtd/ItemDetail';
import { MOVABLE_LISTS } from '@/constants/lists';
import { useGtdStore } from '@/stores/gtdStore';
import type { Item } from '@/types/gtd';
import { daysFromToday, dueLabel } from '@/utils/date';
import { isPinnedToday, type FocusReason } from '@/utils/priority';

type Props = {
  item: Item;
  /** «지금 할 일»에서 보여 줄 순번 */
  rank?: number;
  /** «지금 할 일»에서 이 순서인 이유 — 있으면 날짜 라벨 대신 보여 준다 */
  reasons?: FocusReason[];
};

export const REASON_TONE_CLASS: Record<FocusReason['tone'], string> = {
  danger: 'bg-danger/10 text-danger',
  warn: 'bg-bg-warn-soft text-warn',
  accent: 'bg-bg-accent-soft text-accent-ink',
  muted: 'bg-bg-muted text-text-muted',
};

export default function ItemRow({ item, rank, reasons }: Props) {
  const toggleDone = useGtdStore((s) => s.toggleDone);
  const togglePinToday = useGtdStore((s) => s.togglePinToday);
  const toggleHighPriority = useGtdStore((s) => s.toggleHighPriority);
  const moveItem = useGtdStore((s) => s.moveItem);
  const deleteItem = useGtdStore((s) => s.deleteItem);
  const projects = useGtdStore((s) => s.projects);
  const [open, setOpen] = useState(false);

  const project = projects.find((p) => p.id === item.projectId) ?? null;
  const overdue = !item.done && item.due ? (daysFromToday(item.due) ?? 1) <= 0 : false;
  const pinned = isPinnedToday(item);
  const high = item.priority === 'high';

  return (
    <div
      className={`motion-pop rounded-2xl border bg-bg-surface/70 px-3.5 py-3 ${
        open
          ? 'border-accent/30 shadow-[0_8px_22px_rgba(29,111,232,0.12)]'
          : 'border-border-default hover:border-accent/25 hover:shadow-[0_8px_22px_rgba(29,111,232,0.1)]'
      }`}
    >
      <div className="flex items-start gap-3">
        {rank !== undefined ? (
          <div className="mt-0.5 w-5 shrink-0 text-right text-xs font-extrabold tabular-nums text-text-muted">
            {rank}
          </div>
        ) : null}
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

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <div
            className={`text-sm font-bold ${
              item.done ? 'text-text-muted line-through' : 'text-text-primary'
            }`}
          >
            {item.title || '(제목 없음)'}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-text-secondary">
            {reasons?.map((r) => (
              <div
                key={r.label}
                className={`rounded-full px-2 py-0.5 font-bold ${REASON_TONE_CLASS[r.tone]}`}
              >
                {r.label}
              </div>
            ))}
            {project ? (
              <div className="rounded-full bg-bg-accent-soft px-2 py-0.5 font-bold text-accent-ink">
                {project.name}
              </div>
            ) : null}
            {item.context ? <div className="text-text-muted">{item.context}</div> : null}
            {item.waitingFor && !reasons ? (
              <div className="text-warn">→ {item.waitingFor}</div>
            ) : null}
            {item.due && !reasons ? (
              <div className={overdue ? 'font-bold text-danger' : 'text-text-muted'}>
                {dueLabel(item.due)}
              </div>
            ) : null}
            {!open && item.note ? <div className="text-text-muted">메모</div> : null}
          </div>
          {!open && item.note ? (
            <div className="mt-1.5 line-clamp-2 text-[0.78rem] leading-relaxed font-medium text-text-secondary">
              {item.note}
            </div>
          ) : null}
        </button>

        {!item.done ? (
          <>
            <button
              type="button"
              onClick={() => toggleHighPriority(item.id)}
              aria-label={high ? '중요 해제' : '중요 표시'}
              aria-pressed={high}
              title={high ? '중요 해제' : '중요 표시'}
              className={`motion-pop shrink-0 rounded-xl px-1.5 py-1 text-sm leading-none font-bold ${
                high ? 'text-warn' : 'text-text-muted/60 hover:text-warn'
              }`}
            >
              {high ? '★' : '☆'}
            </button>
            <button
              type="button"
              onClick={() => togglePinToday(item.id)}
              aria-pressed={pinned}
              title={pinned ? '오늘 하기 해제' : '오늘 하기로 찍기 — «지금 할 일» 위로 올라간다'}
              className={`motion-pop shrink-0 rounded-xl border px-2 py-1 text-xs font-bold ${
                pinned
                  ? 'border-accent/35 bg-bg-accent-soft text-accent-ink'
                  : 'border-transparent text-text-muted hover:text-accent-ink'
              }`}
            >
              오늘
            </button>
          </>
        ) : null}

        <select
          value={item.list}
          onChange={(e) => moveItem(item.id, e.target.value as Item['list'])}
          className="shrink-0 rounded-xl border border-border-default bg-bg-surface px-2 py-1 text-xs font-bold text-text-secondary outline-none"
        >
          {MOVABLE_LISTS.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? '정리 닫기' : '정리'}
          className={`motion-pop shrink-0 rounded-xl px-2 py-1 text-xs font-bold ${
            open ? 'text-accent-ink' : 'text-text-muted hover:text-accent-ink'
          }`}
        >
          {open ? '닫기' : '정리'}
        </button>

        <button
          type="button"
          onClick={() => deleteItem(item.id)}
          aria-label="삭제"
          className="motion-pop shrink-0 rounded-xl px-2 py-1 text-xs font-bold text-text-muted hover:text-danger"
        >
          삭제
        </button>
      </div>

      {open ? <ItemDetail item={item} /> : null}
    </div>
  );
}
