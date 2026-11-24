import type { Task } from '@/types/task';

/** 완료하고 이만큼 지나면 상태 관리에서 빠지고 아카이브로 간다 */
export const ARCHIVE_AFTER_DAYS = 7;

const DAY = 24 * 60 * 60 * 1000;

/** 완료 시각 — 예전 데이터처럼 completedAt 이 없으면 마지막 수정 시각으로 본다 */
export function doneAt(task: Task): string {
  return task.completedAt ?? task.updatedAt;
}

/** 진행 완료이고 완료한 지 일주일이 지났으면 아카이브 */
export function isArchived(task: Task, now = new Date()): boolean {
  if (task.status !== 'done') return false;
  return now.getTime() - new Date(doneAt(task)).getTime() >= ARCHIVE_AFTER_DAYS * DAY;
}

/** 아카이브된 할 일 — 최근에 끝낸 것부터 */
export function archivedTasks(tasks: Task[], now = new Date()): Task[] {
  return tasks.filter((t) => isArchived(t, now)).sort((a, b) => doneAt(b).localeCompare(doneAt(a)));
}
