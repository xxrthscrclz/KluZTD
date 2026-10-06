import type { Priority, Status } from '@/types/task';
import type { DueTone } from '@/utils/date';

/** Tailwind 가 클래스를 찾을 수 있도록 문자열을 통째로 둔다 */
export const statusTone: Record<Status, { dot: string; soft: string; text: string; ring: string }> = {
  todo: { dot: 'bg-status-todo', soft: 'bg-status-todo-soft', text: 'text-status-todo', ring: 'ring-status-todo/40' },
  doing: { dot: 'bg-status-doing', soft: 'bg-status-doing-soft', text: 'text-status-doing', ring: 'ring-status-doing/40' },
  waiting: {
    dot: 'bg-status-waiting',
    soft: 'bg-status-waiting-soft',
    text: 'text-status-waiting',
    ring: 'ring-status-waiting/40',
  },
  done: { dot: 'bg-status-done', soft: 'bg-status-done-soft', text: 'text-status-done', ring: 'ring-status-done/40' },
};

export const priorityTone: Record<Priority, { text: string; bg: string }> = {
  high: { text: 'text-prio-high', bg: 'bg-prio-high' },
  normal: { text: 'text-prio-normal', bg: 'bg-prio-normal' },
  low: { text: 'text-prio-low', bg: 'bg-prio-low' },
};

export const dueTone: Record<DueTone, string> = {
  overdue: 'bg-danger-soft text-danger',
  today: 'bg-warn-soft text-warn',
  soon: 'bg-bg-muted text-text-primary',
  later: 'bg-bg-muted text-text-secondary',
};
