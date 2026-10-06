import { PRIORITY, STATUS_ORDER } from '@/constants/status';
import type { AppData, Doc, Issue, Priority, Project, Status, Task } from '@/types/task';
import { daysUntil, startOfToday, toDateKey } from '@/utils/date';
import { docToText, isDocEmpty } from '@/utils/doc';
import { newId, nowIso } from '@/utils/id';

const STATUSES = new Set<string>(STATUS_ORDER);
const PRIORITIES = new Set<Priority>(['high', 'normal', 'low']);
const EPOCH = new Date(0).toISOString();
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** 예전 'inbox'(분류 대기)는 '진행 예정'으로 */
function normalizeStatus(raw: unknown): Status {
  if (typeof raw === 'string' && STATUSES.has(raw)) return raw as Status;
  return 'todo';
}

const dateOrNull = (v: unknown) => (typeof v === 'string' && DATE_KEY.test(v) ? v : null);
const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/** 예전 소프트 삭제(deletedAt) 흔적은 읽을 때 버린다 */
const alive = (x: unknown) => !(x as { deletedAt?: string | null })?.deletedAt;

/** 파일에서 읽은 값이 무엇이든 Task 모양으로 맞춘다 */
export function normalizeTask(raw: Partial<Task>): Task {
  const now = nowIso();
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    title: typeof raw.title === 'string' ? raw.title : '',
    status: normalizeStatus(raw.status),
    priority: raw.priority && PRIORITIES.has(raw.priority) ? raw.priority : null,
    order: num(raw.order),
    plannedOn: dateOrNull(raw.plannedOn),
    dayOrder: num(raw.dayOrder),
    due: dateOrNull(raw.due),
    delegate: typeof raw.delegate === 'string' && raw.delegate.trim() ? raw.delegate.trim() : null,
    projectId: typeof raw.projectId === 'string' && raw.projectId ? raw.projectId : null,
    note: raw.note ?? null,
    activity: Array.isArray(raw.activity) ? raw.activity.filter((a) => STATUSES.has(a.from) && STATUSES.has(a.to)) : [],
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
    startedAt: raw.startedAt ?? null,
    completedAt: raw.completedAt ?? null,
  };
}

type RawIssue = Partial<Issue> & { itemId?: string | null };

export function normalizeIssue(raw: RawIssue): Issue {
  const now = nowIso();
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    doc: raw.doc ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    resolved: Boolean(raw.resolved),
    // 예전 itemId(체크리스트 줄) → 줄이 할 일이 되면서 같은 id 를 쓰므로 그대로 taskId
    taskId: raw.taskId ?? raw.itemId ?? null,
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

export function normalizeProject(raw: Partial<Project>): Project {
  const now = nowIso();
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : '이름 없는 프로젝트',
    color: Math.min(6, Math.max(1, Math.round(num(raw.color, 1)))),
    createdAt: raw.createdAt ?? now,
    updatedAt: raw.updatedAt ?? now,
  };
}

