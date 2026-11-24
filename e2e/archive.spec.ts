import { expect, test } from '@playwright/test';

import { open, readData, waitSaved, writeData } from './helpers';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

test.beforeEach(() =>
  writeData([
    { id: 'r1', title: '어제 끝낸 일', status: 'done', completedAt: daysAgo(1) },
    { id: 'r2', title: '엿새 전 끝낸 일', status: 'done', completedAt: daysAgo(6) },
    { id: 'a1', title: '열흘 전 끝낸 일', status: 'done', completedAt: daysAgo(10) },
    { id: 'a2', title: '한 달 전 끝낸 일', status: 'done', completedAt: daysAgo(40) },
    { id: 't1', title: '할 일', status: 'todo' },
  ]),
);

test('완료 칸에는 최근 일주일치만, 나머지는 아카이브로', async ({ page }) => {
  await open(page, '/status');
  const done = page.getByTestId('column-done');
  await expect(done.getByTestId('task-card')).toHaveCount(2);
  await expect(done).not.toContainText('열흘 전 끝낸 일');
  await expect(done.getByTestId('column-count')).toHaveText('2');

  await done.getByTestId('archive-link').click();
  await expect(page).toHaveURL(/#\/archive/);
  const rows = page.getByTestId('archive-row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('열흘 전 끝낸 일');

  await page.getByTestId('archive-search').fill('한 달');
  await expect(rows).toHaveCount(1);
});

test('아카이브에서 다시 진행 예정으로 꺼낼 수 있다', async ({ page }) => {
  await open(page, '/archive');
  await page.getByRole('button', { name: '«열흘 전 끝낸 일» 다시 진행 예정으로' }).click();
  await expect(page.getByTestId('archive-row')).toHaveCount(1);
  await waitSaved(page);
  expect(readData().tasks.find((t) => t.id === 'a1')?.status).toBe('todo');

  await open(page, '/status');
  await expect(page.getByTestId('column-todo')).toContainText('열흘 전 끝낸 일');
});
