/** 데이터 API 는 같은 오리진의 Vite 서버(dev/preview)가 제공한다 */
export const API_BASE = './api/kluztd';

/** 이 탭을 구분하는 값 — 내가 저장해서 생긴 SSE 이벤트는 무시하려고 쓴다 */
export const CLIENT_ID = crypto.randomUUID();
