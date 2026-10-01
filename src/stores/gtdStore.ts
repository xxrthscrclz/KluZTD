import { create } from 'zustand';

import { loadKluZTDFile, saveKluZTDFile } from '@/api/kluztdData';
import { DEFAULT_LIST_ID } from '@/constants/lists';
import type { Item, ListId, Project } from '@/types/gtd';
import { todayInput } from '@/utils/date';
import { createEmptyItem, createEmptyProject } from '@/utils/item';

export type KluZTDPayload = {
  version: 1;
  items: Item[];
  projects: Project[];
  activeListId: ListId | null;
};

type GtdState = {
  ready: boolean;
  storagePath: string;
  storageError: string | null;
  items: Item[];
  projects: Project[];
  activeListId: ListId;
  /** 프로젝트 뷰를 보고 있으면 프로젝트 id, 리스트 뷰면 null */
  activeProjectId: string | null;
  hydrate: () => Promise<void>;
  setActiveListId: (id: ListId) => void;
  setActiveProjectId: (id: string | null) => void;
  /** 수집(capture) — 제목만 받아 수집함에 넣는다 */
  captureItem: (title: string, partial?: Partial<Item>) => void;
  updateItem: (id: string, patch: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  /** 정리(organize) — 항목을 다른 리스트로 옮긴다 */
  moveItem: (id: string, list: ListId) => void;
  toggleDone: (id: string) => void;
  /** «오늘 하기» 핀 켜기/끄기 */
  togglePinToday: (id: string) => void;
  /** 중요 표시 켜기/끄기 (high ↔ normal) */
  toggleHighPriority: (id: string) => void;
  createProject: (partial?: Partial<Project>) => Project;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  replaceAll: (payload: Omit<KluZTDPayload, 'version'>) => void;
  exportPayload: () => KluZTDPayload;
};

function touchItem(item: Item): Item {
  return { ...item, updatedAt: new Date().toISOString() };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let saving = false;
let pending = false;

async function flushSave(get: () => GtdState) {
  const state = get();
  if (!state.ready) return;
  saving = true;
  try {
    const result = await saveKluZTDFile({
      items: state.items,
      projects: state.projects,
      activeListId: state.activeListId,
    });
    useGtdStore.setState({
      storagePath: result.relativePath ?? result.filePath ?? state.storagePath,
      storageError: null,
    });
  } catch (err) {
    useGtdStore.setState({
      storageError: err instanceof Error ? err.message : '파일 저장 실패',
    });
  } finally {
    saving = false;
    if (pending) {
      pending = false;
      void flushSave(get);
    }
  }
}

function scheduleSave(get: () => GtdState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (saving) {
      pending = true;
      return;
    }
    void flushSave(get);
  }, 400);
}

export const useGtdStore = create<GtdState>((set, get) => ({
  ready: false,
  storagePath: 'data/kluztd.json',
  storageError: null,
  items: [],
  projects: [],
  activeListId: DEFAULT_LIST_ID,
  activeProjectId: null,

  hydrate: async () => {
    try {
      const file = await loadKluZTDFile();
      set({
        ready: true,
        items: file.items.map((i) => createEmptyItem(i)),
        projects: file.projects.map((p) => createEmptyProject(p)),
        // 일을 시작할 때는 항상 «지금 할 일»부터 본다
        activeListId: DEFAULT_LIST_ID,
        storagePath: file.relativePath ?? file.filePath ?? 'data/kluztd.json',
        storageError: null,
      });
    } catch (err) {
      set({
        ready: true,
        storageError:
          err instanceof Error
            ? err.message
            : 'data/kluztd.json 을 읽지 못했습니다. pnpm dev 로 실행하세요.',
      });
    }
  },

  setActiveListId: (id) => {
    set({ activeListId: id, activeProjectId: null });
    scheduleSave(get);
  },

  setActiveProjectId: (id) => {
    set({ activeProjectId: id });
  },

  captureItem: (title, partial = {}) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const item = createEmptyItem({ ...partial, title: trimmed });
    set((s) => ({ items: [item, ...s.items] }));
    scheduleSave(get);
  },

  updateItem: (id, patch) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id ? touchItem(createEmptyItem({ ...i, ...patch, id: i.id })) : i,
      ),
    }));
    scheduleSave(get);
  },

  deleteItem: (id) => {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
    scheduleSave(get);
  },

  moveItem: (id, list) => {
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? touchItem({ ...i, list }) : i)),
    }));
    scheduleSave(get);
  },

  toggleDone: (id) => {
    const now = new Date().toISOString();
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id
          ? touchItem({ ...i, done: !i.done, completedAt: i.done ? null : now })
          : i,
      ),
    }));
    scheduleSave(get);
  },

  togglePinToday: (id) => {
    const today = todayInput();
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id ? touchItem({ ...i, todayPin: i.todayPin === today ? '' : today }) : i,
      ),
    }));
    scheduleSave(get);
  },

  toggleHighPriority: (id) => {
    set((s) => ({
      items: s.items.map((i) =>
        i.id === id
          ? touchItem({ ...i, priority: i.priority === 'high' ? 'normal' : 'high' })
          : i,
      ),
    }));
    scheduleSave(get);
  },

  createProject: (partial = {}) => {
    const project = createEmptyProject({
      ...partial,
      name: (partial.name ?? '').trim() || '새 프로젝트',
    });
    set((s) => ({ projects: [...s.projects, project] }));
    scheduleSave(get);
    return project;
  },

  updateProject: (id, patch) => {
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? createEmptyProject({
              ...p,
              ...patch,
              id: p.id,
              updatedAt: new Date().toISOString(),
            })
          : p,
      ),
    }));
    scheduleSave(get);
  },

  deleteProject: (id) => {
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      // 프로젝트가 사라지면 연결된 항목은 단독 행동으로 남긴다
      items: s.items.map((i) => (i.projectId === id ? { ...i, projectId: null } : i)),
      activeProjectId: s.activeProjectId === id ? null : s.activeProjectId,
    }));
    scheduleSave(get);
  },

  replaceAll: ({ items, projects, activeListId }) => {
    set({
      items: items.map((i) => createEmptyItem(i)),
      projects: projects.map((p) => createEmptyProject(p)),
      activeListId: activeListId ?? DEFAULT_LIST_ID,
      activeProjectId: null,
    });
    scheduleSave(get);
  },

  exportPayload: () => {
    const { items, projects, activeListId } = get();
    return { version: 1 as const, items, projects, activeListId };
  },
}));

// 파생 목록은 컴포넌트에서 useMemo + utils/item 의 itemsInList 로 계산한다.
// 셀렉터가 새 배열을 반환하면 zustand v5 에서 무한 리렌더가 발생한다.
