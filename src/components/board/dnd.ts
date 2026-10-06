import { closestCorners, pointerWithin, type CollisionDetection, type UniqueIdentifier } from '@dnd-kit/core';

import { BOARD_COLUMNS } from '@/constants/status';
import type { BoardStatus } from '@/types/task';

export type Columns = Record<BoardStatus, string[]>;

export const TAB_PREFIX = 'tab:';
export const COL_PREFIX = 'col:';

export const columnDropId = (status: BoardStatus) => `${COL_PREFIX}${status}`;
export const tabDropId = (status: BoardStatus) => `${TAB_PREFIX}${status}`;
export const isTabId = (id: UniqueIdentifier) => String(id).startsWith(TAB_PREFIX);

/** 칸/탭 드롭 영역 id → 상태 (카드 id 면 null) */
export function statusOfDropId(id: UniqueIdentifier): BoardStatus | null {
  const s = String(id);
  if (s.startsWith(COL_PREFIX)) return s.slice(COL_PREFIX.length) as BoardStatus;
  if (s.startsWith(TAB_PREFIX)) return s.slice(TAB_PREFIX.length) as BoardStatus;
  return null;
}

/** 이 id(카드 또는 칸)가 속한 칸 */
export function findContainer(columns: Columns, id: UniqueIdentifier): BoardStatus | null {
  return statusOfDropId(id) ?? BOARD_COLUMNS.find((s) => columns[s].includes(String(id))) ?? null;
}

/** 탭(모바일) → 카드 → 칸 순으로 놓을 곳을 찾는다 */
export const boardCollision: CollisionDetection = (args) => {
  const within = pointerWithin(args);
  const tab = within.find((c) => isTabId(c.id));
  if (tab) return [tab];
  const cards = within.filter((c) => !statusOfDropId(c.id));
  if (cards.length) {
    return closestCorners({
      ...args,
      droppableContainers: args.droppableContainers.filter((d) => cards.some((c) => c.id === d.id)),
    });
  }
  if (within.length) return within;
  return closestCorners(args);
};
