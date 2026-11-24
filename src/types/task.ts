import type { JSONContent } from '@tiptap/core';

/** 노션식 에디터 문서 (TipTap JSON) */
export type Doc = JSONContent;

/** 상태: 진행 예정 · 진행 중 · 진행 완료 · 대기 */
export type Status = 'todo' | 'doing' | 'waiting' | 'done';
export type BoardStatus = Status;

export type Priority = 'high' | 'normal' | 'low';

/**
 * 이슈 — 날짜(그날 페이지)에 속하고, 할 일에 연결할 수 있다.
 * 연결된 이슈는 일일 관리·할 일 상세·카드·프로젝트 어디서나 같은 것으로 보인다.
 */
export type Issue = {
  id: string;
  doc: Doc;
  resolved: boolean;
  /** 연결된 할 일 (없으면 그날 전체에 대한 기록) */
  taskId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  at: string;
  from: Status;
  to: Status;
};

/**
 * 할 일 — 체크리스트 줄과 상태 관리 카드는 같은 것이다.
 * plannedOn 이 있으면 그날 체크리스트에 보이고, 언제나 상태 관리에도 보인다.
 */
export type Task = {
  id: string;
  title: string;
  status: Status;
  priority: Priority | null;
  /** 상태 관리 칸 안에서의 정렬값 (작을수록 위) */
  order: number;
  /** 체크리스트에 올린 날짜 (YYYY-MM-DD) — 없으면 상태 관리에만 */
  plannedOn: string | null;
  /** 그날 체크리스트 안에서의 정렬값 */
  dayOrder: number;
  /** 마감일 (YYYY-MM-DD) */
  due: string | null;
  /** 담당자 (위임 대상) */
  delegate: string | null;
  projectId: string | null;
  /** 프로젝트 Next Action 에서 끌어서 정한 순서 (없으면 마감일 순) */
  projectOrder: number | null;
  note: Doc | null;
  activity: Activity[];
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

/** 프로젝트 — 할 일들을 묶는 상위 단위 */
export type Project = {
  id: string;
  name: string;
  /** 색 번호 1~6 (avatar 토큰) */
  color: number;
  createdAt: string;
  updatedAt: string;
};

/** 하루치: 그날 이슈 (체크리스트는 Task.plannedOn 으로) */
export type DayEntry = {
  issues: Issue[];
};

/** 수첩 한 장 — 자유공간처럼 자유롭게 쓰는 페이지 */
export type Note = {
  id: string;
  title: string;
  doc: Doc | null;
  createdAt: string;
  updatedAt: string;
};

/** data/kluztd.json 의 내용 */
export type AppData = {
  tasks: Task[];
  projects: Project[];
  /** 키: YYYY-MM-DD */
  days: Record<string, DayEntry>;
  /** 날짜와 상관없는 자유공간 (어느 화면에서나 오른쪽 책갈피) */
  scratch: Doc | null;
  scratchUpdatedAt: string;
  /** 수첩 페이지들 */
  notes: Note[];
  /**
   * 지운 것의 id → 지운 시각. 내용은 바로 지우고 id 만 남겨서
   * 다른 탭/기기의 오래된 사본과 병합할 때 되살아나지 않게 한다 (30일 뒤 정리).
   */
  tombstones: Record<string, string>;
};
