import { rankFocus } from '@/utils/priority';
import type { Item, ListId, Project } from '@/types/gtd';

/** 누락 필드를 채워 넣어 항목 형태를 항상 같게 유지한다 (파일에서 읽은 옛 데이터 대응) */
export function createEmptyItem(partial: Partial<Item> = {}): Item {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title ?? '',
    note: partial.note ?? '',
    // 'focus' 는 계산된 뷰라 항목이 머물 수 없다
    list: partial.list && partial.list !== 'focus' ? partial.list : 'inbox',
    projectId: partial.projectId ?? null,
    context: partial.context ?? '',
    due: partial.due ?? '',
    waitingFor: partial.waitingFor ?? '',
    priority: partial.priority ?? 'normal',
    todayPin: partial.todayPin ?? '',
    done: partial.done ?? false,
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
    completedAt: partial.completedAt ?? null,
  };
}

export function createEmptyProject(partial: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name ?? '',
    outcome: partial.outcome ?? '',
    note: partial.note ?? '',
    status: partial.status ?? 'active',
    createdAt: partial.createdAt ?? now,
    updatedAt: partial.updatedAt ?? now,
  };
}

export function itemsInList(items: Item[], list: ListId): Item[] {
  return items
    .filter((i) => (list === 'done' ? i.done : !i.done && i.list === list))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function countByList(items: Item[], list: ListId): number {
  if (list === 'focus') return rankFocus(items).length;
  return itemsInList(items, list).length;
}

/** 프로젝트에 묶인 항목 (완료는 뒤로) */
export function itemsInProject(items: Item[], projectId: string): Item[] {
  return items
    .filter((i) => i.projectId === projectId)
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}

/** 프로젝트에 남아 있는(미완료) 항목 수 */
export function countOpenInProject(items: Item[], projectId: string): number {
  return items.filter((i) => i.projectId === projectId && !i.done).length;
}
