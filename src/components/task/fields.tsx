import { CalendarPlus, FolderPlus, ListChecks, UserRoundPlus } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar, DueChip, PriorityIcon, ProjectChip, StatusDot } from '@/components/ui/Badges';
import Combobox from '@/components/ui/Combobox';
import DatePicker from '@/components/ui/DatePicker';
import ProjectPicker from '@/components/ui/ProjectPicker';
import Select, { type SelectOption } from '@/components/ui/Select';
import { PRIORITY, PRIORITY_ORDER, STATUS, STATUS_ORDER } from '@/constants/status';
import { useTaskStore } from '@/stores/taskStore';
import type { Priority, Status, Task } from '@/types/task';
import { formatDate, todayIsoKey } from '@/utils/date';
import { knownDelegates } from '@/utils/task';

/** 할 일 속성 편집 컨트롤 — 분류 목록과 상세 패널이 같이 쓴다 */

export const STATUS_OPTIONS: SelectOption<Status>[] = STATUS_ORDER.map((s) => ({
  value: s,
  label: STATUS[s].label,
  hint: STATUS[s].hint,
  icon: <StatusDot status={s} />,
}));

type PriorityValue = Priority | 'none';

export const PRIORITY_OPTIONS: SelectOption<PriorityValue>[] = [
  ...PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY[p].label, icon: <PriorityIcon priority={p} /> })),
  { value: 'none', label: '없음', icon: <PriorityIcon priority={null} /> },
];

export function StatusField({ task, variant = 'ghost' }: { task: Task; variant?: 'ghost' | 'field' }) {
  const moveTask = useTaskStore((s) => s.moveTask);
  return (
    <Select
      value={task.status}
      options={STATUS_OPTIONS}
      onChange={(v) => moveTask(task.id, v)}
      label="상태"
      variant={variant}
      testId="field-status"
    />
  );
}

export function PriorityField({ task, variant = 'ghost' }: { task: Task; variant?: 'ghost' | 'field' }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  return (
    <Select
      value={task.priority ?? 'none'}
      options={PRIORITY_OPTIONS}
      onChange={(v) => updateTask(task.id, { priority: v === 'none' ? null : v })}
      label="우선순위"
      variant={variant}
      testId="field-priority"
      renderValue={(opt) =>
        task.priority ? (
          <div className="flex items-center gap-2">
            {opt?.icon}
            <div>{opt?.label}</div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-text-muted">
            <PriorityIcon priority={null} />
            <div>비어 있음</div>
          </div>
        )
      }
    />
  );
}

/** 마감일 — chip 은 분류 목록용 작은 트리거 */
export function DueField({ task, chip = false }: { task: Task; chip?: boolean }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  return (
    <DatePicker
      value={task.due}
      onChange={(due) => updateTask(task.id, { due })}
      testId="field-due"
      triggerClassName={chip ? 'h-8 rounded-lg px-2 hover:bg-bg-hover' : 'h-8 w-full rounded-lg px-2 text-sm hover:bg-bg-hover'}
      renderTrigger={(value) =>
        value ? (
          <DueChip due={value} done={task.status === 'done'} />
        ) : (
          <div className="flex items-center gap-1.5 text-[0.8rem] text-text-muted">
            <CalendarPlus className="size-4" />
            <div>{chip ? '마감' : '비어 있음'}</div>
          </div>
        )
      }
    />
  );
}

export function DelegateField({ task, chip = false }: { task: Task; chip?: boolean }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const tasks = useTaskStore((s) => s.tasks);
  const suggestions = useMemo(() => knownDelegates(tasks), [tasks]);
  return (
    <Combobox
      value={task.delegate}
      suggestions={suggestions}
      onChange={(delegate) => updateTask(task.id, { delegate })}
      testId="field-delegate"
      triggerClassName={chip ? 'h-8 max-w-[10rem] rounded-lg px-2 hover:bg-bg-hover' : 'h-8 w-full rounded-lg px-2 text-sm hover:bg-bg-hover'}
      renderTrigger={(value) =>
        value ? (
          <div className="flex min-w-0 items-center gap-1.5 text-[0.82rem]">
            <Avatar name={value} />
            <div className="truncate font-medium">{value}</div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[0.8rem] text-text-muted">
            <UserRoundPlus className="size-4" />
            <div>{chip ? '담당자' : '비어 있음'}</div>
          </div>
        )
      }
    />
  );
}

/** 프로젝트 — chip 은 체크리스트 줄용 작은 트리거 */
export function ProjectField({ task, chip = false }: { task: Task; chip?: boolean }) {
  const updateTask = useTaskStore((s) => s.updateTask);
  const projects = useTaskStore((s) => s.projects);
  const project = projects.find((p) => p.id === task.projectId) ?? null;
  return (
    <ProjectPicker
      value={task.projectId}
      onChange={(projectId) => updateTask(task.id, { projectId })}
      testId="field-project"
      triggerClassName={chip ? 'h-8 max-w-[11rem] rounded-lg px-1.5 hover:bg-bg-hover' : 'h-8 w-full rounded-lg px-2 text-sm hover:bg-bg-hover'}
      renderTrigger={() =>
        project ? (
          <ProjectChip name={project.name} color={project.color} />
        ) : (
          <div className="flex items-center gap-1.5 text-[0.8rem] text-text-muted">
            <FolderPlus className="size-4" />
            <div>{chip ? '프로젝트' : '비어 있음'}</div>
          </div>
        )
      }
    />
  );
}

/** 체크리스트에 올린 날짜 — 비우면 상태 관리에만 남는다 */
export function PlannedField({ task }: { task: Task }) {
  const planTask = useTaskStore((s) => s.planTask);
  return (
    <DatePicker
      value={task.plannedOn}
      onChange={(date) => planTask(task.id, date)}
      label="체크리스트"
      testId="field-planned"
      triggerClassName="h-8 w-full rounded-lg px-2 text-sm hover:bg-bg-hover"
      renderTrigger={(value) =>
        value ? (
          <div className="flex items-center gap-1.5">
            <ListChecks className="size-4 text-text-muted" />
            <div>{formatDate(value)}</div>
            {value === todayIsoKey() ? <div className="rounded bg-accent-soft px-1 text-[0.68rem] font-bold text-accent-ink">오늘</div> : null}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[0.8rem] text-text-muted">
            <ListChecks className="size-4" />
            <div>체크리스트에 없음</div>
          </div>
        )
      }
    />
  );
}
