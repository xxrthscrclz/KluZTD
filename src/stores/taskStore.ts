import { create } from 'zustand';

import type { AppData, DayEntry, Doc, Issue, Note, Project, Status, Task } from '@/types/task';
import { todayIsoKey } from '@/utils/date';
import { newId, nowIso } from '@/utils/id';
import { orderBetween } from '@/utils/order';
import { createTask, dayTasks, normalizeData, priorityRank, tasksIn } from '@/utils/task';

const ACTIVITY_LIMIT = 100;

type TaskPatch = Partial<Pick<Task, 'title' | 'priority' | 'due' | 'delegate' | 'note' | 'projectId'>>;

/** 삭제 직후 '되돌리기' 용 — 메모리에만 잠깐 들고 있다 (파일에서는 바로 지워짐) */
export type Undo = () => void;

type TaskState = AppData & {
  /** 사용자가 데이터를 바꿀 때마다 1씩 오른다 — 동기화 엔진이 '저장 안 된 변경'을 판단하는 기준 */
  changeSeq: number;
  /** 동기화 엔진 전용: 서버/캐시에서 받은 데이터로 교체 (changeSeq 는 그대로) */
  replaceData: (data: AppData) => void;

  /** ── 상태 관리(보드) ── */
  addTask: (partial: Partial<Task>, at?: 'top' | 'natural') => string;
  updateTask: (id: string, patch: TaskPatch) => void;
  /** 상태 변경 + 위치. order 를 안 주면 그 칸에서 자연스러운 자리(완료는 맨 위, 나머지는 우선순위 자리) */
  moveTask: (id: string, status: Status, order?: number) => void;
  /** 바로 지운다. 반환값으로 되돌리기 */
  deleteTask: (id: string) => Undo;


  /** ── 일일 관리 (date = YYYY-MM-DD) — 체크리스트 줄 = 할 일 ── */
  /** 그날 체크리스트에 새 할 일. at: 맨 위/맨 아래, 또는 { after: 할 일 id } 바로 아래 */
  addDayTask: (date: string, title: string, at?: 'top' | 'bottom' | { after: string }) => string;
  /** 체크리스트에 올리기/빼기 (date=null 이면 상태 관리에만 남는다) */
  planTask: (id: string, date: string | null) => void;
  /** 체크리스트 안 순서 */
  setDayOrder: (id: string, dayOrder: number) => void;
  /** 완료 ↔ 진행 예정 */
  toggleDone: (id: string) => void;
  /** from 날짜에 올려 두고 못 끝낸 할 일을 to 날짜로 옮긴다. 옮긴 개수 */
  carryOver: (from: string, to: string, ids?: string[]) => number;
  /** 지난 날짜 체크리스트에 남은 미완료를 모두 today 로 (날이 바뀌면 자동) */
  rollOver: (today: string) => number;
  /** 프로젝트 Next Action 순서 — ids 순서대로 */
  setProjectOrder: (ids: string[]) => void;

  /** ── 프로젝트 ── */
  addProject: (name: string) => string;
  updateProject: (id: string, patch: Partial<Pick<Project, 'name' | 'color'>>) => void;
  /** 바로 지운다 (할 일들은 프로젝트 없음으로 남는다) */
  deleteProject: (id: string) => Undo;

  /** ── 이슈 (한 곳에만 저장: 날짜별, 할 일 연결 선택) ── */
  /** date 날짜에 새 이슈. taskId 를 주면 그 할 일에 연결 */
  addIssue: (date: string, taskId?: string | null) => string;
  /** 어느 날짜에 있든 id 로 고친다 */
  updateIssue: (id: string, patch: Partial<Pick<Issue, 'doc' | 'resolved' | 'taskId'>>) => void;
  deleteIssue: (id: string) => Undo;

  /** 자유공간 */
  setScratch: (doc: Doc | null) => void;

  /** ── 수첩 ── */
  addNote: () => string;
  updateNote: (id: string, patch: Partial<Pick<Note, 'title' | 'doc'>>) => void;
  /** 바로 지운다 */
  deleteNote: (id: string) => Undo;
};

