import { expect, test, type Page } from '@playwright/test';

import { expectNoNativeControls, liveFileTasks, open, readData, waitSaved, writeData, fileIssuesOfTask } from './helpers';

test.beforeEach(() => writeData([{ id: 'k', title: 'LiteLLM 붙이기', status: 'todo' }]));

async function openCard(page: Page) {
  await open(page, '/status');
  await page.getByTestId('task-card').first().click();
  await expect(page.getByTestId('task-drawer')).toBeVisible();
  await expect(page).toHaveURL(/[?&]t=k/);
}

test('상세: 제목·상태·우선순위·마감일·위임 (모두 커스텀 컨트롤)', async ({ page }) => {
  await openCard(page);
  await expectNoNativeControls(page);

  const title = page.getByTestId('drawer-title');
  await title.fill('LiteLLM 게이트웨이 붙이기');
  await title.press('Enter');

  // 상태: 커스텀 select
  await page.getByTestId('field-status').click();
  await page.getByRole('option', { name: /진행 중/ }).click();
  await expect(page.getByTestId('field-status')).toContainText('진행 중');

  await page.getByTestId('field-priority').click();
  await page.getByRole('option', { name: '높음' }).click();

  // 마감일: 달력에서 날짜 칸 직접 누르기 (이번 달 28일)
  await page.getByTestId('field-due').click();
  const picker = page.getByTestId('date-picker');
  const now = new Date();
  await picker.getByRole('gridcell', { name: `${now.getMonth() + 1}월 28일` }).click();
  await expect(picker).toBeHidden();

  await page.getByTestId('field-delegate').click();
  await page.getByPlaceholder('누가 맡나요? (이름 입력)').fill('이수석');
  await page.getByRole('option', { name: /이수석/ }).click();

  await waitSaved(page);
  const t = liveFileTasks()[0];
  const month = String(now.getMonth() + 1).padStart(2, '0');
  expect(t).toMatchObject({
    title: 'LiteLLM 게이트웨이 붙이기',
    status: 'doing',
    priority: 'high',
    due: `${now.getFullYear()}-${month}-28`,
    delegate: '이수석',
  });

  // 보드 카드에도 바로 반영
  await page.getByTestId('drawer-close').click();
  const card = page.getByTestId('column-doing').getByTestId('task-card');
  await expect(card).toContainText('LiteLLM 게이트웨이 붙이기');
  await expect(card).toContainText('이수석');
});

test('메모: 노션식 마크다운 단축 입력과 / 블록 메뉴', async ({ page }) => {
  await openCard(page);
  const note = page.getByTestId('note-editor');
  await note.click();

  await page.keyboard.type('## 준비물');
  await page.keyboard.press('Enter');
  await page.keyboard.type('[ ] API 키 발급');
  await page.keyboard.press('Enter');
  await page.keyboard.type('모델 목록 정리');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter'); // 목록 끝내기
  await page.keyboard.type('**중요**한 점: `base_url` 바꾸기 ');

  await expect(note.locator('h2')).toHaveText('준비물');
  await expect(note.locator('ul[data-type="taskList"] li')).toHaveCount(2);
  await expect(note.locator('strong')).toHaveText('중요');
  await expect(note.locator('p code')).toHaveText('base_url');

  // </> → 코드 블록
  await page.keyboard.press('Enter');
  await page.keyboard.type('</> ');
  await page.keyboard.type('export ANTHROPIC_BASE_URL=http://localhost:4000');
  await expect(note.locator('pre code')).toContainText('ANTHROPIC_BASE_URL');
  await page.keyboard.press('ArrowDown');

  // / 메뉴: 초성 검색 'ㅍ' → 표
  await page.keyboard.press('Enter');
  await page.keyboard.type('/ㅍ');
  const menu = page.getByTestId('slash-menu');
  await expect(menu).toBeVisible();
  await expect(menu.getByRole('option').first()).toContainText('표');
  await page.keyboard.press('Enter');
  await expect(note.locator('table')).toBeVisible();
  await expect(note.locator('table tr')).toHaveCount(3);
  await page.keyboard.type('항목');
  await page.keyboard.press('Tab');
  await page.keyboard.type('담당');
  await expect(page.getByTestId('table-bubble')).toBeVisible();
  await page.getByTestId('table-bubble').getByRole('button', { name: '아래에 행 추가' }).click();
  await expect(note.locator('table tr')).toHaveCount(4);

  // 표 밖으로 나와 콜아웃
  await note.locator('h2').click();
  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('/콜아웃');
  await page.keyboard.press('Enter');
  await page.keyboard.type('키는 절대 커밋하지 말 것');
  const callout = note.locator('[data-callout]');
  await expect(callout).toContainText('키는 절대 커밋하지 말 것');
  await callout.getByRole('button', { name: '콜아웃 종류 바꾸기' }).click();
  await expect(callout).toHaveAttribute('data-variant', 'info');

  await page.getByTestId('drawer-title').click(); // blur → 즉시 저장
  await waitSaved(page);
  const saved = JSON.stringify(liveFileTasks()[0].note);
  for (const type of ['heading', 'taskList', 'codeBlock', 'table', 'callout']) expect(saved).toContain(`"type":"${type}"`);

  // 다시 열어도 그대로
  await page.reload();
  await expect(page.getByTestId('note-editor').locator('table')).toBeVisible();
  await expect(page.getByTestId('note-editor').locator('[data-callout]')).toHaveAttribute('data-variant', 'info');
});

