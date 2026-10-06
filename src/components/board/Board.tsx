import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';
import { DROP_ANIMATION } from '@/lib/motion';
import { useMemo, useRef, type TouchEvent } from 'react';

import BoardColumn from '@/components/board/BoardColumn';
import MobileTab from '@/components/board/MobileTab';
import { TaskCardBody } from '@/components/board/TaskCard';
import { BOARD_COLUMNS, DONE_PAGE_SIZE } from '@/constants/status';
import { useDirection } from '@/hooks/useDirection';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTaskParam } from '@/hooks/useTaskParam';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';
import type { BoardStatus, Task } from '@/types/task';
import { issueIndex, type IssueStat } from '@/utils/issues';
import { isFilterActive, matchesFilter, tasksIn } from '@/utils/task';

import { boardCollision, type Columns } from './dnd';
import { useBoardDnd } from './useBoardDnd';

/** 필터·완료 칸 접기를 적용한 칸별 카드 id */
function useVisibleColumns(tasks: Task[], issues: Map<string, IssueStat>) {
  const filter = useUiStore((s) => s.boardFilter);
  const showAllDone = useUiStore((s) => s.showAllDone);
  return useMemo(() => {
    const now = new Date();
    const visible = {} as Columns;
    const totals = {} as Record<BoardStatus, number>;
    let hiddenDone = 0;
    for (const s of BOARD_COLUMNS) {
      const all = tasksIn(tasks, s);
      totals[s] = all.length;
      let ids = all.filter((task) => matchesFilter(task, filter, now, issues.get(task.id)?.text)).map((task) => task.id);
      if (s === 'done' && !showAllDone && ids.length > DONE_PAGE_SIZE) {
        hiddenDone = ids.length - DONE_PAGE_SIZE;
        ids = ids.slice(0, DONE_PAGE_SIZE);
      }
      visible[s] = ids;
    }
    return { visible, totals, hiddenDone, filtered: isFilterActive(filter) };
  }, [tasks, filter, showAllDone, issues]);
}

/** 모바일: 좌우로 밀어서 칸 전환 */
function useSwipe(onSwipe: (dir: 1 | -1) => void, blocked: () => boolean) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onTouchStart: (e: TouchEvent) => {
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: TouchEvent) => {
      const s = start.current;
      start.current = null;
      if (!s || blocked()) return;
      const dx = e.changedTouches[0].clientX - s.x;
      const dy = e.changedTouches[0].clientY - s.y;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      onSwipe(dx < 0 ? 1 : -1);
    },
  };
}

export default function Board() {
  const tasks = useTaskStore((s) => s.tasks);
  const days = useTaskStore((s) => s.days);
  const issues = useMemo(() => issueIndex(days), [days]);
  const setShowAllDone = useUiStore((s) => s.setShowAllDone);
  const mobileColumn = useUiStore((s) => s.mobileColumn);
  const setMobileColumn = useUiStore((s) => s.setMobileColumn);
  const isMobile = useIsMobile();
  const { open } = useTaskParam();

  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const { visible, totals, hiddenDone, filtered } = useVisibleColumns(tasks, issues);
  const dnd = useBoardDnd(visible, byId);

  const mobileStatus = BOARD_COLUMNS[Math.min(mobileColumn, BOARD_COLUMNS.length - 1)];
  const slide = useDirection(mobileColumn);
  const swipe = useSwipe(
    (dir) => setMobileColumn(Math.max(0, Math.min(BOARD_COLUMNS.length - 1, mobileColumn + dir))),
    () => dnd.dragging || dnd.justDropped(),
  );

  const columnProps = (status: BoardStatus) => ({
    status,
    tasks: dnd.columns[status].map((id) => byId.get(id)).filter((t): t is Task => Boolean(t)),
    total: totals[status],
    onOpen: (id: string) => open(id),
    filtered,
    hiddenCount: status === 'done' && !dnd.dragging ? hiddenDone : 0,
    onShowMore: () => setShowAllDone(true),
    issues,
  });

  return (
    <DndContext
      sensors={dnd.sensors}
      collisionDetection={boardCollision}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      {...dnd.handlers}
    >
      {isMobile ? (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div
            role="tablist"
            aria-label="상태 칸"
            className="sticky top-[calc(3rem+env(safe-area-inset-top))] z-20 -mx-4 flex gap-1 bg-bg-page/90 px-4 py-1.5 backdrop-blur-xl"
          >
            {BOARD_COLUMNS.map((s, i) => (
              <MobileTab
                key={s}
                status={s}
                count={dnd.columns[s].length}
                active={s === mobileStatus}
                onSelect={() => setMobileColumn(i)}
                dragging={dnd.dragging}
              />
            ))}
          </div>
          {dnd.dragging ? (
            <div className="anim-fade text-center text-xs text-text-muted">다른 상태로 옮기려면 위의 탭에 놓으세요</div>
          ) : null}
          <div className="flex min-h-0 flex-1 flex-col" {...swipe}>
            <BoardColumn key={mobileStatus} {...columnProps(mobileStatus)} bare className={`flex-1 ${slide || 'anim-fade'}`} />
          </div>
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-[repeat(4,minmax(15rem,1fr))] gap-3 overflow-x-auto pb-1" data-testid="board">
          {BOARD_COLUMNS.map((s) => (
            <BoardColumn key={s} {...columnProps(s)} />
          ))}
        </div>
      )}

      <DragOverlay dropAnimation={DROP_ANIMATION}>
        {dnd.activeTask ? (
          <div className="w-[min(20rem,calc(100vw-2rem))]">
            <TaskCardBody task={dnd.activeTask} overlay issueStat={issues.get(dnd.activeTask.id)} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
