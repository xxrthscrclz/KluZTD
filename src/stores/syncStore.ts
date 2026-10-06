import { create } from 'zustand';

export type SyncStatus = 'loading' | 'saved' | 'saving' | 'offline' | 'error';

type SyncState = {
  status: SyncStatus;
  message: string | null;
  lastSavedAt: string | null;
  /** 서버를 한 번도 못 만났으면 true — 이 기기에만 저장 중 */
  localOnly: boolean;
  set: (patch: Partial<Omit<SyncState, 'set'>>) => void;
};

export const useSyncStore = create<SyncState>((set) => ({
  status: 'loading',
  message: null,
  lastSavedAt: null,
  localOnly: false,
  set: (patch) => set(patch),
}));
