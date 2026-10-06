import { CLIENT_ID } from '@/api/config';
import { ApiRequestError } from '@/api/errors';

/** 데이터 API 전용 fetch 래퍼 — 페이지·스토어는 이걸 직접 쓰지 말고 command 를 쓴다 */
export async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-KluZTD-Client': CLIENT_ID, ...init.headers },
    });
  } catch {
    throw new ApiRequestError(0, '서버에 연결할 수 없습니다');
  }
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body ? String((body as { error: unknown }).error) : `요청 실패 (${res.status})`;
    throw new ApiRequestError(res.status, message, body);
  }
  return body as T;
}