const emptyDay = (): DayEntry => ({ issues: [] });
const dayOf = (days: AppData['days'], date: string): DayEntry => days[date] ?? emptyDay();

function applyStatus(task: Task, to: Status, at: string): Task {
  if (task.status === to) return task;
  return {
    ...task,
    status: to,
    activity: [...task.activity, { at, from: task.status, to }].slice(-ACTIVITY_LIMIT),
    startedAt: to === 'doing' && !task.startedAt ? at : task.startedAt,
    completedAt: to === 'done' ? at : null,
  };
}

/** 칸 안에서 새 항목이 들어갈 자리 — 완료는 맨 위, 그 외엔 같은/더 높은 우선순위 뒤 */
function naturalOrder(tasks: Task[], status: Status, task: Task): number {
  const column = tasksIn(tasks, status).filter((t) => t.id !== task.id);
  if (status === 'done') return orderBetween(undefined, column[0]?.order);
  const rank = priorityRank(task.priority);
  const idx = column.findIndex((t) => priorityRank(t.priority) > rank);
  if (idx === -1) return orderBetween(column[column.length - 1]?.order, undefined);
  return orderBetween(column[idx - 1]?.order, column[idx].order);
}

/** 지운 id 기록 추가/제거 */
const bury = (t: Record<string, string>, ids: string[], at: string) => ({ ...t, ...Object.fromEntries(ids.map((id) => [id, at])) });
const unbury = (t: Record<string, string>, ids: string[]) => Object.fromEntries(Object.entries(t).filter(([id]) => !ids.includes(id)));

