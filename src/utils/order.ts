const GAP = 1024;

/**
 * prev 와 next 사이에 들어갈 정렬값. 둘 다 없으면 0.
 * 실수 사이에 계속 끼워 넣어도 2^-40 정도까지는 충분히 버틴다.
 */
export function orderBetween(prev: number | undefined, next: number | undefined): number {
  if (prev === undefined && next === undefined) return 0;
  if (prev === undefined) return (next as number) - GAP;
  if (next === undefined) return prev + GAP;
  return (prev + next) / 2;
}