test('이슈 기록: 추가 → 작성 → 해결 표시', async ({ page }) => {
  await openCard(page);
  await page.getByTestId('add-issue').click();
  const entry = page.getByTestId('issue-entry').first();
  await expect(entry).toBeVisible();
  // 새 기록에 바로 커서
  await page.keyboard.type('프록시 401 에러 — 키 헤더 이름 문제');
  await page.keyboard.press('Enter');
  await page.keyboard.type('- x-api-key 로 바꿔서 해결');
  await expect(entry.locator('li')).toHaveText('x-api-key 로 바꿔서 해결');
  await entry.getByTestId('issue-toggle').click();
  await expect(entry).toHaveAttribute('data-resolved', 'true');

  // 두 번째 기록
  await page.getByTestId('add-issue').click();
  await page.keyboard.type('모델 이름 매핑 확인 필요');
  await page.getByTestId('drawer-title').click();
  await waitSaved(page);
  const issues = fileIssuesOfTask('k');
  expect(issues).toHaveLength(2);
  expect(issues.filter((i) => i.resolved)).toHaveLength(1);

  // 보드 카드: 미해결 1 / 전체 2
  await page.getByTestId('drawer-close').click();
  await expect(page.getByTestId('task-card').first()).toContainText('1/2');

});

test('삭제: 확인 없이 바로 지워지고 파일에서도 사라진다 (잠깐 되돌리기 가능)', async ({ page }) => {
  await openCard(page);
  await page.getByRole('button', { name: '더 보기' }).click();
  await page.getByRole('button', { name: '삭제' }).click();
  await expect(page.getByTestId('task-drawer')).toBeHidden();
  await expect(page.getByTestId('task-card')).toHaveCount(0);
  await waitSaved(page);
  expect(readData().tasks).toHaveLength(0);
  expect(readData().tombstones.k).toBeTruthy();

  await page.getByRole('status').getByRole('button', { name: '되돌리기' }).click();
  await expect(page.getByTestId('task-card')).toHaveCount(1);
  await waitSaved(page);
  expect(readData().tasks.map((t) => t.id)).toEqual(['k']);
});

test('삭제한 할 일은 다른 탭의 오래된 사본과 합쳐도 되살아나지 않는다', async ({ browser }) => {
  const a = await (await browser.newContext()).newPage();
  const b = await (await browser.newContext()).newPage();
  await open(a, '/status');
  await open(b, '/status');
  // b 는 오프라인으로 만들어 오래된 사본을 들고 있게 한다
  await b.context().route('**/api/kluztd**', (r) => r.abort());

  await a.getByTestId('task-card').click();
  await a.getByRole('button', { name: '더 보기' }).click();
  await a.getByRole('button', { name: '삭제' }).click();
  await waitSaved(a);

  // b 에서 다른 걸 고치고 다시 연결 → 병합
  await b.getByTestId('column-todo').getByRole('button', { name: '진행 예정에 추가' }).click();
  await b.getByRole('textbox', { name: '진행 예정에 새 할 일' }).fill('b 에서 추가');
  await b.keyboard.press('Enter');
  await b.context().unroute('**/api/kluztd**');
  await b.evaluate(() => window.dispatchEvent(new Event('online')));
  await waitSaved(b);
  expect(readData().tasks.map((t) => t.title)).toEqual(['b 에서 추가']);
  await expect(b.getByTestId('task-card')).toHaveCount(1);
  await a.context().close();
  await b.context().close();
});

test('뒤로 가기로 상세가 닫힌다', async ({ page }) => {
  await openCard(page);
  await page.goBack();
  await expect(page.getByTestId('task-drawer')).toBeHidden();
  await expect(page).toHaveURL(/#\/status$/);
});

test('링크: javascript: 주소는 거르고 일반 주소는 https 로', async ({ page }) => {
  await openCard(page);
  const note = page.getByTestId('note-editor');
  await note.click();
  await page.keyboard.type('문서 링크');
  // macOS 에선 Home 이 줄 처음으로 안 가므로 세 번 눌러 문단 선택
  await note.locator('p').first().click({ clickCount: 3 });
  const bubble = page.getByTestId('format-bubble');
  await expect(bubble).toBeVisible();
  await bubble.getByRole('button', { name: '링크' }).click();
  await page.getByPlaceholder('링크 주소 붙여넣기').fill('javascript:alert(1)');
  await page.keyboard.press('Enter');
  await expect(note.locator('a')).toHaveCount(0);

  // 직전 링크 창·막대가 사라지는 중(퇴장 모션)이면 선택이 풀릴 수 있어 링크 창이 열릴 때까지 다시 선택
  await expect(async () => {
    await note.locator('p').first().click({ clickCount: 3 });
    await bubble.getByRole('button', { name: '링크' }).click({ timeout: 1500 });
    await expect(page.getByPlaceholder('링크 주소 붙여넣기')).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15_000 });
  await page.getByPlaceholder('링크 주소 붙여넣기').fill('docs.anthropic.com');
  await page.keyboard.press('Enter');
  await expect(note.locator('a')).toHaveAttribute('href', 'https://docs.anthropic.com');
});
