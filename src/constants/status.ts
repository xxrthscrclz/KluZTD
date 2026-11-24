import type { BoardStatus, Priority, Status } from '@/types/task';

export type StatusDef = {
  id: Status;
  label: string;
  hint: string;
};

export const STATUS: Record<Status, StatusDef> = {
  todo: { id: 'todo', label: '진행 예정', hint: '할 차례를 기다리는 것' },
  doing: { id: 'doing', label: '진행 중', hint: '지금 손대고 있는 것' },
  waiting: { id: 'waiting', label: '대기', hint: '남에게 넘겼거나 막혀 있는 것' },
  done: { id: 'done', label: '진행 완료', hint: '끝낸 것' },
};

/** 상태 관리 칸 순서 — 여기만 바꾸면 칸 순서가 바뀐다 */
export const BOARD_COLUMNS: BoardStatus[] = ['todo', 'doing', 'done', 'waiting'];

export const STATUS_ORDER: Status[] = BOARD_COLUMNS;

export const PRIORITY: Record<Priority, { id: Priority; label: string; short: string; rank: number }> = {
  high: { id: 'high', label: '높음', short: '높', rank: 0 },
  normal: { id: 'normal', label: '보통', short: '중', rank: 1 },
  low: { id: 'low', label: '낮음', short: '낮', rank: 2 },
};

export const PRIORITY_ORDER: Priority[] = ['high', 'normal', 'low'];
