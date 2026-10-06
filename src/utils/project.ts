import type { AppData, Issue, Project, Task } from '@/types/task';
import { daysUntil, toDateKey } from '@/utils/date';
import { docToText } from '@/utils/doc';
import { priorityRank } from '@/utils/task';

export type TimelineEntry = {
  id: string;
  at: string;
  kind: 'done' | 'started' | 'issue';
  task: Task;
  issue?: Issue;
  /** 이슈 첫 줄 */
  text?: string;
};

export type ProjectSummary = {
  project: Project;
  tasks: Task[];
  /** 남은 할 일 — 마감일 가까운 순 (마감 없으면 뒤), 같으면 우선순위 */
  nextActions: Task[];
  done: Task[];
  overdue: number;
  openIssues: number;
  /** 한 일 — 최신이 위 */
  timeline: TimelineEntry[];
};

export function sortNextActions(tasks: Task[]): Task[] {
  return tasks
    .filter((t) => t.status !== 'done')
    .sort(
      (a, b) =>
        (a.due ?? '9999-99-99').localeCompare(b.due ?? '9999-99-99') ||
        priorityRank(a.priority) - priorityRank(b.priority) ||
        a.createdAt.localeCompare(b.createdAt),
    );
}

export function summarizeProject(project: Project, data: Pick<AppData, 'tasks' | 'days'>): ProjectSummary {
  const tasks = data.tasks.filter((t) => t.projectId === project.id);
  const ids = new Set(tasks.map((t) => t.id));
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const timeline: TimelineEntry[] = [];
  let openIssues = 0;

  for (const t of tasks) {
    if (t.status === 'done' && t.completedAt) timeline.push({ id: `done-${t.id}`, at: t.completedAt, kind: 'done', task: t });
    if (t.startedAt) timeline.push({ id: `start-${t.id}`, at: t.startedAt, kind: 'started', task: t });
  }
  // 이 프로젝트 할 일에 연결된 이슈 (일일 관리·상세 어디서 적었든)
  for (const day of Object.values(data.days)) {
    for (const i of day.issues) {
      if (!i.taskId || !ids.has(i.taskId)) continue;
      if (!i.resolved) openIssues++;
      timeline.push({ id: `issue-${i.id}`, at: i.createdAt, kind: 'issue', task: byId.get(i.taskId) as Task, issue: i, text: docToText(i.doc).split('\n')[0] });
    }
  }
  timeline.sort((a, b) => b.at.localeCompare(a.at));

  return {
    project,
    tasks,
    nextActions: sortNextActions(tasks),
    done: tasks.filter((t) => t.status === 'done').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    overdue: tasks.filter((t) => t.status !== 'done' && t.due && (daysUntil(t.due) ?? 1) < 0).length,
    openIssues,
    timeline: timeline.filter((e) => e.kind !== 'issue' || e.text),
  };
}

/** 한 일 타임라인을 날짜별로 */
export function groupByDay(entries: TimelineEntry[]): [string, TimelineEntry[]][] {
  const map = new Map<string, TimelineEntry[]>();
  for (const e of entries) {
    const key = toDateKey(new Date(e.at));
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  return [...map.entries()];
}
