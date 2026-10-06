import { CalendarDays, MessageSquareWarning } from 'lucide-react';

import { STATUS } from '@/constants/status';
import type { Priority, Status } from '@/types/task';
import { dueInfo } from '@/utils/date';

import { dueTone, priorityTone, statusTone } from './tone';

export function StatusDot({ status, className = '' }: { status: Status; className?: string }) {
  const tone = statusTone[status];
  if (status === 'done') {
    return (
      <div className={`grid size-3.5 flex-none place-items-center rounded-full ${tone.dot} ${className}`}>
        <svg viewBox="0 0 12 12" className="size-2.5 text-bg-surface" aria-hidden>
          <path d="M3 6.2 5 8.2 9 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  if (status === 'doing') {
    return (
      <div className={`relative size-3.5 flex-none rounded-full border-[1.5px] border-status-doing ${className}`}>
        <div className="absolute inset-[2px] rounded-full [background:conic-gradient(var(--color-status-doing)_0_50%,transparent_50%)]" />
      </div>
    );
  }
  if (status === 'waiting') {
    return (
      <div className={`grid size-3.5 flex-none place-items-center rounded-full border-[1.5px] border-status-waiting ${className}`}>
        <div className="h-[5px] w-[1.5px] translate-x-[0.5px] -translate-y-[0.5px] rotate-[-35deg] rounded-full bg-status-waiting" />
      </div>
    );
  }
  return (
    <div
      className={`size-3.5 flex-none rounded-full border-[1.5px] ${
        'border-status-todo'
      } ${className}`}
    />
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const tone = statusTone[status];
  return (
    <div className={`inline-flex h-6 flex-none items-center gap-1.5 rounded-md px-2 text-xs font-semibold ${tone.soft} ${tone.text}`}>
      <StatusDot status={status} />
      {STATUS[status].label}
    </div>
  );
}

/** 우선순위 막대 3칸 아이콘 */
export function PriorityIcon({ priority, className = '' }: { priority: Priority | null; className?: string }) {
  const filled = priority === 'high' ? 3 : priority === 'normal' ? 2 : priority === 'low' ? 1 : 0;
  const color = priority ? priorityTone[priority].bg : '';
  return (
    <div className={`flex h-3.5 flex-none items-end gap-[2px] ${className}`} aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-[3px] rounded-[1px] ${i < filled ? color : 'bg-border-strong'}`}
          style={{ height: `${5 + i * 4}px` }}
        />
      ))}
    </div>
  );
}

export function DueChip({ due, done = false, compact = false }: { due: string; done?: boolean; compact?: boolean }) {
  const info = dueInfo(due);
  if (!info) return null;
  const tone = done ? 'bg-bg-muted text-text-muted' : dueTone[info.tone];
  return (
    <div className={`inline-flex h-[22px] flex-none items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-semibold tabular-nums ${tone}`}>
      {!compact ? <CalendarDays className="size-3" strokeWidth={2.2} /> : null}
      {info.label}
    </div>
  );
}

const AVATAR_TONES = [
  'bg-avatar-1 text-avatar-1-ink',
  'bg-avatar-2 text-avatar-2-ink',
  'bg-avatar-3 text-avatar-3-ink',
  'bg-avatar-4 text-avatar-4-ink',
  'bg-avatar-5 text-avatar-5-ink',
  'bg-avatar-6 text-avatar-6-ink',
];

function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** 위임 대상 이니셜 아바타 — 이름마다 색이 고정된다 */
export function Avatar({ name, size = 'sm' }: { name: string; size?: 'xs' | 'sm' | 'md' }) {
  const initial = [...name.trim()][0] ?? '?';
  const sz = size === 'xs' ? 'size-4 text-[0.6rem]' : size === 'sm' ? 'size-5 text-[0.66rem]' : 'size-7 text-xs';
  return (
    <div className={`grid flex-none place-items-center rounded-full font-bold ${sz} ${AVATAR_TONES[hash(name) % AVATAR_TONES.length]}`}>
      {initial.toUpperCase()}
    </div>
  );
}

export function DelegateChip({ name }: { name: string }) {
  return (
    <div className="inline-flex h-[22px] max-w-[9rem] min-w-0 items-center gap-1 rounded-md bg-bg-muted pr-1.5 pl-0.5 text-[0.72rem] font-semibold text-text-secondary">
      <Avatar name={name} size="xs" />
      <div className="truncate">{name}</div>
    </div>
  );
}

export function IssueCount({ open, total }: { open: number; total: number }) {
  if (!total) return null;
  return (
    <div
      className={`inline-flex h-[22px] flex-none items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-semibold tabular-nums ${
        open ? 'bg-danger-soft text-danger' : 'bg-bg-muted text-text-muted'
      }`}
      title={`이슈 ${total}개 중 미해결 ${open}개`}
    >
      <MessageSquareWarning className="size-3" strokeWidth={2.2} />
      {open ? `${open}/${total}` : total}
    </div>
  );
}

/** 프로젝트 색 (1~6 → avatar 토큰) */
export const PROJECT_TONES: Record<number, string> = {
  1: 'bg-avatar-1 text-avatar-1-ink',
  2: 'bg-avatar-2 text-avatar-2-ink',
  3: 'bg-avatar-3 text-avatar-3-ink',
  4: 'bg-avatar-4 text-avatar-4-ink',
  5: 'bg-avatar-5 text-avatar-5-ink',
  6: 'bg-avatar-6 text-avatar-6-ink',
};

export const PROJECT_DOTS: Record<number, string> = {
  1: 'bg-avatar-1-ink',
  2: 'bg-avatar-2-ink',
  3: 'bg-avatar-3-ink',
  4: 'bg-avatar-4-ink',
  5: 'bg-avatar-5-ink',
  6: 'bg-avatar-6-ink',
};

export function ProjectChip({ name, color }: { name: string; color: number }) {
  return (
    <div
      className={`inline-flex h-[22px] max-w-[10rem] min-w-0 items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-semibold ${PROJECT_TONES[color] ?? PROJECT_TONES[1]}`}
      title={`프로젝트: ${name}`}
    >
      <div className={`size-1.5 flex-none rounded-full ${PROJECT_DOTS[color] ?? PROJECT_DOTS[1]}`} />
      <div className="truncate">{name}</div>
    </div>
  );
}
