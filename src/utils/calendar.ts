import type { AppData, Issue, Task } from '@/types/task';
import { toDateKey } from '@/utils/date';
import { dayTasks } from '@/utils/task';

/** 달력 한 칸에 보여 줄 그날의 모든 것 */
export type DaySummary = {
  key: string;
  /** 그날 체크리스트에 올린 할 일 */
  planned: Task[];
  /** 그날 마감인데 그날 체크리스트에는 없는 할 일 */
  dueOnly: Task[];
  /** 그날 완료했지만 그날 체크리스트·마감과 상관없는 할 일 — '뭐 했는지' */
  completedElsewhere: Task[];
  issues: Issue[];
};

/** 날짜 키 → 그날 요약. keys 에 든 날짜만 계산한다 */
export function summarizeDays(data: Pick<AppData, 'tasks' | 'days'>, keys: string[]): Map<string, DaySummary> {
  const want = new Set(keys);
  const out = new Map<string, DaySummary>();
  for (const key of keys) {
    out.set(key, { key, planned: dayTasks(data.tasks, key), dueOnly: [], completedElsewhere: [], issues: data.days[key]?.issues ?? [] });
  }
  for (const t of data.tasks) {
    if (t.due && want.has(t.due) && t.plannedOn !== t.due) out.get(t.due)?.dueOnly.push(t);
    if (t.status === 'done' && t.completedAt) {
      const doneKey = toDateKey(new Date(t.completedAt));
      if (doneKey !== t.plannedOn && doneKey !== t.due && want.has(doneKey)) out.get(doneKey)?.completedElsewhere.push(t);
    }
  }
  return out;
}
