import { expect, test, type Locator } from '@playwright/test';

import { open, writeData } from './helpers';

// 이 파일만 실제 모션으로
test.use({ reducedMotion: 'no-preference' });

test.beforeEach(() => writeData([{ id: 'k', title: '모션 확인', status: 'todo' }]));

/** 요소의 애니메이션 시간(초)·곡선 */
async function animationOf(el: Locator) {
  return el.evaluate((node) => {
    const cs = getComputedStyle(node);
    return { name: cs.animationName, duration: parseFloat(cs.animationDuration), easing: cs.animationTimingFunction };
  });
}

function expectRange(seconds: number) {
  expect(seconds).toBeGreaterThanOrEqual(0.5);
  expect(seconds).toBeLessThanOrEqual(1.0);
}

test('반응(hover·색 바뀜)은 0.5초 ease', async ({ page }) => {
  await open(page, '/status');
  const btn = page.getByRole('link', { name: /일일 관리/ }).first();
  const t = await btn.evaluate((n) => {
    const cs = getComputedStyle(n);
    return { duration: parseFloat(cs.transitionDuration), easing: cs.transitionTimingFunction };
  });
  expectRange(t.duration);
  expect(t.easing).toBe('ease');
});

test('화면 전환: 들어올 때 떠오른다 (0.5~1.0초 ease)', async ({ page }) => {
  await open(page, '/status');
  await page.getByRole('link', { name: /달력/ }).first().click();
  // 새 화면(달력)의 컨테이너 — 바뀌는 순간 옛 컨테이너를 잡지 않게
  const container = page.locator('.anim-page', { has: page.getByTestId('calendar') });
  await expect(container).toHaveCount(1);
  const a = await animationOf(container);
  expect(a.name).toBe('kz-page');
  expectRange(a.duration);
  expect(a.easing).toBe('ease');
});

test('자유공간: 누르자마자 보이며 미끄러져 나오고(0.5초 ease), 접으면 미끄러져 들어간다', async ({ page }) => {
  await open(page, '/status');
  await page.waitForTimeout(1200); // 한가할 때 미리 만들어 둔다
  const panel = page.getByTestId('scratch-panel');
  await expect(panel).toHaveCount(1);
  const t = await panel.evaluate((n) => {
    const cs = getComputedStyle(n);
    return { duration: parseFloat(cs.transitionDuration), easing: cs.transitionTimingFunction };
  });
  expectRange(t.duration);
  expect(t.easing).toBe('ease');

  // 누르고 0.08초 뒤 이미 화면 안으로 들어오고 있고, 투명하지 않다
  const firstFrame = await page.evaluate(async () => {
    (document.querySelector('[data-testid="scratch-tab"]') as HTMLElement).click();
    await new Promise((r) => setTimeout(r, 80));
    const el = document.querySelector('[data-testid="scratch-panel"]') as HTMLElement;
    const cs = getComputedStyle(el);
    return { opacity: Number(cs.opacity), left: el.getBoundingClientRect().left };
  });
  expect(firstFrame.opacity).toBe(1);
  expect(firstFrame.left).toBeLessThan(page.viewportSize()!.width); // 이미 보이는 영역에 걸쳐 있음
  await expect(panel).toHaveAttribute('data-open', 'true');

  await page.getByTestId('scratch-close').click();
  await expect(panel).toHaveAttribute('data-open', 'false');
  await expect.poll(async () => (await panel.boundingBox())!.x, { timeout: 2000 }).toBeGreaterThanOrEqual(page.viewportSize()!.width);
});

test('상세 패널: 열고 닫을 때 모두 움직인다', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('task-card').click();
  const drawer = page.getByTestId('task-drawer');
  expectRange((await animationOf(drawer)).duration);
  await page.getByTestId('drawer-close').click();
  await expect(drawer).toHaveClass(/anim-slide-out-right/);
  await expect(drawer).toHaveCount(0, { timeout: 2000 });
});

test('선택 목록(커스텀 select): 열림·닫힘 애니메이션', async ({ page }) => {
  await open(page, '/status');
  await page.getByRole('button', { name: '우선순위 필터' }).click();
  const list = page.getByRole('listbox', { name: '우선순위 필터' });
  const panel = list.locator('..');
  await expect(list).toBeVisible();
  expectRange((await animationOf(panel)).duration);
  await page.keyboard.press('Escape');
  await expect(panel).toHaveClass(/anim-pop-out/);
  await expect(list).toHaveCount(0, { timeout: 2000 });
});

test('클릭하면 눌림 효과', async ({ page }) => {
  await open(page, '/status');
  const btn = page.getByRole('button', { name: '우선순위 필터' });
  await btn.dispatchEvent('pointerdown', { button: 0, bubbles: true });
  await expect(btn).toHaveClass(/kz-press/);
  const a = await animationOf(btn);
  expect(a.name).toBe('kz-press');
  expectRange(a.duration);
});

test('체크리스트 줄: 추가되면 떠오르고, 지우면 접히며 사라진다', async ({ page }) => {
  await open(page, '/daily');
  await page.getByTestId('day-add').fill('사라질 줄');
  await page.keyboard.press('Enter');
  const row = page.getByTestId('day-item').first();
  expect((await animationOf(row)).name).toBe('kz-rise');
  await row.getByTestId('row-info').click();
  await page.getByRole('button', { name: '삭제' }).click();
  await expect(row).toHaveClass(/anim-collapse/);
  await expect(page.getByTestId('day-item')).toHaveCount(0, { timeout: 2000 });
});

test('날짜를 넘기면 좌우로 밀려 들어온다', async ({ page }) => {
  await open(page, '/daily');
  await page.getByRole('button', { name: '다음날' }).click();
  await expect(page.locator('.anim-from-right')).toHaveCount(1);
  await page.getByRole('button', { name: '전날' }).click();
  await expect(page.locator('.anim-from-left')).toHaveCount(1);
});

test('들어오는 애니메이션은 끝나면 transform 을 남기지 않는다 (fixed 좌표 기준이 바뀌지 않게)', async ({ page }) => {
  await open(page, '/status');
  await page.waitForTimeout(1200);
  const leftovers = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[class*="anim-"]'))
      .filter((el) => !/anim-(lift|.*-out|sink|collapse)/.test(el.className))
      .map((el) => getComputedStyle(el).translate)
      .filter((t) => t !== 'none'),
  );
  expect(leftovers).toEqual([]);
});
