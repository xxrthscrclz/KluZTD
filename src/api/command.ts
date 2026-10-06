import { request } from '@/api/client';
import { API_BASE, CLIENT_ID } from '@/api/config';
import type { RemoteData, RevEvent, SaveRequest, SaveResponse } from '@/api/types';

export function fetchData(): Promise<RemoteData> {
  return request<RemoteData>(API_BASE);
}

/** baseRev 가 서버와 다르면 ApiRequestError(409, body = 서버의 현재 데이터) */
export function saveData(payload: SaveRequest): Promise<SaveResponse> {
  return request<SaveResponse>(API_BASE, { method: 'PUT', body: JSON.stringify(payload) });
}

/** 다른 탭/기기에서 저장되면 알려 준다. 반환값으로 구독 해제 */
export function subscribeRevisions(onRev: (rev: number) => void): () => void {
  if (typeof EventSource === 'undefined') return () => {};
  const source = new EventSource(`${API_BASE}/events`);
  source.addEventListener('rev', (e) => {
    try {
      const data = JSON.parse((e as MessageEvent<string>).data) as RevEvent;
      if (data.clientId !== CLIENT_ID) onRev(data.rev);
    } catch {
      /* 형식이 틀린 이벤트는 무시 */
    }
  });
  return () => source.close();
}
