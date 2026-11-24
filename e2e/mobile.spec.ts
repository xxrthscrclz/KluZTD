import { expect, test, type Page } from '@playwright/test';

import { center, dateKey, liveFileTasks, open, waitSaved, writeData, openScratch, shot } from './helpers';

test.beforeEach(() =>
  writeData([
    { id: 'm1', title: '모바일에서 옮길 일', status: 'todo' },
    { id: 'm2', title: '진행 중인 일', status: 'doing' },
  ]),
);

/** dnd-kit TouchSensor 는 길게 누른 뒤 움직여야 한다 — CDP 로 실제 터치 이벤트를 보낸다 */
async function touchDrag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }) {
  const cdp = await page.context().newCDPSession(page);
  const point = (p: { x: number; y: number }) => [{ x: p.x, y: p.y, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(from) });
  await page.waitForTimeout(350);
  const steps = 14;
  for (let i = 1; i <= steps; i++) {
    const p = { x: from.x + ((to.x - from.x) * i) / steps, y: from.y + ((to.y - from.y) * i) / steps };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(p) });
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('모바일: 하단 메뉴, 칸 탭, 카드를 탭 위로 끌어 상태 바꾸기', async ({ page }) => {
  await open(page, '/status');
  await expect(page.getByRole('navigation', { name: '하단 메뉴' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: '사이드바' })).toBeHidden();

  // 한 번에 한 칸
  await expect(page.getByTestId('task-card')).toHaveCount(1);
  await page.getByTestId('tab-doing').click();
  await expect(page.getByTestId('task-card')).toContainText('진행 중인 일');
  await page.getByTestId('tab-todo').click();

  await touchDrag(page, await center(page.getByTestId('task-card')), await center(page.getByTestId('tab-doing')));
  await expect(page.getByTestId('tab-doing')).toContainText('2');
  await waitSaved(page);
  expect(liveFileTasks().find((t) => t.id === 'm1')!.status).toBe('doing');
});

test('모바일: 상세는 전체 화면, select 는 아래 시트', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('task-card').click();
  const drawer = page.getByTestId('task-drawer');
  await expect(drawer).toBeVisible();
  const box = (await drawer.boundingBox())!;
  const vw = page.viewportSize()!.width;
  expect(box.width).toBeGreaterThanOrEqual(vw - 1);

  await page.getByTestId('field-priority').click();
  const sheet = page.getByRole('dialog').filter({ has: page.getByRole('listbox') });
  await expect(sheet).toBeVisible();
  const sb = (await sheet.boundingBox())!;
  expect(sb.y + sb.height).toBeGreaterThan(page.viewportSize()!.height - 4); // 화면 아래에 붙어 있음
  await page.getByRole('option', { name: '높음' }).click();
  await expect(page.getByTestId('field-priority')).toContainText('높음');

  await page.goBack();
  await expect(drawer).toBeHidden();
});

test('모바일: 일일 관리 — 입력 중에만 서식 막대, 자유공간 책갈피는 전체 화면', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-add').fill('장보기');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('day-item')).toHaveCount(1);
  await expect(page.getByTestId('floating-toolbar')).toHaveCount(0);
  await page.getByTestId('day-issues').getByTestId('add-issue').click();
  const bar = page.getByTestId('floating-toolbar');
  await expect(bar).toBeVisible();
  const nav = (await page.getByRole('navigation', { name: '하단 메뉴' }).boundingBox())!;
  const b = (await bar.boundingBox())!;
  expect(b.y + b.height).toBeLessThanOrEqual(nav.y + 1); // 하단 메뉴에 가리지 않음

  await openScratch(page);
  const panel = page.getByTestId('scratch-panel');
  await expect(panel).toHaveAttribute('data-open', 'true');
  const pb = (await panel.boundingBox())!;
  expect(pb.width).toBeGreaterThanOrEqual(page.viewportSize()!.width - 1);
  await page.getByTestId('scratch-close').click();
  await expect(panel).toHaveAttribute('data-open', 'false');
  // 상세가 열려 있어도 책갈피가 보인다
  await page.getByTestId('day-item').first().getByTestId('row-info').click();
  await page.getByRole('button', { name: '자세히 (메모)' }).click();
  await expect(page.getByTestId('task-drawer')).toBeVisible();
  await expect(page.getByTestId('scratch-tab')).toBeInViewport();
});

