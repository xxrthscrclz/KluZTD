import { expect, test } from '@playwright/test';

import { dateKey, open, readData, waitSaved, writeData } from './helpers';

test.beforeEach(() => writeData([{ id: 'k', title: '아무 일', status: 'todo' }]));

test('자유공간: 어느 화면에서나 오른쪽 책갈피로 펼치고 접는다', async ({ page }) => {
  for (const route of ['/daily', '/status']) {
    await open(page, route);
    await expect(page.getByTestId('scratch-tab')).toBeVisible();
  }
  await page.getByTestId('scratch-tab').click();
  const panel = page.getByTestId('scratch-panel');
  await expect(panel).toHaveAttribute('data-open', 'true');
  await page.getByTestId('scratch-note').click();
  await page.keyboard.type('자주 쓰는 링크 모음');

  // 펼친 채로 화면을 옮겨도 그대로
  await page.getByRole('link', { name: /일일 관리/ }).first().click();
  await expect(panel).toHaveAttribute('data-open', 'true');
  await expect(page.getByTestId('scratch-note')).toContainText('자주 쓰는 링크 모음');

  await page.getByTestId('scratch-close').click();
  await expect(panel).toHaveAttribute('data-open', 'false');
  await expect(page.getByTestId('scratch-tab')).toBeVisible();

  // 상세 패널 위에서도 열 수 있다
  await open(page, '/status');
  await page.getByTestId('task-card').click();
  await expect(page.getByTestId('task-drawer')).toBeVisible();
  await page.getByTestId('scratch-tab').click();
  await expect(panel).toHaveAttribute('data-open', 'true');

  await waitSaved(page);
  expect(JSON.stringify(readData().scratch)).toContain('자주 쓰는 링크 모음');
});

test('자유공간: M 단축키, 새로고침해도 펼침 상태 유지', async ({ page }) => {
  await open(page, '/status');
  await page.keyboard.press('m');
  await expect(page.getByTestId('scratch-panel')).toHaveAttribute('data-open', 'true');
  await page.reload();
  await expect(page.getByTestId('scratch-panel')).toHaveAttribute('data-open', 'true');
  await page.locator('body').click({ position: { x: 300, y: 600 } });
  await page.keyboard.press('m');
  await expect(page.getByTestId('scratch-panel')).toHaveAttribute('data-open', 'false');
});

test('메모 칸: 글 아래 빈 곳이나 여백을 눌러도 커서가 들어간다', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('scratch-tab').click();
  const panel = page.getByTestId('scratch-panel');
  await expect(panel).toHaveAttribute('data-open', 'true');
  // 패널은 미리 만들어져 화면 밖에 있다가 들어오므로, 제자리에 온 뒤 위치를 잰다
  await expect.poll(async () => (await panel.boundingBox())!.x).toBeLessThan(page.viewportSize()!.width - 100);
  const box = (await panel.boundingBox())!;
  // 패널 아래쪽 빈 곳
  await page.mouse.click(box.x + box.width / 2, box.y + box.height - 80);
  await expect(page.getByTestId('scratch-note')).toBeFocused();
  await page.keyboard.type('아래를 눌러도 써진다');
  await expect(page.getByTestId('scratch-note')).toContainText('아래를 눌러도 써진다');

  // 상세 패널 메모 상자의 여백
  await page.getByTestId('scratch-close').click();
  await page.getByTestId('task-card').click();
  const frame = page.getByTestId('note-editor').locator('..').locator('..');
  const fb = (await frame.boundingBox())!;
  await page.mouse.click(fb.x + fb.width - 12, fb.y + fb.height - 6);
  await expect(page.getByTestId('note-editor')).toBeFocused();
});

for (const width of [1100, 1280, 1440]) {
  test(`자유공간을 펼쳐도 잘리지 않는다 (${width}px)`, async ({ page }) => {
    writeData([{ id: 'w', title: '교수님께 메일 보내고 일정 확인하기', status: 'todo', plannedOn: dateKey(0), due: dateKey(1), delegate: '김교수님', projectId: 'p' }], 0, {
      projects: [{ id: 'p', name: '국민대 캠퍼스타운 AI', color: 2 }],
    });
    await page.setViewportSize({ width, height: 860 });
    await open(page, '/daily');
    await page.getByTestId('scratch-tab').click();
    await expect(page.getByTestId('scratch-panel')).toHaveAttribute('data-open', 'true');
    await page.waitForTimeout(300);
    const panel = (await page.getByTestId('scratch-panel').boundingBox())!;

    // 제목이 충분히 보이고, 줄 전체가 자유공간에 가리지 않는다
    const title = (await page.getByTestId('day-item').getByRole('textbox', { name: '할 일' }).boundingBox())!;
    expect(title.width).toBeGreaterThan(140);
    const row = (await page.getByTestId('day-item').boundingBox())!;
    expect(row.x + row.width).toBeLessThanOrEqual(panel.x + 1);

    // 상세를 열면 자유공간 왼쪽에 나란히
    await page.getByTestId('row-info').click();
    await page.getByRole('button', { name: '자세히 (메모)' }).click();
    const drawer = (await page.getByTestId('task-drawer').boundingBox())!;
    expect(drawer.x + drawer.width).toBeLessThanOrEqual(panel.x + 1);
    await expect(page.getByTestId('task-drawer').getByTestId('field-delegate')).toBeInViewport();
  });
}

test('책갈피는 항상 맨 앞 — 상세가 열려 있어도 누를 수 있고, 펼치면 패널 가장자리를 따라간다', async ({ page }) => {
  await open(page, '/status');
  await page.getByTestId('task-card').click();
  await expect(page.getByTestId('task-drawer')).toBeVisible();
  const tab = page.getByTestId('scratch-tab');
  await tab.click(); // 가려져 있으면 여기서 실패
  await expect(page.getByTestId('scratch-panel')).toHaveAttribute('data-open', 'true');
  const panel = (await page.getByTestId('scratch-panel').boundingBox())!;
  await expect.poll(async () => {
    const b = (await tab.boundingBox())!;
    return Math.round(b.x + b.width - panel.x);
  }).toBeLessThanOrEqual(2);
  // 책갈피를 다시 누르면 접힌다
  await tab.click();
  await expect(page.getByTestId('scratch-panel')).toHaveAttribute('data-open', 'false');
});
