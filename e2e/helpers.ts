import { expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const DATA_FILE = path.resolve(import.meta.dirname, '.data/kluztd.e2e.json');
export const SHOTS = path.resolve(import.meta.dirname, '.shots');

type SeedTask = {
  id?: string;
  title: string;
  status?: 'todo' | 'doing' | 'waiting' | 'done';
  priority?: 'high' | 'normal' | 'low' | null;
  order?: number;
  due?: string | null;
  delegate?: string | null;
  note?: unknown;
  issues?: { id?: string; text: string; resolved?: boolean; createdAt?: string }[];
  completedAt?: string | null;
  /** 체크리스트에 올린 날 */
  plannedOn?: string | null;
  projectId?: string | null;
};

type SeedProject = { id: string; name: string; color?: number };

const iso = (offsetMin = 0) => new Date(Date.now() + offsetMin * 60_000).toISOString();

export function dateKey(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 테스트 데이터 파일을 통째로 쓴다 (서버는 요청마다 파일을 읽는다) */
type SeedDays = Record<string, { issues?: { id?: string; text: string; taskId?: string | null; resolved?: boolean }[] }>;

export function writeData(tasks: SeedTask[] = [], rev = 0, extra: { days?: SeedDays; scratch?: unknown; projects?: SeedProject[] } = {}) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const full = tasks.map((t, i) => ({
    id: t.id ?? `seed-${i}`,
    title: t.title,
    status: t.status ?? 'todo',
    priority: t.priority ?? null,
    order: t.order ?? i * 1024,
    plannedOn: t.plannedOn ?? null,
    dayOrder: i * 1024,
    projectId: t.projectId ?? null,
    due: t.due ?? null,
    delegate: t.delegate ?? null,
    note: t.note ?? null,
    issues: (t.issues ?? []).map((is, j) => ({
      id: is.id ?? `seed-${i}-issue-${j}`,
      doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: is.text }] }] },
      resolved: is.resolved ?? false,
      createdAt: is.createdAt ?? iso(-j),
      updatedAt: is.createdAt ?? iso(-j),
    })),
    activity: [],
    createdAt: iso(-60),
    updatedAt: iso(-60),
    startedAt: null,
    completedAt: t.completedAt ?? (t.status === 'done' ? iso(-30) : null),
  }));
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(
      {
        version: 2,
        rev,
        savedAt: null,
        tasks: full,
        projects: (extra.projects ?? []).map((p) => ({ id: p.id, name: p.name, color: p.color ?? 1, createdAt: iso(-200), updatedAt: iso(-200) })),
        days: Object.fromEntries(
          Object.entries(extra.days ?? {}).map(([key, d]) => [
            key,
            {
              issues: (d.issues ?? []).map((is, j) => ({
                id: is.id ?? `${key}-issue-${j}`,
                doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: is.text }] }] },
                resolved: is.resolved ?? false,
                taskId: is.taskId ?? null,
                createdAt: iso(-60 + j),
                updatedAt: iso(-60 + j),
              })),
            },
          ]),
        ),
        scratch: extra.scratch ?? null,
        scratchUpdatedAt: new Date(0).toISOString(),
      },
      null,
      2,
    ),
  );
}

export type FileTask = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  order: number;
  due: string | null;
  delegate: string | null;
  note: { content?: unknown[] } | null;
  plannedOn: string | null;
  dayOrder: number;
  projectId: string | null;
  completedAt: string | null;
};

export type FileDayIssue = { id: string; resolved: boolean; taskId: string | null; doc: unknown };

export function readData(): {
  rev: number;
  tasks: FileTask[];
  projects: { id: string; name: string; color: number }[];
  days: Record<string, { issues: FileDayIssue[] }>;
  tombstones: Record<string, string>;
  scratch: unknown;
} {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

export const liveFileTasks = () => readData().tasks;

/** 저장이 끝날 때까지 (배지가 '저장됨') */
export async function waitSaved(page: Page) {
  await expect(page.getByTestId('sync-badge').first()).toHaveAttribute('data-status', 'saved', { timeout: 8000 });
  // 디바운스(0.6초) 뒤 저장이 시작되므로, 시작 전 '저장됨' 을 보고 넘어가지 않게 한 번 더
  await page.waitForTimeout(800);
  await expect(page.getByTestId('sync-badge').first()).toHaveAttribute('data-status', 'saved', { timeout: 8000 });
}

export async function open(page: Page, route: string) {
  await page.goto(`./#${route}`);
  await expect(page.getByTestId('sync-badge').first()).toHaveAttribute('data-status', /saved|saving/);
}

/** 브라우저 기본 select·date 가 하나도 없는지 */
export async function expectNoNativeControls(page: Page) {
  await expect(page.locator('select')).toHaveCount(0);
  await expect(page.locator('input[type="date"], input[type="datetime-local"], input[type="time"]')).toHaveCount(0);
}

export async function shot(page: Page, name: string) {
  fs.mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: false });
}

/** dnd-kit 마우스 드래그: 눌러서 조금 움직여 활성화 → 목표로 천천히 */
export async function mouseDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 8, from.y + 8, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 18 });
  await page.waitForTimeout(150);
  await page.mouse.move(to.x, to.y + 2, { steps: 2 });
  await page.mouse.up();
}

export async function center(selector: ReturnType<Page["locator"]>) {
  const box = await selector.boundingBox();
  if (!box) throw new Error('요소가 화면에 없음');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** 그날 체크리스트 = 그날 올린 할 일 (순서대로) */
export function fileDayTasks(key: string) {
  return readData()
    .tasks.filter((t) => t.plannedOn === key)
    .sort((a, b) => a.dayOrder - b.dayOrder);
}

/** 자유공간 펼치기 — 데스크톱은 오른쪽 책갈피, 모바일은 상단 바 버튼 */
export async function openScratch(page: Page) {
  const mobile = (page.viewportSize()?.width ?? 1000) < 640;
  await page.getByTestId(mobile ? 'scratch-toggle' : 'scratch-tab').click();
  await expect(page.getByTestId('scratch-panel')).toHaveAttribute('data-open', 'true');
}

/** 이 할 일에 연결된 이슈 (파일 기준, 어느 날짜든) */
export function fileIssuesOfTask(taskId: string) {
  return Object.values(readData().days ?? {})
    .flatMap((d) => d.issues)
    .filter((i) => i.taskId === taskId);
}
