/** YYYY-MM-DD — toISOString()은 UTC라 KST에서 하루 밀린다. 로컬 기준으로 만든다. */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayInput(): string {
  return toDateInput(new Date());
}

/** 'YYYY-MM-DD' → '8월 21일 (목)' */
export function formatDateKo(value: string): string {
  if (!value) return '';
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return value;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const date = new Date(y, m - 1, d);
  return `${m}월 ${d}일 (${days[date.getDay()]})`;
}

/** 오늘 기준 남은 일수 (음수면 지남) */
export function daysFromToday(value: string): number | null {
  if (!value) return null;
  const target = new Date(`${value}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** 오늘로부터 n일 뒤 (YYYY-MM-DD) */
export function daysFromTodayInput(days: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return toDateInput(d);
}

/** 마감까지 남은 기간을 사람이 읽는 말로 — '오늘', '내일', '3일 지남' */
export function dueLabel(value: string): string {
  const diff = daysFromToday(value);
  if (diff === null) return formatDateKo(value);
  if (diff === 0) return '오늘';
  if (diff === 1) return '내일';
  if (diff < 0) return `${Math.abs(diff)}일 지남`;
  return formatDateKo(value);
}