test('모바일: 보드 카드가 화면 위쪽 절반 안에서 시작한다', async ({ page }) => {
  await open(page, '/status');
  const card = (await page.getByTestId('task-card').first().boundingBox())!;
  expect(card.y).toBeLessThan(page.viewportSize()!.height * 0.5);
  // 칸 이름은 탭에만 (중복 머리글 없음), 추가 버튼은 있음
  await expect(page.getByRole('button', { name: '진행 예정에 추가' })).toBeVisible();
});

test('모바일: 달력 — 점으로 표시, 누르면 아래에 그날 자세히, 거기서 일정 추가', async ({ page }) => {
  await open(page, '/calendar');
  await expect(page.getByRole('navigation', { name: '하단 메뉴' }).getByRole('link', { name: /달력/ })).toBeVisible();
  const cell = page.locator(`[data-testid="cal-day"][data-date="${dateKey(0)}"]`);
  await cell.click();
  await page.getByTestId('cal-add').fill('모바일 일정');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('cal-detail-task')).toContainText('모바일 일정');
  // 달력이 화면 밖으로 넘치지 않음
  const grid = (await page.getByTestId('calendar').boundingBox())!;
  expect(grid.width).toBeLessThanOrEqual(page.viewportSize()!.width);
});

test('모바일 수첩: 목록 → 한 장 → 뒤로', async ({ page }) => {
  writeData([], 0, { notes: [{ id: 'a', title: '장보기', text: '우유, 계란' }] });
  await open(page, '/notebook');
  await expect(page.getByTestId('note-page')).toHaveCount(0);
  await page.getByTestId('note-item').click();
  await expect(page.getByTestId('note-page')).toBeVisible();
  await expect(page.getByTestId('note-list')).toHaveCount(0);
  await expect(page.getByTestId('note-body')).toContainText('우유, 계란');
  await shot(page, 'notebook-mobile');
  await page.getByTestId('note-list-toggle').click();
  await expect(page.getByTestId('note-list')).toBeVisible();
});

test('모바일: 일일 관리 — 옆으로 쓸면 전날·다음날, 세로 스크롤·입력칸에선 안 넘어감', async ({ page }) => {
  await open(page, '/daily');
  const title = page.getByTestId('day-title');
  const dayOf = (n: number) => `${new Date(Date.now() + n * 86_400_000).getDate()}일`;
  const cdp = await page.context().newCDPSession(page);
  const swipe = async (from: { x: number; y: number }, dx: number, dy = 0) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [from] });
    for (let i = 1; i <= 6; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: from.x + (dx * i) / 6, y: from.y + (dy * i) / 6 }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const box = (await title.boundingBox())!;
  const at = { x: box.x + box.width / 2, y: box.y + box.height / 2 };

  await swipe(at, -160); // 왼쪽으로 → 다음날
  await expect(title).toContainText(dayOf(1));
  await swipe(at, 160); // 오른쪽으로 → 전날
  await expect(title).toContainText(dayOf(0));
  await swipe(at, 160);
  await expect(title).toContainText(dayOf(-1));

  await swipe(at, 40, 200); // 세로가 더 크면 스크롤
  await expect(title).toContainText(dayOf(-1));

  const input = (await page.getByTestId('day-add').boundingBox())!;
  await swipe({ x: input.x + input.width / 2, y: input.y + input.height / 2 }, -160); // 입력칸 위
  await expect(title).toContainText(dayOf(-1));
});