/** 예전 체크리스트 줄 (v2.1) */
type RawItem = {
  id?: string;
  text?: string;
  done?: boolean;
  order?: number;
  movedTo?: string | null;
  taskId?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

type RawDay = {
  items?: RawItem[];
  issues?: RawIssue[];
  /** 잠깐 있었던 '그날 메모' — 이슈 하나로 옮긴다 */
  note?: Doc | null;
  noteUpdatedAt?: string;
};

type RawTask = Partial<Task> & { issues?: RawIssue[] };

type RawData = Partial<Omit<AppData, 'days' | 'tasks'>> & {
  tasks?: RawTask[];
  days?: Record<string, RawDay>;
  /** v2.0 의 수집 메모 — 자유공간으로 옮긴다 */
  dump?: AppData['scratch'];
  dumpUpdatedAt?: string;
};

export function normalizeData(raw: RawData | null | undefined): AppData {
  const rawTasks = Array.isArray(raw?.tasks) ? raw.tasks.filter(alive) : [];
  const tasks = rawTasks.map(normalizeTask);
  const taskById = new Map(tasks.map((t) => [t.id, t]));
  const dead = raw?.tombstones && typeof raw.tombstones === 'object' ? { ...raw.tombstones } : {};

  const days: AppData['days'] = {};
  const pushIssue = (key: string, issue: Issue) => {
    const day = (days[key] ??= { issues: [] });
    if (!day.issues.some((i) => i.id === issue.id)) day.issues.push(issue);
  };

  // 예전엔 할 일 안에 따로 있던 이슈 → 적은 날짜의 이슈로 옮기고 그 할 일에 연결
  for (const t of rawTasks) {
    for (const ri of t.issues ?? []) {
      if (!alive(ri) || !t.id) continue;
      const issue = normalizeIssue({ ...ri, taskId: t.id });
      pushIssue(toDateKey(new Date(issue.createdAt)), issue);
    }
  }
  if (raw?.days && typeof raw.days === 'object') {
    for (const [key, rawDay] of Object.entries(raw.days)) {
      if (!DATE_KEY.test(key)) continue;

      // 예전 체크리스트 줄 → 할 일 (같은 id). 다른 날로 옮긴 원본은 옮겨 간 쪽이 있으니 버린다
      for (const item of rawDay?.items ?? []) {
        if (!alive(item) || item.movedTo || !item.text?.trim()) continue;
        if (item.taskId) {
          const linked = taskById.get(item.taskId);
          if (linked && !linked.due) linked.due = key;
          continue;
        }
        const id = item.id ?? newId();
        if (taskById.has(id) || dead[id]) continue;
        const at = item.createdAt ?? nowIso();
        const task = normalizeTask({
          id,
          title: item.text.trim(),
          status: item.done ? 'done' : 'todo',
          plannedOn: key,
          dayOrder: num(item.order),
          order: num(item.order),
          createdAt: at,
          updatedAt: item.updatedAt ?? at,
          completedAt: item.done ? (item.updatedAt ?? at) : null,
        });
        tasks.push(task);
        taskById.set(id, task);
      }

      for (const ri of rawDay?.issues ?? []) if (alive(ri)) pushIssue(key, normalizeIssue(ri));
      if (rawDay?.note && !isDocEmpty(rawDay.note)) {
        const at = rawDay.noteUpdatedAt && rawDay.noteUpdatedAt !== EPOCH ? rawDay.noteUpdatedAt : nowIso();
        pushIssue(key, { id: 'legacy-note', doc: rawDay.note, resolved: false, createdAt: at, updatedAt: at, taskId: null });
      }
    }
  }

  const legacyDump = !raw?.scratch && raw?.dump ? raw.dump : null;
  return {
    tasks,
    projects: Array.isArray(raw?.projects) ? raw.projects.filter(alive).map(normalizeProject) : [],
    days,
    scratch: raw?.scratch ?? legacyDump,
    scratchUpdatedAt: raw?.scratchUpdatedAt ?? (legacyDump ? (raw?.dumpUpdatedAt ?? EPOCH) : EPOCH),
    tombstones: dead,
  };
}

/** 그날 체크리스트 — 그 날짜에 올린 할 일 (순서대로) */
export function dayTasks(tasks: Task[], date: string): Task[] {
  return tasks
    .filter((t) => t.plannedOn === date)
    .sort((a, b) => a.dayOrder - b.dayOrder || a.createdAt.localeCompare(b.createdAt));
}

/** 마감 임박으로 볼 날 수 (오늘 포함 3일 전까지) */
export const URGENT_DAYS = 3;

/**
 * 마감이 3일 안이거나 지났는데 체크리스트에 없는 할 일.
 * '체크리스트에 있음' = 오늘~마감일 사이 어느 날짜에 올려 둠 (지난 날에 올려 두고 못 끝낸 건 없는 것으로 본다)
 */
export function urgentUnplanned(tasks: Task[], today: string): Task[] {
  return tasks
    .filter((t) => {
      if (t.status === 'done' || !t.due) return false;
      const d = daysUntil(t.due);
      if (d === null || d > URGENT_DAYS) return false;
      const planned = t.plannedOn && t.plannedOn >= today && t.plannedOn <= (t.due < today ? today : t.due);
      return !planned;
    })
    .sort((a, b) => (a.due ?? '').localeCompare(b.due ?? '') || priorityRank(a.priority) - priorityRank(b.priority));
}

/** 그날 마감인데 그날 체크리스트에는 없는 할 일 (그날 페이지 아래에 작게) */
export function dueButNotPlanned(tasks: Task[], date: string): Task[] {
  return tasks.filter((t) => t.due === date && t.plannedOn !== date && t.status !== 'done');
}

export function createTask(partial: Partial<Task> = {}): Task {
  const now = nowIso();
  return normalizeTask({ ...partial, id: newId(), createdAt: now, updatedAt: now });
}

/** 상태별 정렬된 목록 */
export function tasksIn(tasks: Task[], status: Status): Task[] {
  return tasks
    .filter((t) => t.status === status)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
}

export function priorityRank(p: Priority | null): number {
  return p ? PRIORITY[p].rank : 3;
}

/** 지금까지 위임한 사람들 (최근 사용 순) */
export function knownDelegates(tasks: Task[]): string[] {
  const latest = new Map<string, string>();
  for (const t of tasks) {
    if (!t.delegate) continue;
    const prev = latest.get(t.delegate);
    if (!prev || prev < t.updatedAt) latest.set(t.delegate, t.updatedAt);
  }
  return [...latest.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([name]) => name);
}

export type DueFilter = 'all' | 'overdue' | 'today' | 'week' | 'none';

export type TaskFilter = {
  query: string;
  priority: Priority | 'all';
  /** 'mine' = 내가 직접, 'others' = 누구에게든 위임, 그 외 = 그 사람 */
  delegate: string | 'all' | 'mine' | 'others';
  due: DueFilter;
  /** 'all' | 'none'(프로젝트 없음) | 프로젝트 id */
  project: string;
};

export const EMPTY_FILTER: TaskFilter = { query: '', priority: 'all', delegate: 'all', due: 'all', project: 'all' };

export function isFilterActive(f: TaskFilter): boolean {
  return Boolean(f.query.trim()) || f.priority !== 'all' || f.delegate !== 'all' || f.due !== 'all' || (f.project ?? 'all') !== 'all';
}

/** issueText: 이 할 일에 연결된 이슈 글 (검색용) */
export function matchesFilter(task: Task, f: TaskFilter, now = new Date(), issueText = ''): boolean {
  if (f.priority !== 'all' && task.priority !== f.priority) return false;
  const project = f.project ?? 'all';
  if (project === 'none' && task.projectId) return false;
  if (project !== 'all' && project !== 'none' && task.projectId !== project) return false;
  if (f.delegate === 'mine' && task.delegate) return false;
  if (f.delegate === 'others' && !task.delegate) return false;
  if (!['all', 'mine', 'others'].includes(f.delegate) && task.delegate !== f.delegate) return false;
  if (f.due !== 'all') {
    const d = task.due ? daysUntil(task.due, now) : null;
    if (f.due === 'none' && task.due) return false;
    if (f.due === 'overdue' && !(d !== null && d < 0 && task.status !== 'done')) return false;
    if (f.due === 'today' && d !== 0) return false;
    if (f.due === 'week' && !(d !== null && d >= 0 && d <= 6)) return false;
  }
  const q = f.query.trim().toLowerCase();
  if (q) {
    const hay = [task.title, task.delegate ?? '', docToText(task.note), issueText]
      .join('\n')
      .toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export type BoardSummary = {
  doing: number;
  overdue: number;
  dueToday: number;
  delegated: number;
  doneThisWeek: number;
  openIssues: number;
};

/** openIssuesByTask: 할 일 id → 미해결 이슈 수 */
export function summarize(tasks: Task[], openIssuesByTask: Map<string, number> = new Map(), now = new Date()): BoardSummary {
  const weekAgo = startOfToday(now).getTime() - 6 * 86_400_000;
  const s: BoardSummary = { doing: 0, overdue: 0, dueToday: 0, delegated: 0, doneThisWeek: 0, openIssues: 0 };
  for (const t of tasks) {
    if (t.status === 'doing') s.doing++;
    if (t.status !== 'done') {
      const d = t.due ? daysUntil(t.due, now) : null;
      if (d !== null && d < 0) s.overdue++;
      if (d === 0) s.dueToday++;
      if (t.delegate) s.delegated++;
      s.openIssues += openIssuesByTask.get(t.id) ?? 0;
    } else if (t.completedAt && new Date(t.completedAt).getTime() >= weekAgo) {
      s.doneThisWeek++;
    }
  }
  return s;
}
