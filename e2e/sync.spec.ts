import { expect, test } from '@playwright/test';
import fs from 'node:fs';

import { DATA_FILE, liveFileTasks, open, readData, waitSaved, writeData } from './helpers';

test.beforeEach(() => writeData([{ id: 's1', title: '공유 할 일', status: 'todo' }]));

test('실시간: 다른 탭에서 바꾼 상태가 바로 보인다 (SSE)', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await open(a, '/status');
  await open(b, '/status');

  await a.getByTestId('task-card').click();
  await a.getByTestId('field-status').click();
  await a.getByRole('option', { name: /진행 중/ }).click();
  await waitSaved(a);

  await expect(b.getByTestId('column-doing')).toContainText('공유 할 일', { timeout: 5000 });
  await a.context().close();
  await b.context().close();
});

test('충돌: 다른 곳이 먼저 저장해도(409) 양쪽 변경이 모두 남는다', async ({ page }) => {
  await open(page, '/status');
  // 다른 기기가 몰래 저장한 상황: 파일 rev 를 올리고 새 할 일 추가
  const data = readData();
  const other = { ...data.tasks[0], id: 'remote', title: '다른 기기에서 추가', order: 5000, updatedAt: new Date().toISOString() };
  fs.writeFileSync(DATA_FILE, JSON.stringify({ ...data, rev: data.rev + 5, tasks: [...data.tasks, other] }));

  // 이 탭에서 수정
  await page.getByTestId('column-todo').getByRole('button', { name: '진행 예정에 추가' }).click();
  await page.getByRole('textbox', { name: '진행 예정에 새 할 일' }).fill('이 탭에서 추가');
  await page.keyboard.press('Enter');
  await waitSaved(page);

  const titles = liveFileTasks().map((t) => t.title).sort();
  expect(titles).toEqual(['공유 할 일', '다른 기기에서 추가', '이 탭에서 추가'].sort());
  await expect(page.getByTestId('column-todo')).toContainText('다른 기기에서 추가');
});

test('오프라인: 서버가 없어도 이 기기에 보관했다가 다시 연결되면 저장', async ({ page, context }) => {
  await open(page, '/status');
  await context.route('**/api/kluztd**', (route) => route.abort());
  await page.getByTestId('column-todo').getByRole('button', { name: '진행 예정에 추가' }).click();
  await page.getByRole('textbox', { name: '진행 예정에 새 할 일' }).fill('오프라인에서 적은 것');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('sync-badge').first()).toHaveAttribute('data-status', 'offline', { timeout: 6000 });
  expect(liveFileTasks().map((t) => t.title)).not.toContain('오프라인에서 적은 것');

  // 새로고침해도 캐시에 남아 있다
  await page.reload();
  await expect(page.getByTestId('column-todo')).toContainText('오프라인에서 적은 것');

  await context.unroute('**/api/kluztd**');
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitSaved(page);
  expect(liveFileTasks().map((t) => t.title)).toContain('오프라인에서 적은 것');
});

test('탭 여러 개 + 오프라인: 다른 탭이 못 보낸 변경을 캐시에서 지우지 않는다', async ({ context }) => {
  const a = await context.newPage();
  const b = await context.newPage();
  await open(a, '/status');
  await open(b, '/status');
  await context.route('**/api/kluztd**', (route) => route.abort());

  await a.getByTestId('column-todo').getByRole('button', { name: '진행 예정에 추가' }).click();
  await a.getByRole('textbox', { name: '진행 예정에 새 할 일' }).fill('A 탭 오프라인 메모');
  await a.keyboard.press('Enter');
  await expect(a.getByTestId('sync-badge').first()).toHaveAttribute('data-status', 'offline', { timeout: 6000 });
  await a.close(); // 서버에 못 보내고 닫힘

  // B 탭이 캐시를 다시 씀 (숨김 → 캐시 기록)
  await b.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await b.waitForTimeout(400);
  const cached = await b.evaluate(() => localStorage.getItem('kluztd:v2:cache') ?? '');
  expect(cached).toContain('A 탭 오프라인 메모');

  // 새 탭이 열리면 캐시의 못 보낸 변경을 서버에 올린다
  await context.unroute('**/api/kluztd**');
  const c = await context.newPage();
  await open(c, '/status');
  await waitSaved(c);
  expect(liveFileTasks().map((t) => t.title)).toContain('A 탭 오프라인 메모');
});
