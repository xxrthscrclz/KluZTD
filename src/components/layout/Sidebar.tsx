import { useRef } from 'react';

import BrandLogo from '@/components/ui/BrandLogo';
import Button from '@/components/ui/Button';
import { LISTS } from '@/constants/lists';
import { useGtdStore } from '@/stores/gtdStore';
import { useThemeStore } from '@/stores/themeStore';
import type { Item, Project } from '@/types/gtd';
import { countByList, countOpenInProject } from '@/utils/item';

export default function Sidebar() {
  const items = useGtdStore((s) => s.items);
  const projects = useGtdStore((s) => s.projects);
  const activeListId = useGtdStore((s) => s.activeListId);
  const activeProjectId = useGtdStore((s) => s.activeProjectId);
  const setActiveListId = useGtdStore((s) => s.setActiveListId);
  const setActiveProjectId = useGtdStore((s) => s.setActiveProjectId);
  const createProject = useGtdStore((s) => s.createProject);
  const exportPayload = useGtdStore((s) => s.exportPayload);
  const replaceAll = useGtdStore((s) => s.replaceAll);
  const storagePath = useGtdStore((s) => s.storagePath);
  const storageError = useGtdStore((s) => s.storageError);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportPayload(), null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kluztd-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        version: number;
        items: Item[];
        projects?: Project[];
        activeListId: Item['list'] | null;
      };
      if (parsed.version !== 1 || !Array.isArray(parsed.items)) {
        throw new Error('올바른 KluZTD JSON이 아닙니다.');
      }
      if (!confirm('현재 데이터를 가져온 파일로 교체할까요?')) return;
      replaceAll({
        items: parsed.items,
        projects: parsed.projects ?? [],
        activeListId: parsed.activeListId ?? null,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : '가져오기에 실패했습니다.');
    }
  };

  return (
    <aside className="sticky top-0 flex h-screen flex-col gap-5 overflow-y-auto border-r border-border-default bg-bg-surface/75 px-4 py-6 backdrop-blur-xl md:w-[292px]">
      <div className="px-0.5">
        <BrandLogo size="md" />
      </div>

      <div className="px-1 text-[0.68rem] font-extrabold tracking-[0.12em] text-text-muted uppercase">
        리스트
      </div>

      <div className="flex flex-col gap-1.5">
        {LISTS.map((list) => {
          const active = activeProjectId === null && list.id === activeListId;
          const count = countByList(items, list.id);
          return (
            <button
              key={list.id}
              type="button"
              onClick={() => setActiveListId(list.id)}
              className={`motion-pop flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-left ${
                list.virtual ? 'mb-2' : ''
              } ${
                active
                  ? 'border-accent/30 bg-gradient-to-br from-bg-accent-soft to-white shadow-[0_8px_22px_rgba(29,111,232,0.14)] dark:to-bg-surface'
                  : 'border-transparent hover:border-sky/25 hover:bg-sky/10'
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-text-primary">{list.title}</div>
                <div className="mt-0.5 truncate text-[0.72rem] font-medium text-text-muted">
                  {list.subtitle}
                </div>
              </div>
              <div
                className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold tabular-nums ${
                  count > 0 ? 'bg-bg-accent-soft text-accent-ink' : 'text-text-muted'
                }`}
              >
                {count}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <div className="text-[0.68rem] font-extrabold tracking-[0.12em] text-text-muted uppercase">
            프로젝트
          </div>
          <button
            type="button"
            onClick={() => {
              const project = createProject();
              setActiveProjectId(project.id);
            }}
            className="motion-pop rounded-lg px-1.5 py-0.5 text-xs font-extrabold text-text-muted hover:text-accent-ink"
          >
            + 새로
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="px-1 text-[0.7rem] leading-snug font-medium text-text-muted">
            결과가 나오려면 두 단계 이상 필요한 일은 프로젝트로 묶으세요.
          </div>
        ) : (
          projects.map((project) => {
            const active = project.id === activeProjectId;
            const open = countOpenInProject(items, project.id);
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setActiveProjectId(project.id)}
                className={`motion-pop flex items-center gap-2 rounded-2xl border px-3 py-2 text-left ${
                  active
                    ? 'border-accent/30 bg-bg-accent-soft'
                    : 'border-transparent hover:border-sky/25 hover:bg-sky/10'
                }`}
              >
                <div
                  className={`min-w-0 flex-1 truncate text-sm font-bold ${
                    project.status === 'done' ? 'text-text-muted line-through' : 'text-text-primary'
                  }`}
                >
                  {project.name}
                </div>
                <div
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold tabular-nums ${
                    open > 0 ? 'bg-bg-accent-soft text-accent-ink' : 'text-text-muted'
                  }`}
                >
                  {open}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border-default pt-3">
        <div className="px-1 text-[0.68rem] leading-snug font-medium text-text-muted">
          저장 파일
          <div className="mt-0.5 break-all font-bold text-accent">{storagePath}</div>
          {storageError ? (
            <div className="mt-1 font-bold text-danger">{storageError}</div>
          ) : (
            <div className="mt-0.5">변경 시 자동 저장</div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === 'light' ? '다크' : '라이트'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
            Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </aside>
  );
}
