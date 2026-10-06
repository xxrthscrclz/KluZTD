const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** Date → YYYY-MM-DD (로컬 기준 — toISOString()은 UTC라 KST에서 하루 밀린다) */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD → 로컬 자정 Date */
export function fromDateKey(key: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function startOfToday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** 오늘 기준 남은 일수 (음수 = 지남) */
export function daysUntil(key: string, now = new Date()): number | null {
  const target = fromDateKey(key);
  if (!target) return null;
  return Math.round((target.getTime() - startOfToday(now).getTime()) / 86_400_000);
}

/** '10월 3일 (금)' — 올해가 아니면 연도 포함 */
export function formatDate(key: string, now = new Date()): string {
  const date = fromDateKey(key);
  if (!date) return key;
  const base = `${date.getMonth() + 1}월 ${date.getDate()}일 (${WEEKDAYS[date.getDay()]})`;
  return date.getFullYear() === now.getFullYear() ? base : `${date.getFullYear()}년 ${base}`;
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later';

export function dueInfo(key: string, now = new Date()): { label: string; tone: DueTone; days: number } | null {
  const days = daysUntil(key, now);
  if (days === null) return null;
  if (days < 0) return { label: `${-days}일 지남`, tone: 'overdue', days };
  if (days === 0) return { label: '오늘', tone: 'today', days };
  if (days === 1) return { label: '내일', tone: 'soon', days };
  if (days <= 3) return { label: `D-${days}`, tone: 'soon', days };
  return { label: formatDate(key, now), tone: 'later', days };
}

/** ISO → '10월 1일 (수) 14:05' */
export function formatDateTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${formatDate(toDateKey(date), now)} ${hh}:${mm}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** 기록 피드의 날짜 머리말 — '오늘', '어제', '9월 29일 (월)' */
export function dayHeading(key: string, now = new Date()): string {
  const days = daysUntil(key, now);
  if (days === 0) return '오늘';
  if (days === -1) return '어제';
  return formatDate(key, now);
}

/**
 * 다음 target 요일. includeToday 면 오늘이 그 요일일 때 오늘.
 * 예) 금요일에 nextWeekday(5, now, true) → 오늘, nextWeekday(1) → 다음 주 월요일
 */
export function nextWeekday(target: number, now = new Date(), includeToday = false): Date {
  const today = startOfToday(now);
  let diff = (target - today.getDay() + 7) % 7;
  if (diff === 0 && !includeToday) diff = 7;
  return addDays(today, diff);
}

/** 달력 6주 x 7일 칸 (일요일 시작) */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export { WEEKDAYS };

/** 오늘 날짜 키 (로컬) */
export function todayIsoKey(): string {
  return toDateKey(new Date());
}
