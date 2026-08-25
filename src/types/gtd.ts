/**
 * KluZTD 도메인 타입.
 * 정통 GTD를 그대로 옮기지 않고 필요한 만큼만 쓴다 — 리스트·필드는 자유롭게 늘리거나 뺀다.
 */

/** 항목이 머무는 리스트 (= 화면 좌측 내비게이션 단위) */
export type ListId =
  | 'inbox'
  | 'next'
  | 'waiting'
  | 'scheduled'
  | 'someday'
  | 'reference'
  | 'done';

/** 실행 상황 태그 (@집, @회사 …). 문자열이라 자유롭게 추가 가능 */
export type ContextTag = string;

export type ListDef = {
  id: ListId;
  title: string;
  subtitle: string;
  /** index.css @theme 에 매핑된 색 토큰 이름 */
  accentToken: string;
};

export type Item = {
  id: string;
  title: string;
  note: string;
  list: ListId;
  /** 연결된 프로젝트 (없으면 단독 행동) */
  projectId: string | null;
  context: ContextTag;
  /** YYYY-MM-DD — scheduled/waiting 에서 주로 사용 */
  due: string;
  /** 대기 항목의 위임 대상 */
  waitingFor: string;
  done: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type ProjectStatus = 'active' | 'paused' | 'done';

export type Project = {
  id: string;
  name: string;
  /** 원하는 결과 (GTD outcome) */
  outcome: string;
  note: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  version: 1;
  items: Item[];
  projects: Project[];
  activeListId: ListId | null;
};
