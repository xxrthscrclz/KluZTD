import type { AppData, Issue } from '@/types/task';
import { docToText } from '@/utils/doc';

export type DatedIssue = Issue & { date: string };

/** 모든 이슈 (날짜 붙여서) */
export function allIssues(days: AppData['days']): DatedIssue[] {
  return Object.entries(days).flatMap(([date, d]) => d.issues.map((i) => ({ ...i, date })));
}

/** 이 할 일에 연결된 이슈 — 어느 날짜에 적었든 */
export function issuesOfTask(days: AppData['days'], taskId: string): DatedIssue[] {
  return allIssues(days).filter((i) => i.taskId === taskId);
}

export type IssueStat = { open: number; total: number; text: string };

/** 할 일 id → 이슈 수·검색용 글 (보드·체크리스트가 한 번만 계산해서 쓴다) */
export function issueIndex(days: AppData['days']): Map<string, IssueStat> {
  const map = new Map<string, IssueStat>();
  for (const d of Object.values(days)) {
    for (const i of d.issues) {
      if (!i.taskId) continue;
      const s = map.get(i.taskId) ?? { open: 0, total: 0, text: '' };
      s.total++;
      if (!i.resolved) s.open++;
      s.text += `\n${docToText(i.doc)}`;
      map.set(i.taskId, s);
    }
  }
  return map;
}

export const openIssueMap = (index: Map<string, IssueStat>) => new Map([...index].map(([id, s]) => [id, s.open]));
