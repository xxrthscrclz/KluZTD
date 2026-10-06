import { ArrowRight } from 'lucide-react';

import { StatusDot } from '@/components/ui/Badges';
import { STATUS } from '@/constants/status';
import type { Task } from '@/types/task';
import { formatDateTime } from '@/utils/date';

/** 상태가 바뀐 이력 (최근 것부터) */
export default function ActivityList({ task }: { task: Task }) {
  const rows = [...task.activity].reverse().slice(0, 30);
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[0.95rem] font-bold">활동</div>
      <div className="flex flex-col gap-1.5 text-xs text-text-muted">
        {rows.map((a, i) => (
          <div key={`${a.at}-${i}`} className="flex items-center gap-1.5">
            <div className="w-32 flex-none tabular-nums">{formatDateTime(a.at)}</div>
            <StatusDot status={a.from} />
            <div>{STATUS[a.from].label}</div>
            <ArrowRight className="size-3" />
            <StatusDot status={a.to} />
            <div className="font-semibold text-text-secondary">{STATUS[a.to].label}</div>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-32 flex-none tabular-nums">{formatDateTime(task.createdAt)}</div>
          <div>만듦</div>
        </div>
      </div>
    </div>
  );
}
