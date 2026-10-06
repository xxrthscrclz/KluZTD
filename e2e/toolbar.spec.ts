import { expect, test, type Page } from '@playwright/test';

import { dateKey, open, readData, waitSaved, writeData, openScratch } from './helpers';

test.beforeEach(() => writeData([{ id: 'k', title: '수식 쓰는 일', status: 'todo' }]));

/** 일일 관리에서 새 이슈를 하나 열고 그 에디터에 커서 */
async function newIssue(page: Page) {
  await page.getByTestId('day-issues').getByTestId('add-issue').click();
  return page.getByTestId('day-issues').getByTestId('issue-editor').first();
}

test('떠 있는 서식 막대: 일일 관리에 늘 떠 있고, 마지막으로 쓴 에디터에 적용', async ({ page }) => {
  await open(page, '/daily');
  const bar = page.getByTestId('floating-toolbar');
  await expect(bar).toBeVisible();
  await expect(bar).toBeInViewport();

  const issue = await newIssue(page);
  await bar.getByRole('button', { name: '제목 2 (##)' }).click();
  await page.keyboard.type('정리');
  await expect(issue.locator('h2')).toHaveText('정리');

  // 자유공간을 펼쳐서 누른 뒤엔 자유공간에
  await openScratch(page);
  await page.getByTestId('scratch-note').click();
  await bar.getByRole('button', { name: '체크리스트 ([ ])' }).click();
  await page.keyboard.type('우유 사기');
  await expect(page.getByTestId('scratch-note').locator('ul[data-type="taskList"] li')).toContainText('우유 사기');
  await bar.getByRole('button', { name: '콜아웃 (!>)' }).click();
  await expect(page.getByTestId('scratch-note').locator('[data-callout]')).toBeVisible();
});

test('수식: 막대 버튼 → 편집 창(미리보기) → 적용, 다시 눌러 수정, 저장', async ({ page }) => {
  await open(page, '/daily');
  const issue = await newIssue(page);
  await page.keyboard.type('피타고라스: ');
  await page.getByTestId('tool-math').click();
  const pop = page.getByTestId('math-popover');
  await expect(pop).toBeVisible();
  await pop.getByRole('textbox', { name: 'LaTeX' }).fill('a^2 + b^2 = c^2');
  await expect(pop.getByTestId('math-preview').locator('.katex')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(pop).toBeHidden();
  const inline = issue.locator('[data-type="inline-math"]');
  await expect(inline).toHaveAttribute('data-latex', 'a^2 + b^2 = c^2');
  await expect(inline.locator('.katex')).toBeVisible();

  await page.keyboard.press('End');
  await page.keyboard.press('Enter');
  await page.getByTestId('tool-math-block').click();
  await pop.getByRole('button', { name: '\\sum_{i=1}^{n} x_i' }).click();
  await pop.getByRole('button', { name: '적용' }).click();
  await expect(issue.locator('[data-type="block-math"]')).toHaveAttribute('data-latex', '\\sum_{i=1}^{n} x_i');

  await inline.click();
  await expect(pop).toBeVisible();
  await pop.getByRole('textbox', { name: 'LaTeX' }).fill('e^{i\\pi} + 1 = 0');
  await page.keyboard.press('Enter');
  await expect(inline).toHaveAttribute('data-latex', 'e^{i\\pi} + 1 = 0');

  await page.getByTestId('day-add').click();
  await waitSaved(page);
  const saved = JSON.stringify(readData().days[dateKey(0)].issues);
  expect(saved).toContain('"type":"inlineMath"');
  expect(saved).toContain('"type":"blockMath"');
});

test('수식: 넣고 안 고친 채 닫으면 자리표시가 남지 않는다', async ({ page }) => {
  await open(page, '/daily');
  const issue = await newIssue(page);
  await page.getByTestId('tool-math').click();
  await expect(page.getByTestId('math-popover')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('math-popover')).toBeHidden();
  await expect(issue.locator('[data-type="inline-math"]')).toHaveCount(0);
});

test('수식: $$...$$ 입력 규칙과 / 메뉴', async ({ page }) => {
  await open(page, '/daily');
  const issue = await newIssue(page);
  await page.keyboard.type('면적 $$\\pi r^2$$ 끝');
  await expect(issue.locator('[data-type="inline-math"]')).toHaveAttribute('data-latex', '\\pi r^2');

  await page.keyboard.press('Enter');
  await page.keyboard.type('/수식');
  await expect(page.getByTestId('slash-menu').getByRole('option').first()).toContainText('수식');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('math-popover')).toBeVisible();
  await page.keyboard.type('\\sqrt{2}');
  await page.keyboard.press('Enter');
  await expect(issue.locator('[data-type="inline-math"]')).toHaveCount(2);
});

test('막대: 상세 패널 메모에도 쓰이고, 끌어서 옮기고, 접을 수 있다', async ({ page }) => {
  await open(page, '/status');
  await expect(page.getByTestId('floating-toolbar')).toHaveCount(0); // 에디터가 없는 화면엔 안 뜸
  await page.getByTestId('task-card').click();
  const bar = page.getByTestId('floating-toolbar');
  await expect(bar).toBeVisible();
  await page.getByTestId('note-editor').click();
  await bar.getByRole('button', { name: '표' }).click();
  await expect(page.getByTestId('note-editor').locator('table')).toBeVisible();

  const grip = bar.getByLabel('막대 옮기기');
  const before = (await bar.boundingBox())!;
  const g = (await grip.boundingBox())!;
  await page.mouse.move(g.x + g.width / 2, g.y + g.height / 2);
  await page.mouse.down();
  await page.mouse.move(g.x - 200, g.y - 300, { steps: 8 });
  await page.mouse.up();
  const after = (await bar.boundingBox())!;
  expect(after.y).toBeLessThan(before.y - 200);

  await bar.getByRole('button', { name: '서식 막대 접기' }).click();
  await expect(bar).toBeHidden();
  await page.getByTestId('toolbar-expand').click();
  await expect(page.getByTestId('floating-toolbar')).toBeVisible();
});
