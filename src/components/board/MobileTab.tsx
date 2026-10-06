import { useDroppable } from '@dnd-kit/core';

import { StatusDot } from '@/components/ui/Badges';
import { statusTone } from '@/components/ui/tone';
import { STATUS } from '@/constants/status';
import type { BoardStatus } from '@/types/task';

import { tabDropId } from './dnd';

type Props = { status: BoardStatus; count: number; active: boolean; onSelect: () => void; dragging: boolean };

/** 모바일: 칸 전환 탭. 카드를 끌어다 탭 위에 놓으면 그 상태로 옮겨진다 */
export default function MobileTab({ status, count, active, onSelect, dragging }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: tabDropId(status), data: { type: 'tab', status } });
  const tone = statusTone[status];
  return (
    <button
      ref={setNodeRef}
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onSelect}
      data-testid={`tab-${status}`}
      className={`flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-1 text-[0.78rem] font-semibold transition-all ${
        isOver
          ? `${tone.soft} ${tone.text} scale-105 ring-2 ${tone.ring}`
          : active
            ? 'bg-bg-surface text-text-primary shadow-card'
            : dragging
              ? 'bg-bg-surface/60 text-text-secondary ring-1 ring-border-strong ring-dashed'
              : 'text-text-muted'
      }`}
    >
      <StatusDot status={status} />
      <div className="truncate">{STATUS[status].label}</div>
      <div className="text-text-muted tabular-nums">{count}</div>
    </button>
  );
}
