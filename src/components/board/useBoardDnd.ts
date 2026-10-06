import {
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRef, useState } from 'react';

import { announceMove } from '@/lib/feedback';
import { useTaskStore } from '@/stores/taskStore';
import type { BoardStatus, Task } from '@/types/task';
import { orderBetween } from '@/utils/order';

import { findContainer, isTabId, statusOfDropId, type Columns } from './dnd';

/**
 * 보드 드래그 앤 드롭.
 * 끄는 동안은 draft(임시 배치)로 미리 보여 주고, 놓을 때 이웃 카드 사이 정렬값을 계산해 스토어에 한 번만 반영한다.
 */
export function useBoardDnd(visible: Columns, byId: Map<string, Task>) {
  const moveTask = useTaskStore((s) => s.moveTask);
  const [draft, setDraft] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  /** 방금 드래그를 끝낸 시각 — 놓는 손가락이 '좌우 밀기'로 오인되지 않게 */
  const lastDragEnd = useRef(0);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter 는 카드 열기 — 집고 놓기는 Space
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const reset = () => {
    setDraft(null);
    setActiveId(null);
    lastDragEnd.current = Date.now();
  };

  const commit = (id: string, to: BoardStatus, order?: number) => {
    const task = byId.get(id);
    if (!task) return;
    if (task.status === to && (order === undefined || task.order === order)) return;
    moveTask(id, to, order);
    if (task.status !== to) announceMove(task.title, to);
  };

  const onDragStart = ({ active }: DragStartEvent) => {
    setActiveId(String(active.id));
    setDraft(structuredClone(visible));
    navigator.vibrate?.(8);
  };

  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || isTabId(over.id)) return; // 탭은 놓을 때만 처리
    const id = String(active.id);
    const overId = String(over.id);
    // 최신 draft 기준으로 계산해야 빠르게 움직여도 칸이 어긋나지 않는다
    setDraft((prev) => {
      if (!prev) return prev;
      const from = findContainer(prev, id);
      const to = findContainer(prev, overId);
      if (!from || !to || from === to) return prev;
      const target = prev[to];
      const overIdx = target.indexOf(overId);
      const insertAt = overIdx >= 0 ? overIdx : target.length;
      return {
        ...prev,
        [from]: prev[from].filter((x) => x !== id),
        [to]: [...target.slice(0, insertAt), id, ...target.slice(insertAt)],
      };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const id = String(active.id);
    const current = draft;
    reset();
    if (!over || !current) return;

    // 모바일 탭 위에 놓음 → 그 상태로 (자리는 자동)
    if (isTabId(over.id)) {
      commit(id, statusOfDropId(over.id) as BoardStatus);
      return;
    }

    const to = findContainer(current, over.id);
    if (!to) return;
    let list = current[to];
    const oldIdx = list.indexOf(id);
    const overIdx = list.indexOf(String(over.id));
    if (oldIdx >= 0 && overIdx >= 0 && oldIdx !== overIdx) list = arrayMove(list, oldIdx, overIdx);
    const idx = list.indexOf(id);
    commit(id, to, orderBetween(byId.get(list[idx - 1] ?? '')?.order, byId.get(list[idx + 1] ?? '')?.order));
  };

  return {
    sensors,
    columns: draft ?? visible,
    dragging: draft !== null,
    activeTask: activeId ? (byId.get(activeId) ?? null) : null,
    handlers: { onDragStart, onDragOver, onDragEnd, onDragCancel: reset },
    justDropped: () => Date.now() - lastDragEnd.current < 400,
  };
}
