import { expect, test } from '@playwright/test';

import { center, dateKey, expectNoNativeControls, liveFileTasks, mouseDrag, open, readData, waitSaved, writeData } from './helpers';

test.beforeEach(() =>
  writeData([
    { id: 't1', title: '기획서 초안', status: 'todo', priority: 'high', due: dateKey(-1) },
    { id: 't2', title: '디자인 리뷰', status: 'todo', due: dateKey(0) },
    { id: 'd1', title: 'API 연동', status: 'doing', issues: [{ text: '토큰 만료 문제', resolved: false }] },
    { id: 'w1', title: '견적 회신', status: 'waiting', delegate: '박대리' },
    { id: 'x1', title: '킥오프 미팅', status: 'done' },
  ]),
);

test('보드: 요약 수치와 칸 구성', async ({ page }) => {
  await open(page, '/status');
  await expect(page.getByTestId('column-todo').getByTestId('task-card')).toHaveCount(2);
  await expect(page.getByTestId('column-doing').getByTestId('task-card')).toHaveCount(1);
  await expect(page.getByTestId('column-waiting').getByTestId('task-card')).toHaveCount(1);
  await expect(page.getByTestId('column-done').getByTestId('task-card')).toHaveCount(1);

  await expect(page.getByTestId('stat-doing')).toContainText('1');
  await expect(page.getByTestId('stat-overdue')).toContainText('1');
  await expect(page.getByTestId('stat-today')).toContainText('1');
  await expect(page.getByTestId('stat-delegated')).toContainText('1');
  await expect(page.getByTestId('stat-issues')).toContainText('1');

  // 카드 메타: 지난 마감, 위임 대상, 이슈 수
  const overdue = page.getByTestId('task-card').filter({ hasText: '기획서 초안' });
  await expect(overdue).toContainText('1일 지남');
  await expect(page.getByTestId('task-card').filter({ hasText: '견적 회신' })).toContainText('박대리');
  await expect(page.getByTestId('task-card').filter({ hasText: 'API 연동' })).toContainText('1/1');
  await expectNoNativeControls(page);
});

test('보드: 드래그 앤 드롭으로 상태 바꾸기 (진행 예정 → 진행 중)', async ({ page }) => {
  await open(page, '/status');
  const card = page.getByTestId('task-card').filter({ hasText: '디자인 리뷰' });
  const target = page.getByTestId('column-doing').getByTestId('task-card').first();
  const to = await center(target);
  await mouseDrag(page, await center(card), { x: to.x, y: to.y + 30 });

  await expect(page.getByTestId('column-doing').getByTestId('task-card')).toHaveCount(2);
  await expect(page.getByTestId('column-doing')).toContainText('디자인 리뷰');
  await expect(page.getByTestId('stat-doing')).toContainText('2');
  await waitSaved(page);
  const t2 = liveFileTasks().find((t) => t.id === 't2')!;
  expect(t2.status).toBe('doing');
  // 진행 중으로 옮기면 오늘 체크리스트에 올라간다
  expect(t2.plannedOn).toBe(dateKey(0));
  // 활동 기록이 남는다
  expect(JSON.stringify(readData().tasks.find((t) => t.id === 't2'))).toContain('"to":"doing"');
});

test('보드: 빈 칸(완료)으로도 놓을 수 있고, 칸 안에서 순서도 바뀐다', async ({ page }) => {
  await open(page, '/status');
  // 칸 안 순서: 디자인 리뷰를 기획서 초안 위로
  const todo = page.getByTestId('column-todo');
  await mouseDrag(page, await center(todo.getByTestId('task-card').nth(1)), await center(todo.getByTestId('task-card').nth(0)));
  await expect(todo.getByTestId('task-card').first()).toContainText('디자인 리뷰');

  // 완료 칸 빈 곳에
  const doneCol = page.getByTestId('column-done');
  const box = (await doneCol.boundingBox())!;
  await mouseDrag(page, await center(page.getByTestId('task-card').filter({ hasText: '견적 회신' })), {
    x: box.x + box.width / 2,
    y: box.y + box.height - 60,
  });
  await expect(doneCol).toContainText('견적 회신');
  await waitSaved(page);
  const tasks = Object.fromEntries(liveFileTasks().map((t) => [t.id, t]));
  expect(tasks.w1.status).toBe('done');
  expect(tasks.t2.order).toBeLessThan(tasks.t1.order);
});

