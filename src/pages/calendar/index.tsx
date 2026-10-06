import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { DROP_ANIMATION } from '@/lib/motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import DayCell from '@/components/calendar/DayCell';
import DayDetail from '@/components/calendar/DayDetail';
import { ScheduleChipBody } from '@/components/calendar/ScheduleChip';
import IconButton from '@/components/ui/IconButton';
import { useDirection } from '@/hooks/useDirection';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useTaskStore } from '@/stores/taskStore';
import { toast } from '@/stores/toastStore';
import { summarizeDays } from '@/utils/calendar';
import { formatDate, fromDateKey, monthGrid, toDateKey, todayIsoKey, WEEKDAYS } from '@/utils/date';

/**
 * 달력 — 한 달에 뭘 했고 뭐가 잡혀 있는지.
 * 칸을 누르면 오른쪽(모바일은 아래)에 그날 자세히, 두 번 누르면 그날 일일 관리.
 * 일정을 끌어 다른 날에 놓으면 마감일이 바뀐다 (상태 관리·일일 관리에 그대로 반영).
 */
export default function CalendarPage() {
  const tasks = useTaskStore((s) => s.tasks);
  const days = useTaskStore((s) => s.days);
  const updateTask = useTaskStore((s) => s.updateTask);
  const planTask = useTaskStore((s) => s.planTask);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const today = todayIsoKey();
  const [selected, setSelected] = useState(today);
  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragKind, setDragKind] = useState<'planned' | 'due'>('planned');
  const slide = useDirection(view.y * 12 + view.m);

  const grid = useMemo(() => monthGrid(view.y, view.m), [view]);
  const keys = useMemo(() => grid.map(toDateKey), [grid]);
  const summaries = useMemo(() => summarizeDays({ tasks, days }, [...new Set([...keys, selected])]), [tasks, days, keys, selected]);

  // 마지막 주가 통째로 다음 달이면 빼서 5주로
  const weeks = grid[35].getMonth() !== view.m ? 5 : 6;

  const shift = (n: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const goToday = () => {
    const d = new Date();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(today);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) => {
    setDragTaskId(String(e.active.data.current?.taskId ?? ''));
    setDragKind((e.active.data.current?.kind as 'planned' | 'due') ?? 'planned');
  };
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setDragTaskId(null);
    const taskId = String(active.data.current?.taskId ?? '');
    const kind = active.data.current?.kind as 'planned' | 'due' | undefined;
    const key = over ? String(over.id).replace(/^day:/, '') : null;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !key) return;
    // 체크리스트 할 일은 체크리스트 날짜를, '이날 마감' 은 마감일을 옮긴다
    if (kind === 'due') {
      if (task.due === key) return;
      updateTask(taskId, { due: key });
      toast({ message: `«${task.title}» 마감 → ${formatDate(key)}`, tone: 'success' }, 2400);
    } else {
      if (task.plannedOn === key) return;
      planTask(taskId, key);
      toast({ message: `«${task.title}» → ${formatDate(key)} 체크리스트`, tone: 'success' }, 2400);
    }
    setSelected(key);
  };

  const dragTask = dragTaskId ? tasks.find((t) => t.id === dragTaskId) : null;
  const selectedSummary = summaries.get(selected);
  const openDay = (key: string) => navigate(key === today ? '/daily' : `/daily/${key}`);

  return (
    <div className="@container mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 pt-4 pb-10 sm:px-6 sm:pt-7 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="이전 달" onClick={() => shift(-1)}>
          <ChevronLeft className="size-[18px]" />
        </IconButton>
        <div className="min-w-[8.5rem] text-center text-[1.45rem] font-extrabold tracking-[-0.03em] tabular-nums sm:text-[1.6rem]" data-testid="cal-title">
          {view.y}년 {view.m + 1}월
        </div>
        <IconButton label="다음 달" onClick={() => shift(1)}>
          <ChevronRight className="size-[18px]" />
        </IconButton>
        <button
          type="button"
          onClick={goToday}
          className="h-8 rounded-lg px-3 text-[0.8rem] font-semibold text-text-secondary hover:bg-bg-hover"
        >
          오늘
        </button>
        <div className="ml-auto hidden text-xs text-text-muted md:block">칸을 누르면 그날 자세히 · 두 번 누르면 일일 관리 · 할 일은 끌어서 다른 날로</div>
      </div>

      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragTaskId(null)}>
        <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-[minmax(0,1fr)_21rem]">
          <div className="overflow-hidden rounded-2xl border border-border-default shadow-card" role="grid" aria-label="달력" data-testid="calendar">
            <div className="grid grid-cols-7 border-b border-border-default bg-bg-raised">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={`py-2 text-center text-xs font-bold ${i === 0 ? 'text-danger/80' : i === 6 ? 'text-accent/80' : 'text-text-muted'}`}
                >
                  {w}
                </div>
              ))}
            </div>
            <div key={`${view.y}-${view.m}`} className={`-mt-px -ml-px grid grid-cols-7 ${slide}`}>
              {grid.slice(0, weeks * 7).map((d) => {
                const key = toDateKey(d);
                const summary = summaries.get(key);
                if (!summary) return null;
                return (
                  <DayCell
                    key={key}
                    date={d}
                    summary={summary}
                    inMonth={d.getMonth() === view.m}
                    isToday={key === today}
                    selected={key === selected}
                    compact={isMobile}
                    onSelect={() => {
                      setSelected(key);
                      if (d.getMonth() !== view.m) setView({ y: d.getFullYear(), m: d.getMonth() });
                    }}
                    onOpenDay={() => openDay(key)}
                  />
                );
              })}
            </div>
          </div>

          <div className="@4xl:sticky @4xl:top-7 @4xl:self-start">
            {selectedSummary && fromDateKey(selected) ? (
              <div key={selected} className="anim-fade">
                <DayDetail summary={selectedSummary} />
              </div>
            ) : null}
          </div>
        </div>

        <DragOverlay dropAnimation={DROP_ANIMATION}>
          {dragTask ? (
            <div className="w-40">
              <ScheduleChipBody task={dragTask} overlay kind={dragKind} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