export const useTaskStore = create<TaskState>((set, get) => {
  const bump = (s: TaskState) => s.changeSeq + 1;

  const patchTask = (id: string, fn: (t: Task, at: string) => Task) => {
    const at = nowIso();
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...fn(t, at), updatedAt: at } : t)), changeSeq: bump(s) }));
  };

  const patchDay = (date: string, fn: (d: DayEntry, at: string) => DayEntry) => {
    const at = nowIso();
    set((s) => ({ days: { ...s.days, [date]: fn(dayOf(s.days, date), at) }, changeSeq: bump(s) }));
  };

  /** 이슈가 들어 있는 날짜 */
  const issueDate = (id: string) => Object.keys(get().days).find((k) => get().days[k].issues.some((i) => i.id === id));

  return {
    ...normalizeData(null),
    changeSeq: 0,

    replaceData: (data) => set({ ...normalizeData(data) }),

    addTask: (partial, position = 'natural') => {
      const status = partial.status ?? 'todo';
      const draft = createTask({ ...partial, status });
      const at = nowIso();
      const top = () => orderBetween(undefined, tasksIn(get().tasks, status)[0]?.order);
      const task: Task = {
        ...draft,
        order: partial.order ?? (position === 'top' ? top() : naturalOrder(get().tasks, status, draft)),
        startedAt: status === 'doing' ? at : null,
        completedAt: status === 'done' ? at : null,
      };
      set((s) => ({ tasks: [...s.tasks, task], changeSeq: bump(s) }));
      return task.id;
    },

    updateTask: (id, patch) =>
      patchTask(id, (t) => ({
        ...t,
        ...patch,
        title: patch.title !== undefined ? patch.title : t.title,
        delegate: patch.delegate !== undefined ? patch.delegate?.trim() || null : t.delegate,
        // 다른 프로젝트로 옮기면 그쪽에선 마감일 순부터
        projectOrder: patch.projectId !== undefined && patch.projectId !== t.projectId ? null : t.projectOrder,
      })),

    moveTask: (id, status, order) =>
      patchTask(id, (t, at) => {
        const moved = applyStatus(t, status, at);
        const next = { ...moved, order: order ?? (t.status === status ? t.order : naturalOrder(get().tasks, status, moved)) };
        // 진행 중으로 옮기면 오늘 체크리스트로
        const today = todayIsoKey();
        if (status !== 'doing' || t.status === 'doing' || t.plannedOn === today) return next;
        const list = dayTasks(get().tasks, today);
        return { ...next, plannedOn: today, dayOrder: orderBetween(list[list.length - 1]?.dayOrder, undefined) };
      }),

    deleteTask: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return () => {};
      const ids = [id];
      const at = nowIso();
      set((s) => ({
        tasks: s.tasks.filter((t) => t.id !== id),
        // 그날 이슈의 연결은 풀고 이슈 자체는 남긴다
        days: Object.fromEntries(
          Object.entries(s.days).map(([k, d]) => [k, { issues: d.issues.map((x) => (x.taskId === id ? { ...x, taskId: null, updatedAt: at } : x)) }]),
        ),
        tombstones: bury(s.tombstones, ids, at),
        changeSeq: bump(s),
      }));
      return () => set((s) => ({ tasks: [...s.tasks, task], tombstones: unbury(s.tombstones, ids), changeSeq: bump(s) }));
    },

    addDayTask: (date, title, at = 'bottom') => {
      const list = dayTasks(get().tasks, date);
      let dayOrder: number;
      if (at === 'top') dayOrder = orderBetween(undefined, list[0]?.dayOrder);
      else if (typeof at === 'object' && list.some((t) => t.id === at.after)) {
        const idx = list.findIndex((t) => t.id === at.after);
        dayOrder = orderBetween(list[idx].dayOrder, list[idx + 1]?.dayOrder);
      } else dayOrder = orderBetween(list[list.length - 1]?.dayOrder, undefined);
      // 상태 관리에도 바로 보인다 (진행 예정)
      return get().addTask({ title: title.trim(), status: 'todo', plannedOn: date, dayOrder });
    },

    planTask: (id, date) =>
      patchTask(id, (t) => {
        if (!date) return { ...t, plannedOn: null };
        const list = dayTasks(get().tasks, date).filter((x) => x.id !== id);
        return { ...t, plannedOn: date, dayOrder: t.plannedOn === date ? t.dayOrder : orderBetween(list[list.length - 1]?.dayOrder, undefined) };
      }),

    setDayOrder: (id, dayOrder) => patchTask(id, (t) => ({ ...t, dayOrder })),

    toggleDone: (id) => {
      const task = get().tasks.find((t) => t.id === id);
      if (task) get().moveTask(id, task.status === 'done' ? 'todo' : 'done');
    },

    carryOver: (from, to, only) => {
      const pending = dayTasks(get().tasks, from).filter((t) => t.status !== 'done' && (!only || only.includes(t.id)));
      if (!pending.length) return 0;
      const target = dayTasks(get().tasks, to);
      let last = target[target.length - 1]?.dayOrder;
      const orders = new Map(
        pending.map((t) => {
          last = orderBetween(last, undefined);
          return [t.id, last] as const;
        }),
      );
      const at = nowIso();
      set((s) => ({
        tasks: s.tasks.map((t) => (orders.has(t.id) ? { ...t, plannedOn: to, dayOrder: orders.get(t.id) as number, updatedAt: at } : t)),
        changeSeq: bump(s),
      }));
      return pending.length;
    },

    setProjectOrder: (ids) => {
      const orders = new Map(ids.map((id, i) => [id, (i + 1) * 1024]));
      const at = nowIso();
      set((s) => ({
        tasks: s.tasks.map((t) => (orders.has(t.id) ? { ...t, projectOrder: orders.get(t.id) as number, updatedAt: at } : t)),
        changeSeq: bump(s),
      }));
    },

    rollOver: (today) => {
      const stale = get()
        .tasks.filter((t) => t.plannedOn && t.plannedOn < today && t.status !== 'done')
        .sort((a, b) => (a.plannedOn as string).localeCompare(b.plannedOn as string) || a.dayOrder - b.dayOrder);
      if (!stale.length) return 0;
      const target = dayTasks(get().tasks, today);
      let last = target[target.length - 1]?.dayOrder;
      const orders = new Map(
        stale.map((t) => {
          last = orderBetween(last, undefined);
          return [t.id, last] as const;
        }),
      );
      const at = nowIso();
      set((s) => ({
        tasks: s.tasks.map((t) => (orders.has(t.id) ? { ...t, plannedOn: today, dayOrder: orders.get(t.id) as number, updatedAt: at } : t)),
        changeSeq: bump(s),
      }));
      return stale.length;
    },

    addProject: (name) => {
      const at = nowIso();
      const used = new Set(get().projects.map((p) => p.color));
      const color = [1, 2, 3, 4, 5, 6].find((c) => !used.has(c)) ?? ((get().projects.length % 6) + 1);
      const project: Project = { id: newId(), name: name.trim() || '새 프로젝트', color, createdAt: at, updatedAt: at };
      set((s) => ({ projects: [...s.projects, project], changeSeq: bump(s) }));
      return project.id;
    },
    updateProject: (id, patch) => {
      const at = nowIso();
      set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: at } : p)), changeSeq: bump(s) }));
    },
    deleteProject: (id) => {
      const project = get().projects.find((p) => p.id === id);
      if (!project) return () => {};
      const linked = get().tasks.filter((t) => t.projectId === id).map((t) => t.id);
      const at = nowIso();
      set((s) => ({
        projects: s.projects.filter((p) => p.id !== id),
        tasks: s.tasks.map((t) => (t.projectId === id ? { ...t, projectId: null, updatedAt: at } : t)),
        tombstones: bury(s.tombstones, [id], at),
        changeSeq: bump(s),
      }));
      return () =>
        set((s) => ({
          projects: [...s.projects, project],
          tasks: s.tasks.map((t) => (linked.includes(t.id) ? { ...t, projectId: id, updatedAt: nowIso() } : t)),
          tombstones: unbury(s.tombstones, [id]),
          changeSeq: bump(s),
        }));
    },

    addIssue: (date, taskId = null) => {
      const at = nowIso();
      const issue: Issue = { id: newId(), doc: { type: 'doc', content: [{ type: 'paragraph' }] }, resolved: false, taskId, createdAt: at, updatedAt: at };
      patchDay(date, (d) => ({ ...d, issues: [...d.issues, issue] }));
      return issue.id;
    },
    updateIssue: (id, patch) => {
      const date = issueDate(id);
      if (!date) return;
      patchDay(date, (d, at) => ({ ...d, issues: d.issues.map((i) => (i.id === id ? { ...i, ...patch, updatedAt: at } : i)) }));
    },
    deleteIssue: (id) => {
      const date = issueDate(id);
      const issue = date ? dayOf(get().days, date).issues.find((i) => i.id === id) : undefined;
      if (!date || !issue) return () => {};
      patchDay(date, (d) => ({ ...d, issues: d.issues.filter((i) => i.id !== id) }));
      set((s) => ({ tombstones: bury(s.tombstones, [id], nowIso()) }));
      return () => {
        set((s) => ({ tombstones: unbury(s.tombstones, [id]) }));
        patchDay(date, (d) => ({ ...d, issues: [...d.issues, issue] }));
      };
    },

    setScratch: (doc) => set((s) => ({ scratch: doc, scratchUpdatedAt: nowIso(), changeSeq: bump(s) })),

    addNote: () => {
      const at = nowIso();
      const note: Note = { id: newId(), title: '', doc: null, createdAt: at, updatedAt: at };
      set((s) => ({ notes: [...s.notes, note], changeSeq: bump(s) }));
      return note.id;
    },
    updateNote: (id, patch) => {
      const at = nowIso();
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: at } : n)), changeSeq: bump(s) }));
    },
    deleteNote: (id) => {
      const note = get().notes.find((n) => n.id === id);
      if (!note) return () => {};
      set((s) => ({ notes: s.notes.filter((n) => n.id !== id), tombstones: bury(s.tombstones, [id], nowIso()), changeSeq: bump(s) }));
      return () => set((s) => ({ notes: [...s.notes, note], tombstones: unbury(s.tombstones, [id]), changeSeq: bump(s) }));
    },
  };
});
