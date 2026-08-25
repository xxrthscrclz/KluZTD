import type { Item, ListId, Project } from '@/types/gtd';

export const KLUZTD_DATA_RELATIVE = 'data/kluztd.json';

export type KluZTDFileData = {
  version: 1;
  items: Item[];
  projects: Project[];
  activeListId: ListId | null;
  /** 서버가 알려주는 절대 경로 */
  filePath?: string;
  relativePath?: string;
};

const API = '/api/kluztd';

export async function loadKluZTDFile(): Promise<KluZTDFileData> {
  const res = await fetch(API);
  if (!res.ok) {
    throw new Error(`데이터 파일을 읽지 못했습니다 (${res.status})`);
  }
  const data = (await res.json()) as KluZTDFileData;
  return {
    version: 1,
    items: Array.isArray(data.items) ? data.items : [],
    projects: Array.isArray(data.projects) ? data.projects : [],
    activeListId: data.activeListId ?? null,
    filePath: data.filePath,
    relativePath: data.relativePath ?? KLUZTD_DATA_RELATIVE,
  };
}

export async function saveKluZTDFile(payload: {
  items: Item[];
  projects: Project[];
  activeListId: ListId | null;
}): Promise<{ filePath?: string; relativePath?: string }> {
  const res = await fetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      version: 1,
      items: payload.items,
      projects: payload.projects,
      activeListId: payload.activeListId,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `데이터 파일 저장 실패 (${res.status})`);
  }
  return (await res.json()) as { filePath?: string; relativePath?: string };
}
