import { expect, test } from '@playwright/test';

import { center, dateKey, fileDayTasks, liveFileTasks, mouseDrag, open, waitSaved, writeData } from './helpers';

test.beforeEach(() =>
  writeData(
    [
      { id: 'p1', title: '사진 고르기', status: 'done', plannedOn: dateKey(0) },
      { id: 'p2', title: '메일 보내기', status: 'todo', plannedOn: dateKey(0) },
      { id: 's1', title: '최종보고회', status: 'todo', due: dateKey(0) },
      { id: 's2', title: '견적 회신', status: 'waiting', due: dateKey(1), delegate: '박대리' },
      { id: 'c1', title: '마감 없이 끝낸 일', status: 'done', completedAt: new Date().toISOString() },
    ],
    0,
    { days: { [dateKey(0)]: { issues: [{ text: '해상도 문제' }] } } },
  ),
);

const cell = (page: import('@playwright/test').Page, key: string) => page.locator(`[data-testid="cal-day"][data-date="${key}"]`);

test('달력: 날짜마다 체크리스트·마감·이슈·완료가 보이고, 고른 날 자세히', async ({ page }) => {
  await open(page, '/calendar');
  const now = new Date();
  await expect(page.getByTestId('cal-title')).toHaveText(`${now.getFullYear()}년 ${now.getMonth() + 1}월`);
  const today = cell(page, dateKey(0));
  await expect(today).toContainText('메일 보내기');
  await expect(today).toContainText('1/2');
  await expect(today).toContainText('✓ 1개 완료');

  const detail = page.getByTestId('cal-detail');
  await expect(detail.getByTestId('cal-detail-task')).toHaveCount(2);
  await expect(detail.getByTestId('cal-detail-due')).toContainText('최종보고회');
  await expect(detail).toContainText('해상도 문제');
  await expect(detail).toContainText('마감 없이 끝낸 일');

  await cell(page, dateKey(1)).click();
  await expect(detail.getByTestId('cal-detail-due')).toContainText('견적 회신');
  await expect(detail).toContainText('박대리');
});

test('달력에서 할 일 추가 → 그날 체크리스트 + 상태 관리(진행 예정)', async ({ page }) => {
  await open(page, '/calendar');
  await cell(page, dateKey(3)).click();
  await page.getByTestId('cal-add').fill('워크숍 준비');
  await page.keyboard.press('Enter');
  await expect(cell(page, dateKey(3))).toContainText('워크숍 준비');
  await waitSaved(page);
  expect(liveFileTasks().find((t) => t.title === '워크숍 준비')).toMatchObject({ status: 'todo', plannedOn: dateKey(3) });

  await open(page, '/status');
  await expect(page.getByTestId('column-todo')).toContainText('워크숍 준비');
  await page.goto(`./#/daily/${dateKey(3)}`);
  await expect(page.getByTestId('day-item').getByRole('textbox', { name: '할 일' })).toHaveValue('워크숍 준비');
});

test('달력: 이날 마감인 것을 그날 체크리스트에 넣기', async ({ page }) => {
  await open(page, '/calendar');
  const due = page.getByTestId('cal-detail').getByTestId('cal-detail-due');
  await due.getByRole('button', { name: /이날 체크리스트에 넣기/ }).click();
  await expect(page.getByTestId('cal-detail').getByTestId('cal-detail-task')).toHaveCount(3);
  await waitSaved(page);
  expect(fileDayTasks(dateKey(0)).map((t) => t.id)).toContain('s1');
});

test('달력: 체크리스트 할 일을 끌어 다른 날로 → 체크리스트 날짜가 바뀐다', async ({ page }) => {
  await open(page, '/calendar');
  const chip = cell(page, dateKey(0)).getByTestId('cal-chip').filter({ hasText: '메일 보내기' });
  const targetKey = new Date().getDate() > 25 ? dateKey(-2) : dateKey(2);
  await mouseDrag(page, await center(chip), await center(cell(page, targetKey)));
  await expect(cell(page, targetKey)).toContainText('메일 보내기');
  await waitSaved(page);
  expect(liveFileTasks().find((t) => t.id === 'p2')!.plannedOn).toBe(targetKey);
});

test('달력: 두 번 누르면 그날 일일 관리, 체크도 여기서', async ({ page }) => {
  await open(page, '/calendar');
  const item = page.getByTestId('cal-detail').getByTestId('cal-detail-task').filter({ hasText: '메일 보내기' });
  await item.getByRole('checkbox').click();
  await waitSaved(page);
  expect(liveFileTasks().find((t) => t.id === 'p2')!.status).toBe('done');

  await cell(page, dateKey(1)).dblclick();
  await expect(page).toHaveURL(new RegExp(`#/daily/${dateKey(1)}`));
  await expect(page.getByTestId('day-due-task')).toContainText('견적 회신');
});

test('달력: 칩을 누르면 상세, 이전·다음 달 이동', async ({ page }) => {
  await open(page, '/calendar');
  await cell(page, dateKey(0)).getByTestId('cal-chip').filter({ hasText: '메일 보내기' }).click();
  await expect(page.getByTestId('task-drawer')).toBeVisible();
  await expect(page.getByTestId('drawer-title')).toHaveValue('메일 보내기');
  await page.getByTestId('drawer-close').click();

  const now = new Date();
  await page.getByRole('button', { name: '다음 달' }).click();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  await expect(page.getByTestId('cal-title')).toHaveText(`${next.getFullYear()}년 ${next.getMonth() + 1}월`);
  await page.getByRole('button', { name: '오늘', exact: true }).click();
  await expect(page.getByTestId('cal-title')).toHaveText(`${now.getFullYear()}년 ${now.getMonth() + 1}월`);
});
