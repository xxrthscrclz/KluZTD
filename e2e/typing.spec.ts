import { expect, test } from '@playwright/test';

import { dateKey, open, openScratch, readData, waitSaved, writeData } from './helpers';

test.beforeEach(() => writeData([{ id: 't', title: '화살표 확인', status: 'todo', plannedOn: dateKey(0) }]));

test('화살표: 일반 입력칸 모두 (체크리스트 추가·줄 제목·상세 제목)', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-add').click();
  await page.keyboard.type('기획 -> 개발 <- 피드백 => 배포 <-> 검토');
  await expect(page.getByTestId('day-add')).toHaveValue('기획 → 개발 ← 피드백 ⇒ 배포 ↔ 검토');
  await page.keyboard.press('Enter');

  const title = page.getByTestId('day-item').first().getByRole('textbox', { name: '할 일' });
  await title.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' -> 완료');
  await expect(title).toHaveValue('화살표 확인 → 완료');
  await page.keyboard.press('Tab');

  await page.getByTestId('day-item').first().getByTestId('row-info').click();
  await page.getByRole('button', { name: '자세히 (메모)' }).click();
  const drawerTitle = page.getByTestId('drawer-title');
  await drawerTitle.click();
  await page.keyboard.press('End');
  await page.keyboard.type(' => 끝');
  await expect(drawerTitle).toHaveValue('화살표 확인 → 완료 ⇒ 끝');
  await drawerTitle.press('Enter');
  await waitSaved(page);
  expect(readData().tasks.find((x) => x.id === 't')!.title).toBe('화살표 확인 → 완료 ⇒ 끝');
});

test('화살표: 노션식 에디터(메모·이슈·자유공간)도 같게, 코드 안에서는 그대로', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-issues').getByTestId('add-issue').click();
  await page.keyboard.type('원인 -> 설정 누락 <-> 확인');
  const issue = page.getByTestId('day-issues').getByTestId('issue-editor').first();
  await expect(issue).toContainText('원인 → 설정 누락 ↔ 확인');

  // 코드 블록·인라인 코드는 바꾸지 않는다
  await page.keyboard.press('Enter');
  await page.keyboard.type('`a -> b` ');
  await expect(issue.locator('code')).toHaveText('a -> b');
  await page.keyboard.press('Enter');
  await page.keyboard.type('```');
  await page.keyboard.press('Enter');
  await page.keyboard.type('x => y');
  await expect(issue.locator('pre code')).toHaveText('x => y');

  await openScratch(page);
  await page.getByTestId('scratch-note').click();
  await page.keyboard.type('자유공간 -> 됨');
  await expect(page.getByTestId('scratch-note')).toContainText('자유공간 → 됨');
});

test('화살표: 수식(LaTeX) 입력칸은 글자 그대로', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-issues').getByTestId('add-issue').click();
  await page.getByTestId('tool-math').click();
  const latex = page.getByRole('textbox', { name: 'LaTeX' });
  await latex.fill('');
  await latex.type('f: A -> B');
  await expect(latex).toHaveValue('f: A -> B');
});

test('기록에서 굵게·글자 크기', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-issues').getByTestId('add-issue').click();
  await page.keyboard.type('중요한 결정');
  const issue = page.getByTestId('day-issues').getByTestId('issue-editor').first();
  await issue.locator('p').first().click({ clickCount: 3 });

  // 선택 막대에서 굵게
  const bubble = page.getByTestId('format-bubble');
  await bubble.getByRole('button', { name: '굵게 (⌘B)' }).click();
  await expect(issue.locator('strong')).toHaveText('중요한 결정');

  // 크게 두 번 → 아주 크게
  await bubble.getByRole('button', { name: '글자 크게' }).click();
  await expect(bubble.getByTestId('font-size-label')).toHaveText('크게');
  await bubble.getByRole('button', { name: '글자 크게' }).click();
  await expect(bubble.getByTestId('font-size-label')).toHaveText('아주 크게');
  const big = await issue.locator('span[style*="font-size"]').first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const base = await issue.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(big).toBeGreaterThan(base * 1.4);

  // 떠 있는 막대에서 작게 → 크게로 한 단계 내림
  await page.getByTestId('tool-size-down').click();
  await expect(bubble.getByTestId('font-size-label')).toHaveText('크게');

  await page.getByTestId('day-add').click();
  await waitSaved(page);
  const saved = JSON.stringify(readData().days[dateKey(0)].issues);
  expect(saved).toContain('"type":"bold"');
  expect(saved).toContain('fontSize');
});
