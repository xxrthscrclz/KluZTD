import { expect, test } from '@playwright/test';
import fs from 'node:fs';

import { DATA_FILE, dateKey, expectNoNativeControls, fileDayTasks, liveFileTasks, open, readData, waitSaved, writeData } from './helpers';

test.beforeEach(() => writeData());

test('체크리스트에 적으면 상태 관리(진행 예정)에도 생기고, 체크하면 완료로', async ({ page }) => {
  await open(page, '/daily');
  await expect(page.getByTestId('day-title')).toContainText(`${new Date().getDate()}일`);
  await page.getByTestId('day-add').fill('결과보고서 사진 고르기');
  await page.keyboard.press('Enter');
  await page.getByTestId('day-add').fill('교수님께 메일');
  await page.keyboard.press('Enter');
  // 줄 안에서 Enter → 바로 아래 새 줄 (노션처럼)
  await page.getByTestId('day-item').first().getByRole('textbox', { name: '할 일' }).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('사진 캡션 쓰기');
  await page.keyboard.press('Tab');

  const items = page.getByTestId('day-item');
  await expect(items).toHaveCount(3);
  await expect(items.nth(1).getByRole('textbox', { name: '할 일' })).toHaveValue('사진 캡션 쓰기');
  await items.nth(0).getByRole('checkbox').click();
  await expect(page.getByTestId('day-progress')).toHaveText('1/3');
  await expectNoNativeControls(page);

  await waitSaved(page);
  const saved = fileDayTasks(dateKey(0));
  expect(saved.map((t) => t.title)).toEqual(['결과보고서 사진 고르기', '사진 캡션 쓰기', '교수님께 메일']);
  expect(saved.map((t) => t.status)).toEqual(['done', 'todo', 'todo']);

  await open(page, '/status');
  await expect(page.getByTestId('column-todo').getByTestId('task-card')).toHaveCount(2);
  await expect(page.getByTestId('column-done')).toContainText('결과보고서 사진 고르기');
  await expect(page.getByTestId('column-todo').getByTestId('task-card').first()).toContainText('오늘'); // 체크리스트 날짜 표시
});

test('상태 관리에서 바꾸면 체크리스트에도 그대로 (같은 할 일)', async ({ page }) => {
  writeData([{ id: 'a', title: '같은 할 일', status: 'todo', plannedOn: dateKey(0) }]);
  await open(page, '/status');
  await page.getByTestId('task-card').click();
  await page.getByTestId('field-status').click();
  await page.getByRole('option', { name: /진행 중/ }).click();
  await page.getByTestId('drawer-close').click();
  await open(page, '/daily');
  await expect(page.getByTestId('day-item')).toContainText('진행 중');
});

test('상태 관리의 할 일을 체크리스트로 — 상세의 «체크리스트» 날짜', async ({ page }) => {
  writeData([{ id: 'b', title: '보드에서 만든 일', status: 'todo' }]);
  await open(page, '/status');
  await page.getByTestId('task-card').click();
  await page.getByTestId('field-planned').click();
  await page.getByTestId('date-picker').getByRole('button', { name: '오늘' }).first().click();
  await page.getByTestId('drawer-close').click();
  await open(page, '/daily');
  await expect(page.getByTestId('day-item').getByRole('textbox', { name: '할 일' })).toHaveValue('보드에서 만든 일');
});

test('체크리스트 줄에 마감일·담당자·프로젝트를 바로 넣는다', async ({ page }) => {
  writeData([{ id: 'c', title: '정보 넣을 일', status: 'todo', plannedOn: dateKey(0) }]);
  await open(page, '/daily');
  const row = page.getByTestId('day-item').first();
  await row.hover();

  await row.getByTestId('field-due').click();
  await page.getByTestId('date-picker').getByRole('button', { name: '내일' }).click();
  await expect(row).toContainText('내일');

  await row.hover();
  await row.getByTestId('field-delegate').click();
  await page.getByPlaceholder('누가 맡나요? (이름 입력)').fill('김매니저');
  await page.keyboard.press('Enter');
  await expect(row).toContainText('김매니저');

  // 프로젝트: 이름을 적고 Enter → 새 프로젝트가 생기며 연결
  await row.hover();
  await row.getByTestId('field-project').click();
  await page.getByPlaceholder('프로젝트 찾기 또는 새로 만들기').fill('국민대 캠타');
  await page.keyboard.press('Enter');
  await expect(row).toContainText('국민대 캠타');

  // 메모는 상세에서
  await row.hover();
  await row.getByRole('button', { name: '자세히 (메모·이슈)' }).click();
  await page.getByTestId('note-editor').click();
  await page.keyboard.type('OT 자료 준비');
  await page.getByTestId('drawer-title').click();
  await page.getByTestId('drawer-close').click();

  await waitSaved(page);
  const t = liveFileTasks().find((x) => x.id === 'c')!;
  expect(t).toMatchObject({ due: dateKey(1), delegate: '김매니저' });
  const project = readData().projects.find((p) => p.name === '국민대 캠타')!;
  expect(t.projectId).toBe(project.id);
  expect(JSON.stringify(t.note)).toContain('OT 자료 준비');
});

