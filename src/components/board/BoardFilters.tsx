import { X } from 'lucide-react';
import { useMemo, useRef } from 'react';

import { PriorityIcon, PROJECT_DOTS } from '@/components/ui/Badges';
import SearchInput from '@/components/ui/SearchInput';
import Select, { type SelectOption } from '@/components/ui/Select';
import { PRIORITY, PRIORITY_ORDER } from '@/constants/status';
import { useHotkey } from '@/hooks/useHotkey';
import { useTaskStore } from '@/stores/taskStore';
import { useUiStore } from '@/stores/uiStore';
import type { Priority } from '@/types/task';
import { isFilterActive, knownDelegates, type DueFilter } from '@/utils/task';

const DUE_OPTIONS: SelectOption<DueFilter>[] = [
  { value: 'all', label: '마감일 전체' },
  { value: 'overdue', label: '마감 지남' },
  { value: 'today', label: '오늘' },
  { value: 'week', label: '7일 안' },
  { value: 'none', label: '마감일 없음' },
];

const PRIORITY_OPTIONS: SelectOption<Priority | 'all'>[] = [
  { value: 'all', label: '우선순위 전체' },
  ...PRIORITY_ORDER.map((p) => ({ value: p, label: PRIORITY[p].label, icon: <PriorityIcon priority={p} /> })),
];

export default function BoardFilters() {
  const filter = useUiStore((s) => s.boardFilter);
  const setFilter = useUiStore((s) => s.setBoardFilter);
  const reset = useUiStore((s) => s.resetBoardFilter);
  const tasks = useTaskStore((s) => s.tasks);
  const projects = useTaskStore((s) => s.projects);
  const searchRef = useRef<HTMLInputElement>(null);

  const delegateOptions = useMemo<SelectOption<string>[]>(
    () => [
      { value: 'all', label: '담당 전체' },
      { value: 'mine', label: '내가 하는 것', hint: '담당자 없는 일' },
      { value: 'others', label: '담당자 있는 것 전부' },
      ...knownDelegates(tasks).map((name) => ({ value: name, label: name, hint: '담당' })),
    ],
    [tasks],
  );

  const projectOptions = useMemo<SelectOption<string>[]>(
    () => [
      { value: 'all', label: '프로젝트 전체' },
      { value: 'none', label: '프로젝트 없음' },
      ...projects.map((p) => ({ value: p.id, label: p.name, icon: <div className={`size-2 rounded-full ${PROJECT_DOTS[p.color]}`} /> })),
    ],
    [projects],
  );

  useHotkey('/', (e) => {
    e.preventDefault();
    searchRef.current?.focus();
  });

  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      <SearchInput
        ref={searchRef}
        value={filter.query}
        onChange={(query) => setFilter({ query })}
        placeholder="제목·메모·이슈 검색  /"
        label="검색"
        testId="board-search"
        className="min-w-[10.5rem] flex-1 sm:min-w-[12rem] sm:max-w-xs"
      />
      <Select
        value={filter.project ?? 'all'}
        options={projectOptions}
        onChange={(project) => setFilter({ project })}
        label="프로젝트 필터"
        variant="chip"
        highlighted={(filter.project ?? 'all') !== 'all'}
      />
      <Select
        value={filter.priority}
        options={PRIORITY_OPTIONS}
        onChange={(priority) => setFilter({ priority })}
        label="우선순위 필터"
        variant="chip"
        highlighted={filter.priority !== 'all'}
      />
      <Select
        value={filter.delegate}
        options={delegateOptions}
        onChange={(delegate) => setFilter({ delegate })}
        label="담당 필터"
        variant="chip"
        highlighted={filter.delegate !== 'all'}
      />
      <Select
        value={filter.due}
        options={DUE_OPTIONS}
        onChange={(due) => setFilter({ due })}
        label="마감일 필터"
        variant="chip"
        highlighted={filter.due !== 'all'}
      />
      {isFilterActive(filter) ? (
        <button
          type="button"
          onClick={reset}
          className="flex h-8 items-center gap-1 rounded-full px-2.5 text-[0.8rem] font-semibold text-text-muted hover:bg-bg-hover hover:text-text-primary"
        >
          <X className="size-3.5" />
          초기화
        </button>
      ) : null}
    </div>
  );
}
