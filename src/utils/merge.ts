import type { AppData, Issue } from '@/types/task';

type WithId = { id: string; updatedAt: string };

/** id 별로 합치고, 같은 id 면 더 늦게 고친 쪽. 지운 것(tombstones)은 뺀다 */
function mergeById<T extends WithId>(a: T[], b: T[], dead: Record<string, string>): T[] {
  const byId = new Map<string, T>();
  for (const x of a) byId.set(x.id, x);
  for (const y of b) {
    const x = byId.get(y.id);
    if (!x) byId.set(y.id, y);
    else {
      byId.set(y.id, y.updatedAt >= x.updatedAt ? y : x);
    }
  }
  return [...byId.values()].filter((x) => !dead[x.id]);
}

/**
 * 두 기기/탭의 데이터를 합친다.
 * - 할 일·프로젝트·이슈·수첩 페이지: id 단위, 더 늦게 고친 쪽
 * - 이슈는 날짜별로 따로 합친다 (한쪽은 할 일 제목, 한쪽은 이슈를 고친 경우 둘 다 살린다)
 * - 지운 것은 양쪽 tombstones 를 합쳐서 어느 쪽에서든 지웠으면 지운다
 */
export function mergeData(base: AppData, incoming: AppData): AppData {
  const dead = { ...base.tombstones };
  for (const [id, at] of Object.entries(incoming.tombstones)) if (!dead[id] || dead[id] < at) dead[id] = at;

  const tasks = mergeById(base.tasks, incoming.tasks, dead);

  const days: AppData['days'] = {};
  for (const key of new Set([...Object.keys(base.days), ...Object.keys(incoming.days)])) {
    const issues = mergeIssues(base.days[key]?.issues ?? [], incoming.days[key]?.issues ?? [], dead);
    if (issues.length) days[key] = { issues };
  }

  const scratchNewer = incoming.scratchUpdatedAt >= base.scratchUpdatedAt;
  return {
    tasks,
    projects: mergeById(base.projects, incoming.projects, dead),
    notes: mergeById(base.notes, incoming.notes, dead),
    days,
    scratch: scratchNewer ? incoming.scratch : base.scratch,
    scratchUpdatedAt: scratchNewer ? incoming.scratchUpdatedAt : base.scratchUpdatedAt,
    tombstones: dead,
  };
}

function mergeIssues<T extends Issue>(a: T[], b: T[], dead: Record<string, string>): T[] {
  return mergeById(a, b, dead).sort((x, y) => x.createdAt.localeCompare(y.createdAt));
}

/** 30일 지난 삭제 기록은 정리한다 (그때쯤이면 모든 기기가 이미 병합했다) */
export function purgeTombstones(data: AppData, now = Date.now()): AppData {
  const cutoff = now - 30 * 86_400_000;
  const tombstones = Object.fromEntries(Object.entries(data.tombstones).filter(([, at]) => new Date(at).getTime() > cutoff));
  return { ...data, tombstones };
}
