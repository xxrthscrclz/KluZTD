import { expect, test } from '@playwright/test';

import { dateKey, fileIssuesOfTask, open, readData, waitSaved, writeData } from './helpers';

test.beforeEach(() =>
  writeData([
    { id: 't1', title: '후기 이벤트 선물 발송', status: 'todo', plannedOn: dateKey(0) },
    { id: 't2', title: '체크리스트에 없는 일', status: 'todo' },
  ]),
);

test('일일 관리에서 연결한 이슈가 할 일 상세·카드에도 보인다 (같은 이슈)', async ({ page }) => {
  await open(page, '/daily');
  const row = page.getByTestId('day-item').first();
  await row.getByTestId('row-info').click();
  await page.getByRole('button', { name: /^이슈 기록/ }).click();
  await page.keyboard.type('택배사 파업으로 지연');
  await page.getByTestId('day-add').click();

  // 상세에서 같은 이슈
  await row.getByTestId('row-info').click();
  await page.getByRole('button', { name: '자세히 (메모)' }).click();
  const drawerIssues = page.getByTestId('task-drawer').getByTestId('issue-entry');
  await expect(drawerIssues).toHaveCount(1);
  await expect(drawerIssues).toContainText('택배사 파업으로 지연');
  // 상세에서 해결 표시 → 일일 관리 쪽도 해결
  await drawerIssues.getByTestId('issue-toggle').click();
  await page.getByTestId('drawer-close').click();
  await expect(page.getByTestId('day-issues').getByTestId('issue-entry')).toHaveAttribute('data-resolved', 'true');

  // 상태 관리 카드의 이슈 수
  await open(page, '/status');
  await expect(page.getByTestId('task-card').filter({ hasText: '후기 이벤트' })).toContainText('1');
  await waitSaved(page);
  expect(fileIssuesOfTask('t1')).toHaveLength(1);
});

test('상세에서 적은 이슈는 오늘 일일 관리 이슈 칸에 그 할 일과 연결돼 보인다', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('task-card').filter({ hasText: '체크리스트에 없는 일' }).click();
  await page.getByTestId('task-drawer').getByTestId('add-issue').click();
  await page.keyboard.type('담당자 연락 안 됨');
  await page.getByTestId('drawer-title').click();
  await page.getByTestId('drawer-close').click();

  await open(page, '/daily');
  const entry = page.getByTestId('day-issues').getByTestId('issue-entry');
  await expect(entry).toContainText('담당자 연락 안 됨');
  await expect(entry.getByTestId('issue-related')).toContainText('체크리스트에 없는 일');
  await waitSaved(page);
  expect(readData().days[dateKey(0)].issues[0].taskId).toBe('t2');
});

test('이슈는 체크리스트에 없는 할 일에도 연결할 수 있다', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-issues').getByTestId('add-issue').click();
  await page.keyboard.type('따로 적은 이슈');
  await page.getByTestId('issue-related').click();
  await page.getByRole('option', { name: /체크리스트에 없는 일/ }).click();
  await expect(page.getByTestId('issue-related')).toContainText('체크리스트에 없는 일');
});

test('체크리스트의 이슈 아이콘은 새 이슈를 만들지 않고, 연결된 이슈로 이동·강조한다', async ({ page }) => {
  writeData([{ id: 't1', title: '후기 이벤트 선물 발송', status: 'todo', plannedOn: dateKey(0) }], 0, {
    days: { [dateKey(0)]: { issues: [{ id: 'is1', text: '이미 있는 이슈', taskId: 't1' }] } },
  });
  await open(page, '/daily');
  const badge = page.getByTestId('row-issue-count');
  await expect(badge).toHaveText('1/1');
  await badge.click();
  await badge.click();
  await expect(page.getByTestId('day-issues').getByTestId('issue-entry')).toHaveCount(1); // 늘어나지 않음
  await expect(page.getByTestId('day-issues').getByTestId('issue-entry')).toHaveClass(/anim-flash/);
});
