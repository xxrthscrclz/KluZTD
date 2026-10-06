import { closestCenter, DndContext, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { History, Plus } from 'lucide-react';
import { useMemo, useState, type ClipboardEvent } from 'react';

import DayTaskRow from '@/components/daily/DayTaskRow';
import { announceDelete } from '@/lib/feedback';
import { useTaskStore } from '@/stores/taskStore';
import { toast } from '@/stores/toastStore';
import type { Task } from '@/types/task';
import { addDays, formatDate, fromDateKey, toDateKey } from '@/utils/date';
import { orderBetween } from '@/utils/order';
import { dayTasks } from '@/utils/task';

/** 오늘 이전 14일 안에서, 올려 두고 못 끝낸 할 일이 있는 가장 최근 날 */
function usePendingFrom(tasks: Task[], date: string, isToday: boolean) {
  return useMemo(() => {
    if (!isToday) return null;
    const base = fromDateKey(date);
    if (!base) return null;
    for (let back = 1; back <= 14; back++) {
      const key = toDateKey(addDays(base, -back));
      const pending = dayTasks(tasks, key).filter((t) => t.status !== 'done' && t.title.trim());
      if (pending.length) return { key, count: pending.length };
    }
    return null;
  }, [tasks, date, isToday]);
}

type Props = {
  date: string;
  isToday: boolean;
  /** 줄 메뉴의 '이슈 기록' — 아래 이슈 칸에 그 할 일과 연결된 새 이슈를 연다 */
  onIssue: (taskId: string) => void;
  /** 줄의 이슈 아이콘 — 연결된 이슈로 이동·강조만 (새로 만들지 않음) */
  onShowIssues: (taskId: string) => void;
};

/**
 * 그날 체크리스트. 한 줄 = 할 일 하나 = 상태 관리 카드 하나.
 * 여기서 적으면 상태 관리 «진행 예정»에도 생기고, 체크하면 «진행 완료».
 */
export default function DayChecklist({ date, isToday, onIssue, onShowIssues }: Props) {
  const tasks = useTaskStore((s) => s.tasks);
  const day = useTaskStore((s) => s.days[date]);
  const addDayTask = useTaskStore((s) => s.addDayTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const setDayOrder = useTaskStore((s) => s.setDayOrder);
  const toggleDone = useTaskStore((s) => s.toggleDone);
  const planTask = useTaskStore((s) => s.planTask);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const carryOver = useTaskStore((s) => s.carryOver);
  const [draft, setDraft] = useState('');
  const [focusId, setFocusId] = useState<string | null>(null);
  const pendingFrom = usePendingFrom(tasks, date, isToday);

  const items = useMemo(() => dayTasks(tasks, date), [tasks, date]);
  const issueCount = useMemo(() => {
    const map = new Map<string, { open: number; total: number }>();
    for (const i of day?.issues ?? []) {
      if (!i.taskId) continue;
      const c = map.get(i.taskId) ?? { open: 0, total: 0 };
      c.total++;
      if (!i.resolved) c.open++;
      map.set(i.taskId, c);
    }
    return (id: string) => map.get(id) ?? { open: 0, total: 0 };
  }, [day]);
  const doneCount = items.filter((t) => t.status === 'done').length;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = items.map((t) => t.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    const idx = next.indexOf(String(active.id));
    const byId = new Map(items.map((t) => [t.id, t]));
    setDayOrder(String(active.id), orderBetween(byId.get(next[idx - 1] ?? '')?.dayOrder, byId.get(next[idx + 1] ?? '')?.dayOrder));
  };

  /** '- [ ] 할 일', '1. 할 일', '[x] 끝낸 일' 같은 목록 기호를 떼고 한 줄씩 추가 */
  const addLines = (lines: string[]) => {
    let after: string | undefined;
    for (const line of lines) {
      const m = /^\s*(?:(?:[-*•]|\d+[.)])\s+)?(?:\[([ xX]?)\]\s*)?(.*)$/.exec(line);
      const text = (m?.[2] ?? line).trim();
      if (!text) continue;
      after = addDayTask(date, text, after ? { after } : 'bottom');
      if (m?.[1]?.toLowerCase() === 'x') toggleDone(after);
    }
  };

  const submitDraft = () => {
    if (!draft.trim()) return;
    addLines([draft]);
    setDraft('');
  };

  /** 여러 줄을 붙여넣으면 한 줄씩 할 일로 — 머릿속에 있는 걸 한꺼번에 쏟아붓기 */
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!text.includes('\n')) return;
    e.preventDefault();
    addLines(text.split(/\r?\n/));
    toast({ message: '여러 줄을 한 번에 추가했어요', tone: 'success' }, 2000);
  };

  const removeEmpty = (task: Task) => {
    const idx = items.findIndex((t) => t.id === task.id);
    deleteTask(task.id);
    setFocusId(items[idx - 1]?.id ?? null);
  };

  const postpone = (task: Task) => {
    const next = toDateKey(addDays(fromDateKey(date) as Date, 1));
    carryOver(date, next, [task.id]);
    toast({ message: `${formatDate(next)}로 미뤘어요`, tone: 'success' }, 2400);
  };

  return (
    <div className="@container flex flex-col gap-2" data-testid="day-checklist">
      <div className="flex items-center gap-3">
        <div className="flex-none text-base font-bold whitespace-nowrap">할 일</div>
        {items.length ? (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-bg-muted">
              <div className="h-full rounded-full bg-status-done transition-[width]" style={{ width: `${(doneCount / items.length) * 100}%` }} />
            </div>
            <div className="text-xs font-semibold text-text-muted tabular-nums" data-testid="day-progress">
              {doneCount}/{items.length}
            </div>
          </div>
        ) : null}
        <div className="ml-auto hidden text-[0.7rem] whitespace-nowrap text-text-muted @lg:block">적으면 상태 관리에도 생겨요</div>
      </div>

      {pendingFrom ? (
        <button
          type="button"
          onClick={() => {
            const n = carryOver(pendingFrom.key, date);
            toast({ message: `${n}개를 오늘로 가져왔어요`, tone: 'success' }, 2400);
          }}
          data-testid="carry-over"
          className="anim-rise flex items-center gap-2.5 rounded-xl border border-dashed border-warn/40 bg-warn-soft px-3.5 py-2.5 text-left text-sm text-warn hover:brightness-[0.98]"
        >
          <History className="size-4 flex-none" />
          <div className="min-w-0 flex-1">
            {formatDate(pendingFrom.key)}에 못 끝낸 {pendingFrom.count}개
          </div>
          <div className="flex-none font-semibold">오늘로 가져오기</div>
        </button>
      ) : null}

      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col">
            {items.map((task) => (
              <DayTaskRow
                key={task.id}
                task={task}
                issueCount={issueCount(task.id)}
                autoFocus={focusId === task.id}
                onFocused={() => setFocusId(null)}
                onToggle={() => toggleDone(task.id)}
                onTitle={(title) => updateTask(task.id, { title })}
                onEnter={() => setFocusId(addDayTask(date, '', { after: task.id }))}
                onRemoveEmpty={() => removeEmpty(task)}
                onBlank={() => deleteTask(task.id)}
                onDelete={() => announceDelete('삭제했어요', deleteTask(task.id))}
                onPostpone={() => postpone(task)}
                onUnplan={() => {
                  planTask(task.id, null);
                  toast({ message: '체크리스트에서 뺐어요 — 상태 관리에는 남아 있어요' }, 2600);
                }}
                onIssue={() => onIssue(task.id)}
                onShowIssues={() => onShowIssues(task.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex min-h-10 items-center gap-1.5 rounded-lg pr-1 pl-[1.625rem] text-text-muted focus-within:text-text-primary">
        <Plus className="size-[1.15rem] flex-none" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submitDraft();
            }
          }}
          onPaste={onPaste}
          placeholder={items.length ? '할 일 추가' : '할 일을 적고 Enter — 여러 줄을 붙여넣으면 한꺼번에'}
          aria-label="할 일 추가"
          data-testid="day-add"
          className="h-9 min-w-0 flex-1 bg-transparent px-1.5 text-[0.95rem] outline-none placeholder:text-text-muted"
        />
      </div>
    </div>
  );
}