test('보드: + 로 칸 맨 위에 바로 추가', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('column-todo').getByRole('button', { name: '진행 예정에 추가' }).click();
  await page.getByRole('textbox', { name: '진행 예정에 새 할 일' }).fill('바로 추가한 일');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('column-todo').getByTestId('task-card').first()).toContainText('바로 추가한 일');
});

test('보드: 검색·필터·요약 타일 필터', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('board-search').fill('토큰');
  await expect(page.getByTestId('task-card')).toHaveCount(1);
  await expect(page.getByTestId('task-card')).toContainText('API 연동');
  await page.getByRole('button', { name: '검색어 지우기' }).click();

  await page.getByTestId('stat-delegated').click();
  await expect(page.getByTestId('task-card')).toHaveCount(1);
  await expect(page.getByTestId('task-card')).toContainText('견적 회신');
  await page.getByTestId('stat-delegated').click();

  // 커스텀 select 키보드 조작: 우선순위 필터 → 높음
  await page.getByRole('button', { name: '우선순위 필터' }).click();
  const list = page.getByRole('listbox', { name: '우선순위 필터' });
  await expect(list).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(list).toBeHidden();
  await expect(page.getByTestId('task-card')).toHaveCount(1);
  await expect(page.getByTestId('task-card')).toContainText('기획서 초안');
  await page.getByRole('button', { name: '초기화' }).click();
  await expect(page.getByTestId('task-card')).toHaveCount(5);
});

test('보드: 키보드로 카드 열기(Enter)', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('task-card').filter({ hasText: 'API 연동' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('task-drawer')).toBeVisible();
  await expect(page.getByTestId('drawer-title')).toHaveValue('API 연동');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('task-drawer')).toBeHidden();
});

test('상태 관리 칸 순서: 진행 예정 · 진행 중 · 진행 완료 · 대기', async ({ page }) => {
  await open(page, '/status');
  await expect(page.getByTestId('column-todo')).toBeVisible();
  const labels = await page.locator('[data-testid^="column-"][role="region"]').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  expect(labels).toEqual(['진행 예정', '진행 중', '진행 완료', '대기']);
});

test('드래그: 들린 카드가 포인터를 정확히 따라가고, 놓일 자리 선·칸 표시가 보인다', async ({ page }) => {
  await open(page, '/status');
  const card = page.getByTestId('task-card').filter({ hasText: '디자인 리뷰' });
  const b = (await card.boundingBox())!;
  const grab = { x: b.x + 40, y: b.y + 15 };
  const target = (await page.getByTestId('column-doing').getByTestId('task-card').first().boundingBox())!;
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x + 8, grab.y + 8, { steps: 3 });
  const to = { x: target.x + 40, y: target.y + target.height + 10 };
  await page.mouse.move(to.x, to.y, { steps: 14 });
  await page.waitForTimeout(250);

  // 잡은 지점 그대로 포인터에 붙어 있다 (예전엔 사이드바 너비만큼 어긋났다)
  const ov = (await page.getByTestId('task-card-overlay').boundingBox())!;
  expect(Math.abs(ov.x + 40 - to.x)).toBeLessThan(12);
  expect(Math.abs(ov.y + 15 - to.y)).toBeLessThan(12);

  await expect(page.getByTestId('drop-indicator')).toBeVisible();
  await expect(page.getByTestId('drop-slot')).toHaveCount(1);
  await expect(page.getByTestId('column-doing').getByTestId('drop-target-label')).toHaveText('여기로 이동');
  await page.mouse.up();
  await expect(page.getByTestId('drop-indicator')).toHaveCount(0);
  await expect(page.getByTestId('column-doing')).toContainText('디자인 리뷰');
});