test('여러 줄 붙여넣기 → 한꺼번에, 빈 줄 Backspace 삭제', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-add').focus();
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="day-add"]') as HTMLInputElement;
    const data = new DataTransfer();
    data.setData('text/plain', '- 장보기\n- [ ] 세탁소\n\n3. 은행\n[x] 이미 한 일');
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }));
  });
  const items = page.getByTestId('day-item');
  await expect(items).toHaveCount(4);
  await expect(items.nth(1).getByRole('textbox', { name: '할 일' })).toHaveValue('세탁소');
  await expect(items.nth(3)).toHaveAttribute('data-done', 'true');

  await items.nth(2).getByRole('textbox', { name: '할 일' }).click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await expect(items).toHaveCount(5);
  await page.keyboard.press('Backspace');
  await expect(items).toHaveCount(4);
});

test('마감 3일 안인데 체크리스트에 없으면 빨간 알림 → 오늘에 넣기', async ({ page }) => {
  writeData([
    { id: 'u1', title: '모레 마감 보고서', status: 'todo', due: dateKey(2) },
    { id: 'u2', title: '어제 마감 지남', status: 'doing', due: dateKey(-1) },
    { id: 'u3', title: '이미 오늘 체크리스트', status: 'todo', due: dateKey(1), plannedOn: dateKey(0) },
    { id: 'u4', title: '한참 남음', status: 'todo', due: dateKey(10) },
    { id: 'u5', title: '끝난 일', status: 'done', due: dateKey(1) },
  ]);
  await open(page, '/daily');
  const panel = page.getByTestId('urgent-panel');
  await expect(panel.getByTestId('urgent-item')).toHaveCount(2);
  await expect(panel.getByTestId('urgent-item').first()).toContainText('어제 마감 지남'); // 가장 급한 것부터
  await expect(panel).toContainText('모레 마감 보고서');
  await expect(panel).toContainText('어제 마감 지남');
  await expect(page.getByTestId('urgent-badge')).toHaveText('2');

  await panel.getByTestId('urgent-item').filter({ hasText: '모레 마감 보고서' }).getByRole('button', { name: '오늘에 넣기' }).click();
  await expect(panel.getByTestId('urgent-item')).toHaveCount(1);
  await expect(page.getByTestId('day-item')).toHaveCount(2);
  await panel.getByRole('button', { name: '오늘에 넣기' }).click();
  await expect(page.getByTestId('urgent-panel')).toHaveCount(0);
  await expect(page.getByTestId('urgent-badge')).toHaveCount(0);

  await waitSaved(page);
  expect(fileDayTasks(dateKey(0)).map((t) => t.id).sort()).toEqual(['u1', 'u2', 'u3']);
});

test('이날 마감인데 체크리스트에 없는 것은 그날 페이지에 «넣기»', async ({ page }) => {
  writeData([{ id: 'f', title: '5일 뒤 마감', status: 'todo', due: dateKey(5) }]);
  await page.goto(`./#/daily/${dateKey(5)}`);
  const due = page.getByTestId('day-due-task');
  await expect(due).toContainText('5일 뒤 마감');
  await due.getByRole('button', { name: /이날 체크리스트에 넣기/ }).click();
  await expect(page.getByTestId('day-item').getByRole('textbox', { name: '할 일' })).toHaveValue('5일 뒤 마감');
  await expect(page.getByTestId('day-due')).toHaveCount(0);
});

test('이슈: 체크리스트 아래에 적고, 할 일에 연결된다', async ({ page }) => {
  writeData([
    { id: 'r1', title: '결과보고서', status: 'todo', plannedOn: dateKey(0) },
    { id: 'r2', title: '메일 보내기', status: 'todo', plannedOn: dateKey(0) },
  ]);
  await open(page, '/daily');
  const issues = page.getByTestId('day-issues');
  const row = page.getByTestId('day-item').first();
  await row.hover();
  await row.getByRole('button', { name: '더 보기' }).click();
  await page.getByRole('button', { name: /^이슈 기록/ }).click();
  await page.keyboard.type('사진 해상도가 낮아서 다시 받아야 함');
  const entry = issues.getByTestId('issue-entry').filter({ hasText: '해상도' });
  await expect(entry.getByTestId('issue-related')).toContainText('결과보고서');
  await expect(row).toContainText('1/1');

  await issues.getByTestId('add-issue').click();
  await page.keyboard.type('오후에 회의 2개');
  await issues.getByTestId('issue-entry').filter({ hasText: '회의' }).getByTestId('issue-related').click();
  await page.getByRole('option', { name: '메일 보내기' }).click();
  await entry.getByTestId('issue-toggle').click();
  await page.getByTestId('day-add').click();
  await waitSaved(page);
  const day = readData().days[dateKey(0)];
  expect(day.issues.find((i) => JSON.stringify(i.doc).includes('해상도'))).toMatchObject({ taskId: 'r1', resolved: true });
  expect(day.issues.find((i) => JSON.stringify(i.doc).includes('회의'))?.taskId).toBe('r2');
});

