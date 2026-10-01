import type { ListDef, ListId } from '@/types/gtd';

/** 좌측 내비게이션 순서 = 이 배열 순서. 리스트를 바꾸려면 여기만 고친다. */
export const LISTS: ListDef[] = [
  {
    id: 'focus',
    title: '지금 할 일',
    subtitle: '먼저 해야 하는 순서대로',
    accentToken: 'danger',
    virtual: true,
  },
  { id: 'inbox', title: '수집함', subtitle: '일단 다 던져 넣는 곳', accentToken: 'phase-kickoff' },
  { id: 'next', title: '다음 행동', subtitle: '바로 할 수 있는 것', accentToken: 'accent' },
  { id: 'waiting', title: '대기', subtitle: '남에게 넘긴 것', accentToken: 'warn' },
  { id: 'scheduled', title: '일정', subtitle: '날짜가 정해진 것', accentToken: 'phase-during' },
  { id: 'someday', title: '언젠가', subtitle: '지금은 아닌 것', accentToken: 'text-muted' },
  { id: 'reference', title: '참고', subtitle: '행동은 아니고 자료', accentToken: 'sky' },
  { id: 'done', title: '완료', subtitle: '끝낸 것', accentToken: 'phase-post' },
];

export const DEFAULT_LIST_ID: ListId = 'focus';

/** 항목을 옮길 수 있는 리스트 (계산된 뷰·완료 제외) */
export const MOVABLE_LISTS: ListDef[] = LISTS.filter((l) => !l.virtual && l.id !== 'done');

export function findList(id: ListId): ListDef | undefined {
  return LISTS.find((l) => l.id === id);
}

/** 실행 상황 태그 기본값 — 자유롭게 수정 */
export const CONTEXTS: string[] = ['@집', '@회사', '@외출', '@연락', '@컴퓨터'];
