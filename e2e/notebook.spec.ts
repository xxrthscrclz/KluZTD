import { expect, test } from '@playwright/test';

import { open, readData, shot, waitSaved, writeData } from './helpers';

test('수첩: 새 페이지를 만들고 제목·본문을 쓰면 파일에 저장된다', async ({ page }) => {
  writeData();
  await open(page, '/notebook');
  await expect(page.getByText('아직 페이지가 없어요')).toBeVisible();

  await page.getByTestId('note-add').click();
  const title = page.getByTestId('note-title');
  await expect(title).toBeFocused();
  await title.pressSequentially('회의 -> 정리');
  await expect(title).toHaveValue('회의 → 정리');
  await title.press('Enter');

  await page.getByTestId('note-body').click();
  await page.keyboard.type('## 결정 사항');
  await page.keyboard.press('Enter');
  await page.keyboard.type('배포는 금요일');
  await expect(page.getByTestId('note-body').locator('h2')).toHaveText('결정 사항');
  // 서식 막대도 그대로 쓴다
  await expect(page.getByTestId('floating-toolbar')).toBeVisible();

  // 새 페이지는 화면 전체 — 목록은 '목록' 버튼으로 옆에
  await expect(page.getByTestId('note-list')).toHaveCount(0);
  await page.getByTestId('note-list-toggle').click();
  await expect(page.getByTestId('note-side')).toBeVisible();
  await expect(page.getByTestId('note-item')).toHaveCount(1);
  await expect(page.getByTestId('note-item')).toContainText('회의 → 정리');
  // 본문 디바운스 + 저장 디바운스가 끝날 때까지 파일을 본다
  await expect.poll(() => readData().notes.length, { timeout: 8000 }).toBe(1);
  await expect.poll(() => JSON.stringify(readData().notes[0].doc), { timeout: 8000 }).toContain('배포는 금요일');
  await waitSaved(page);
  const notes = readData().notes;
  expect(notes[0].title).toBe('회의 → 정리');
  expect(JSON.stringify(notes[0].doc)).toContain('배포는 금요일');
  await shot(page, 'notebook-desktop');

  // 자유공간과는 별개
  expect(readData().scratch).toBeNull();
});

test('수첩: 목록(최근 순) → 크게 열기, 옆 목록 펼치기·검색·전환, 삭제', async ({ page }) => {
  writeData([], 0, {
    notes: [
      { id: 'old', title: '오래된 메모', text: '옛날 이야기', updatedMin: -100 },
      { id: 'new', title: '아이디어', text: '사이드 프로젝트 구상', updatedMin: -1 },
    ],
  });
  await open(page, '/notebook');
  const items = page.getByTestId('note-item');
  await expect(items.nth(0)).toContainText('아이디어');
  await expect(items.nth(1)).toContainText('오래된 메모');
  await expect(page.getByTestId('note-page')).toHaveCount(0);

  await items.nth(1).click();
  await expect(page).toHaveURL(/#\/notebook\/old$/);
  await expect(page.getByTestId('note-list')).toHaveCount(0);
  await expect(page.getByTestId('note-title')).toHaveValue('오래된 메모');
  await expect(page.getByTestId('note-body')).toContainText('옛날 이야기');
  await shot(page, 'notebook-full');

  // 목록을 옆에 펼친 채로 다른 페이지로
  const toggle = page.getByTestId('note-list-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('searchbox', { name: '수첩 검색' }).fill('사이드');
  await expect(items).toHaveCount(1);
  await items.first().click();
  await expect(page.getByTestId('note-title')).toHaveValue('아이디어');
  await expect(page.getByTestId('note-side')).toBeVisible();
  await page.getByRole('searchbox', { name: '수첩 검색' }).fill('');
  await toggle.click();
  await expect(page.getByTestId('note-side')).toHaveCount(0);

  await items.first().waitFor({ state: 'detached' });
  await page.goto(page.url().replace(/new$/, 'old'));
  await expect(page.getByTestId('note-title')).toHaveValue('오래된 메모');
  await page.getByTestId('note-delete').click();
  await expect(page).toHaveURL(/#\/notebook$/);
  await expect(items).toHaveCount(1);
  await expect.poll(() => readData().notes.map((n) => n.id), { timeout: 8000 }).toEqual(['new']);
});

test('수첩: 숫자 5 단축키로 이동', async ({ page }) => {
  writeData();
  await open(page, '/daily');
  await page.keyboard.press('5');
  await expect(page).toHaveURL(/#\/notebook/);
});
