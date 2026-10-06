import { fetchData, saveData, subscribeRevisions } from '@/api/command';
import { CLIENT_ID } from '@/api/config';
import { ApiRequestError } from '@/api/errors';
import type { RemoteData } from '@/api/types';
import { useSyncStore } from '@/stores/syncStore';
import { useTaskStore } from '@/stores/taskStore';
import type { AppData } from '@/types/task';
import { mergeData, purgeTombstones } from '@/utils/merge';
import { normalizeData } from '@/utils/task';

/**
 * 저장 흐름
 *   변경 → localStorage 캐시(즉시) → 서버 PUT(0.6초 뒤)
 *   서버가 409(다른 탭/기기가 먼저 저장) → 받은 데이터와 병합 → 다시 저장
 *   서버에 못 닿으면 캐시에만 두고, 다시 연결되면 병합 후 저장
 *   다른 곳에서 저장되면 SSE 로 알림 → 받아서 병합
 */

const CACHE_KEY = 'kluztd:v2:cache';
const SAVE_DELAY = 600;
const RETRY_DELAY = 5_000;

/** tab: 이 캐시를 마지막으로 쓴 탭 */
type Cache = { rev: number; dirty: boolean; data: AppData; tab?: string };

let rev = 0;
let savedSeq = 0;
let saving = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let cacheTimer: ReturnType<typeof setTimeout> | null = null;
let started = false;

const status = (patch: Parameters<ReturnType<typeof useSyncStore.getState>['set']>[0]) =>
  useSyncStore.getState().set(patch);

function snapshot(): AppData {
  const { tasks, projects, days, scratch, scratchUpdatedAt, tombstones } = useTaskStore.getState();
  return { tasks, projects, days, scratch, scratchUpdatedAt, tombstones };
}

const isDirty = () => useTaskStore.getState().changeSeq !== savedSeq;

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cache;
    return { rev: Number(parsed.rev) || 0, dirty: Boolean(parsed.dirty), data: normalizeData(parsed.data), tab: parsed.tab };
  } catch {
    return null;
  }
}

function writeCache() {
  try {
    let data = snapshot();
    let dirty = isDirty();
    // 탭 여러 개 + 오프라인: 다른 탭이 서버에 못 보낸 변경을 남겨 뒀으면 지우지 말고 합친다
    const prev = readCache();
    if (prev && prev.dirty && prev.tab && prev.tab !== CLIENT_ID) {
      data = mergeData(prev.data, data);
      dirty = true;
    }
    const cache: Cache = { rev, dirty, data, tab: CLIENT_ID };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* 저장 공간이 없거나 막힌 브라우저 — 서버 저장은 계속된다 */
  }
}

function scheduleCache() {
  if (cacheTimer) clearTimeout(cacheTimer);
  cacheTimer = setTimeout(writeCache, 250);
}

function scheduleSave(delay = SAVE_DELAY) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    void save();
  }, delay);
}

/** 서버 데이터를 현재 상태에 합쳐 반영 */
function absorb(remote: RemoteData) {
  const remoteData = normalizeData(remote);
  const merged = isDirty() ? mergeData(remoteData, snapshot()) : remoteData;
  rev = remote.rev;
  useTaskStore.getState().replaceData(merged);
  scheduleCache();
}

/**
 * 서버에 저장. 동시에 하나만 돈다 (saving 플래그).
 * 409 면 서버 데이터를 흡수하고 같은 호출 안에서 다시 시도한다 (최대 3번).
 */
async function save(): Promise<void> {
  if (saving) {
    scheduleSave();
    return;
  }
  if (!isDirty()) return;
  saving = true;
  status({ status: 'saving', message: null });
  try {
    for (let attempt = 0; ; attempt++) {
      const seq = useTaskStore.getState().changeSeq;
      try {
        const res = await saveData({ ...purgeTombstones(snapshot()), baseRev: rev });
        rev = res.rev;
        savedSeq = seq;
        status({ status: 'saved', lastSavedAt: res.savedAt, localOnly: false, message: null });
        writeCache();
        return;
      } catch (err) {
        if (err instanceof ApiRequestError && err.status === 409 && attempt < 3) {
          absorb(err.body as RemoteData);
          continue;
        }
        throw err;
      }
    }
  } catch (err) {
    const offline = !(err instanceof ApiRequestError) || err.status === 0;
    status({
      status: offline ? 'offline' : 'error',
      message: offline ? '서버에 연결할 수 없어 이 기기에 보관 중' : err instanceof Error ? err.message : '저장 실패',
    });
    writeCache();
    scheduleSave(RETRY_DELAY);
  } finally {
    saving = false;
    // 저장하는 동안 또 바뀌었으면 이어서
    if (isDirty() && !saveTimer) scheduleSave();
  }
}

/** 다른 곳에서 바뀐 내용을 가져온다 */
async function pull() {
  try {
    const remote = await fetchData();
    if (remote.rev !== rev) absorb(remote);
    if (isDirty()) scheduleSave(0);
    else status({ status: 'saved', localOnly: false, message: null });
  } catch {
    /* 연결이 안 되면 다음 기회에 */
  }
}

export async function startSync(): Promise<void> {
  if (started) return;
  started = true;

  const cache = readCache();
  if (cache) {
    rev = cache.rev;
    useTaskStore.getState().replaceData(cache.data);
    // 캐시에 서버로 못 보낸 변경이 있으면 '저장 안 됨' 상태로 시작
    savedSeq = cache.dirty ? -1 : useTaskStore.getState().changeSeq;
  }

  try {
    const remote = await fetchData();
    absorb(remote);
    status({ status: 'saved', lastSavedAt: remote.savedAt, localOnly: false });
    if (isDirty()) scheduleSave(0);
  } catch {
    status({ status: 'offline', localOnly: true, message: '서버에 연결할 수 없어 이 기기에 보관 중' });
  }

  useTaskStore.subscribe((state, prev) => {
    if (state.changeSeq === prev.changeSeq) return;
    scheduleCache();
    scheduleSave();
  });

  subscribeRevisions((serverRev) => {
    if (serverRev !== rev) void pull();
  });

  window.addEventListener('online', () => void pull());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void pull();
    else writeCache();
  });
  window.addEventListener('pagehide', writeCache);
}