test('어제 못 끝낸 것 가져오기 · 다음 날로 미루기 · 체크리스트에서 빼기', async ({ page }) => {
  writeData([
    { id: 'y1', title: '어제 끝낸 것', status: 'done', plannedOn: dateKey(-1) },
    { id: 'y2', title: '어제 못 한 것', status: 'todo', plannedOn: dateKey(-1) },
    { id: 'y3', title: '오늘 뺄 것', status: 'todo', plannedOn: dateKey(0) },
  ]);
  await open(page, '/daily');
  await page.getByTestId('carry-over').click();
  await expect(page.getByTestId('carry-over')).toBeHidden();
  await expect(page.getByTestId('day-item')).toHaveCount(2);

  const out = page.getByTestId('day-item').filter({ has: page.locator('input[value="오늘 뺄 것"]') });
  await out.hover();
  await out.getByRole('button', { name: '더 보기' }).click();
  await page.getByRole('button', { name: /체크리스트에서 빼기/ }).click();
  await expect(page.getByTestId('day-item')).toHaveCount(1);

  const row = page.getByTestId('day-item').first();
  await row.hover();
  await row.getByRole('button', { name: '더 보기' }).click();
  await page.getByRole('button', { name: '다음 날로 미루기' }).click();
  await expect(page.getByTestId('day-item')).toHaveCount(0);

  await waitSaved(page);
  const byId = Object.fromEntries(liveFileTasks().map((t) => [t.id, t.plannedOn]));
  expect(byId).toEqual({ y1: dateKey(-1), y2: dateKey(1), y3: null });
  // 뺀 것은 상태 관리에 남아 있다
  await open(page, '/status');
  await expect(page.getByTestId('column-todo')).toContainText('오늘 뺄 것');
});

test('삭제는 바로 날린다 — 줄을 지우면 상태 관리에서도 사라진다', async ({ page }) => {
  writeData([{ id: 'gone', title: '지울 줄', status: 'todo', plannedOn: dateKey(0) }]);
  await open(page, '/daily');
  const row = page.getByTestId('day-item').first();
  await row.hover();
  await row.getByRole('button', { name: '더 보기' }).click();
  await page.getByRole('button', { name: '삭제' }).click();
  await expect(page.getByTestId('day-item')).toHaveCount(0);
  await waitSaved(page);
  expect(readData().tasks).toHaveLength(0);
});

test('예전 데이터: 체크리스트 줄은 할 일로, 이슈 연결도 그대로', async ({ page }) => {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({
      version: 2,
      rev: 7,
      tasks: [
        { id: 'dead', title: '지운 할 일', status: 'todo', deletedAt: '2026-10-02T03:00:00.000Z', issues: [], activity: [] },
        { id: 'old', title: '분류 대기였던 일', status: 'inbox', issues: [], activity: [] },
      ],
      days: {
        [dateKey(-1)]: { items: [{ id: 'a', text: '옮겨 간 원본', movedTo: dateKey(0), order: 0 }] },
        [dateKey(0)]: {
          items: [
            { id: 'b', text: '지운 할 일과 연결된 줄', taskId: 'dead', order: 0 },
            { id: 'c', text: '남을 줄', order: 1, done: true },
          ],
          issues: [{ id: 'i1', doc: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '연결된 이슈' }] }] }, itemId: 'c' }],
        },
      },
      scratch: null,
      scratchUpdatedAt: '1970-01-01T00:00:00.000Z',
    }),
  );
  await open(page, '/daily');
  await expect(page.getByTestId('day-item')).toHaveCount(1);
  await expect(page.getByTestId('day-item').getByRole('textbox', { name: '할 일' })).toHaveValue('남을 줄');
  await expect(page.getByTestId('day-item')).toHaveAttribute('data-done', 'true');
  await expect(page.getByTestId('day-issues').getByTestId('issue-related')).toContainText('남을 줄');
  await open(page, '/status');
  await expect(page.getByTestId('column-todo')).toContainText('분류 대기였던 일');
  await expect(page.getByTestId('column-done')).toContainText('남을 줄');
});

test('N 단축키 — 한글 입력기 상태(e.key=ㅜ)에서도 일일 관리 할 일 입력으로', async ({ page }) => {
  await open(page, '/status');
  await page.locator('body').dispatchEvent('keydown', { key: 'ㅜ', code: 'KeyN', bubbles: true });
  await expect(page).toHaveURL(/#\/daily/);
  await expect(page.getByTestId('day-add')).toBeFocused();
});

test('알림이 많으면 급한 것 몇 개만 먼저, «더 보기»로 펼친다', async ({ page }) => {
  writeData(Array.from({ length: 5 }, (_, i) => ({ id: `m${i}`, title: `임박 ${i}`, status: 'todo' as const, due: dateKey(i % 3) })));
  await open(page, '/daily');
  const panel = page.getByTestId('urgent-panel');
  await expect(panel.getByTestId('urgent-item')).toHaveCount(3);
  await panel.getByTestId('urgent-more').click();
  await expect(panel.getByTestId('urgent-item')).toHaveCount(5);
  await expect(page.getByTestId('urgent-badge')).toHaveText('5');
});
