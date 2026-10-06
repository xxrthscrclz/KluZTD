import { expect, test, type Page } from '@playwright/test';

import { center, dateKey, liveFileTasks, open, waitSaved, writeData, openScratch } from './helpers';

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
