import type { Item, Priority } from '@/types/gtd';
import { daysFromToday, toDateInput, todayInput } from '@/utils/date';

/**
 * «지금 할 일» 순위 계산.
 * 무엇부터 할지 매번 고민하지 않도록, 열린 항목을 아래 기준으로 줄 세운다.
 *
 *   1. 마감이 지난 것 (오래 지날수록 위)
 *   2. 오늘 마감
 *   3. 오늘 하기로 찍은 것
 *   4. 답이 늦어진 대기 항목 (확인 필요) — 내 손으로 끝낼 일보다는 뒤
 *   5. 중요 표시
 *   6. 마감 임박 (내일 → 3일 → 7일)
 *   7. 나머지 다음 행동 — 오래 묵은 것이 조금씩 올라온다
 *
 * 숫자는 상대 순서만 의미가 있다. 기준을 바꾸려면 여기 가중치만 고친다.
 */

export type FocusReasonTone = 'danger' | 'warn' | 'accent' | 'muted';

export type FocusReason = {
  label: string;
  tone: FocusReasonTone;
};

export type FocusEntry = {
  item: Item;
  score: number;
  /** 오늘 안에 끝내야 하는 것 (지남·오늘 마감·오늘 하기·확인 필요) */
  mustToday: boolean;
  reasons: FocusReason[];
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: '중요',
  normal: '보통',
  low: '나중에',
};

/** 일정 리스트 항목은 이 일수 안으로 들어와야 «지금 할 일»에 보인다 */
const SCHEDULED_HORIZON_DAYS = 7;

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

export function isPinnedToday(item: Item, today = todayInput()): boolean {
  return item.todayPin === today;
}

/** 항목 하나의 순위 정보 — «지금 할 일»에 들어오지 않으면 null */
export function scoreItem(item: Item, today = todayInput()): FocusEntry | null {
  if (item.done) return null;
  if (item.list === 'someday' || item.list === 'reference' || item.list === 'inbox') {
    return null;
  }

  const diff = item.due ? daysFromToday(item.due) : null;
  const pinned = isPinnedToday(item, today);
  const reasons: FocusReason[] = [];
  let score = 0;
  let mustToday = false;

  if (item.list === 'waiting') {
    // 대기는 남이 할 일 — 날짜가 됐는데도 안 끝났을 때만 확인하러 끌어올린다
    if (!pinned && (diff === null || diff > 0)) return null;
    mustToday = true;
    reasons.push({
      label: item.waitingFor ? `${item.waitingFor}에게 확인` : '확인 필요',
      tone: 'warn',
    });
  } else if (item.list === 'scheduled') {
    if (!pinned && item.priority !== 'high' && (diff === null || diff > SCHEDULED_HORIZON_DAYS)) {
      return null;
    }
  } else {
    // next — 바로 할 수 있는 것
    score += 100;
  }

  if (item.list === 'waiting') {
    // 확인은 내 손으로 끝낼 일(지남·오늘 마감·오늘 하기) 다음 — 오래 늦어질수록 조금씩 위로
    score += 850 + (diff !== null && diff < 0 ? Math.min(Math.abs(diff), 30) : 0);
    if (diff !== null && diff < 0) {
      reasons.push({ label: `${Math.abs(diff)}일 늦음`, tone: 'danger' });
    }
  } else if (diff !== null) {
    if (diff < 0) {
      score += 1000 + Math.min(Math.abs(diff), 30) * 10;
      mustToday = true;
      reasons.push({ label: `${Math.abs(diff)}일 지남`, tone: 'danger' });
    } else if (diff === 0) {
      score += 900;
      mustToday = true;
      reasons.push({ label: '오늘 마감', tone: 'danger' });
    } else if (diff === 1) {
      score += 250;
      reasons.push({ label: '내일 마감', tone: 'warn' });
    } else if (diff <= 3) {
      score += 150;
      reasons.push({ label: `${diff}일 남음`, tone: 'warn' });
    } else if (diff <= SCHEDULED_HORIZON_DAYS) {
      score += 60;
      reasons.push({ label: `${diff}일 남음`, tone: 'muted' });
    }
  }

  if (pinned && item.list !== 'waiting') {
    score += 800;
    mustToday = true;
    reasons.push({ label: '오늘 하기', tone: 'accent' });
  }

  if (item.priority === 'high') {
    score += 300;
    reasons.push({ label: '중요', tone: 'accent' });
  } else if (item.priority === 'low') {
    score -= 80;
  }

  // 오래 묵은 일은 한 달까지 하루 1점씩 올라온다 (같은 조건끼리 순서를 가르는 정도)
  const age = daysSince(item.createdAt);
  score += Math.min(age, 30);
  if (reasons.length === 0 && age >= 14) {
    reasons.push({ label: `${age}일 묵음`, tone: 'muted' });
  }

  return { item, score, mustToday, reasons };
}

/** 먼저 해야 하는 순서로 정렬된 열린 항목들 */
export function rankFocus(items: Item[], today = todayInput()): FocusEntry[] {
  return items
    .map((item) => scoreItem(item, today))
    .filter((e): e is FocusEntry => e !== null)
    .sort((a, b) => b.score - a.score || a.item.createdAt.localeCompare(b.item.createdAt));
}

/** 오늘 끝낸 항목 수 */
export function countDoneToday(items: Item[], today = todayInput()): number {
  return items.filter(
    (i) => i.done && i.completedAt && toDateInput(new Date(i.completedAt)) === today,
  ).length;
}
