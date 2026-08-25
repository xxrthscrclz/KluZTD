import { DEFAULT_LIST_ID } from '@/constants/lists';
import type { Item, ListId, Project } from '@/types/gtd';

/** 누락 필드를 채워 넣어 항목 형태를 항상 같게 유지한다 (파일에서 읽은 옛 데이터 대응) */
export function createEmptyItem(partial: Partial<Item> = {}): Item {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title ?? '',
    note: partial.note ?? '',
    list: partial.list ?? DEFAULT_LIST_ID,
    projectId: partial.projectId ?? null,
    context: partial.context ?? '',
    due: partial.due ?? '',
    waitingFor: partial.waitingFor ?? '',
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
  return itemsInList(items, list).length;
}
