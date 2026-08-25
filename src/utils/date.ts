/** YYYY-MM-DD */
export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
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
