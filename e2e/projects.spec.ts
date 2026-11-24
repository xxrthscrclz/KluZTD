import { expect, test } from '@playwright/test';

import { center, dateKey, liveFileTasks, mouseDrag, open, readData, waitSaved, writeData } from './helpers';

test.beforeEach(() =>
  writeData(
    [
      { id: 'a', title: 'OT 자료 만들기', status: 'todo', due: dateKey(5), projectId: 'kmu' },
      { id: 'b', title: '강사 섭외', status: 'doing', due: dateKey(1), projectId: 'kmu', issues: [{ text: '일정이 안 맞음', resolved: false }] },
      { id: 'c', title: '장소 예약', status: 'done', projectId: 'kmu', completedAt: new Date().toISOString() },
      { id: 'd', title: '마감 없는 정리', status: 'todo', projectId: 'kmu' },
      { id: 'e', title: '다른 프로젝트 일', status: 'todo', projectId: 'llm' },
      { id: 'f', title: '프로젝트 없는 일', status: 'todo' },
    ],
    0,
    {
      projects: [
        { id: 'kmu', name: '국민대 캠타', color: 2 },
        { id: 'llm', name: 'LiteLLM', color: 4 },
      ],
      days: { [dateKey(0)]: { issues: [{ text: '교수님 피드백 반영', taskId: 'a' }] } },
    },
  ),
);

test('프로젝트: Next Action 은 마감일 순, 한 일은 날짜별로', async ({ page }) => {
  await open(page, '/projects');
  await page.getByTestId('project-item').filter({ hasText: '국민대 캠타' }).click();
  const detail = page.getByTestId('project-detail');
  await expect(page.getByTestId('project-name')).toHaveValue('국민대 캠타');

  const next = detail.getByTestId('project-next-item');
  await expect(next).toHaveCount(3);
  await expect(next.nth(0)).toContainText('강사 섭외'); // 내일 마감
  await expect(next.nth(1)).toContainText('OT 자료 만들기'); // 5일 뒤
  await expect(next.nth(2)).toContainText('마감 없는 정리');

  const timeline = page.getByTestId('project-timeline');
  await expect(timeline).toContainText('장소 예약'); // 완료
  await expect(timeline).toContainText('일정이 안 맞음'); // 할 일 이슈
  await expect(timeline).toContainText('교수님 피드백 반영'); // 일일 관리에서 연결한 이슈
  await expect(detail).not.toContainText('다른 프로젝트 일');

  // Next Action 체크 → 완료로 이동, 한 일에 쌓임
  await next.nth(0).getByRole('checkbox').click();
  await expect(detail.getByTestId('project-next-item')).toHaveCount(2);
  await expect(timeline.getByTestId('project-timeline-entry').first()).toContainText('강사 섭외');
});

test('프로젝트 만들기·이름 바꾸기·할 일 추가·삭제(할 일은 남음)', async ({ page }) => {
  await open(page, '/projects');
  await page.getByTestId('project-add').fill('eduFlow');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('project-name')).toHaveValue('eduFlow');

  await page.getByTestId('project-task-add').fill('로그인 화면');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('project-next-item')).toContainText('로그인 화면');

  const name = page.getByTestId('project-name');
  await name.fill('eduFlow v2');
  await name.press('Enter');
  await expect(page.getByTestId('project-item').filter({ hasText: 'eduFlow v2' })).toBeVisible();

  await waitSaved(page);
  const proj = readData().projects.find((p) => p.name === 'eduFlow v2')!;
  expect(liveFileTasks().find((t) => t.title === '로그인 화면')).toMatchObject({ projectId: proj.id, status: 'todo' });

  await page.getByRole('button', { name: '프로젝트 삭제' }).click();
  await expect(page.getByTestId('project-item').filter({ hasText: 'eduFlow v2' })).toHaveCount(0);
  await waitSaved(page);
  expect(readData().projects.map((p) => p.name)).not.toContain('eduFlow v2');
  expect(liveFileTasks().find((t) => t.title === '로그인 화면')!.projectId).toBeNull();
});

test('상태 관리: 카드에 프로젝트, 프로젝트로 필터, 상세에서 프로젝트 지정', async ({ page }) => {
  await open(page, '/status');
  await expect(page.getByTestId('task-card').filter({ hasText: 'OT 자료 만들기' })).toContainText('국민대 캠타');

  await page.getByRole('button', { name: '프로젝트 필터' }).click();
  await page.getByRole('option', { name: 'LiteLLM' }).click();
  await expect(page.getByTestId('task-card')).toHaveCount(1);
  await page.getByRole('button', { name: '초기화' }).click();

  await page.getByTestId('task-card').filter({ hasText: '프로젝트 없는 일' }).click();
  await page.getByTestId('field-project').click();
  await page.getByRole('option', { name: 'LiteLLM' }).click();
  await page.getByTestId('drawer-close').click();
  await waitSaved(page);
  expect(liveFileTasks().find((t) => t.id === 'f')!.projectId).toBe('llm');
});

test('프로젝트: Next Action 을 끌어서 순서 바꾸기 — 저장되고 새 할 일은 아래에', async ({ page }) => {
  await open(page, '/projects/kmu');
  const next = page.getByTestId('project-next-item');
  await expect(next.nth(0)).toContainText('강사 섭외');

  // '마감 없는 정리' 를 맨 위로
  const last = next.nth(2);
  await last.hover();
  await mouseDrag(page, await center(last.getByTestId('project-next-grip')), await center(next.nth(0)));
  await expect(next.nth(0)).toContainText('마감 없는 정리');
  await expect(next.nth(1)).toContainText('강사 섭외');
  await expect(next.nth(2)).toContainText('OT 자료 만들기');

  await waitSaved(page);
  const order = (id: string) => liveFileTasks().find((t) => t.id === id)!.projectOrder;
  expect(order('d')).toBeLessThan(order('b')!);
  expect(order('b')).toBeLessThan(order('a')!);

  // 새로고침해도 그대로
  await page.reload();
  await expect(next.nth(0)).toContainText('마감 없는 정리');
});

test('프로젝트 Next Action ↔ 상태 관리 ↔ 체크리스트 연동', async ({ page }) => {
  const nav = (name: RegExp) => page.getByRole('link', { name }).first().click();
  const row = (title: string) => page.getByTestId('project-next-item').filter({ hasText: title });

  await open(page, '/projects/kmu');
  await expect(row('OT 자료 만들기')).toContainText('진행 예정');
  await expect(row('강사 섭외')).toContainText('진행 중');

  // 상태 관리에서 진행 중으로 → 프로젝트 배지도 진행 중, 오늘 체크리스트에도
  await nav(/상태 관리/);
  const card = page.getByTestId('column-todo').getByTestId('task-card').filter({ hasText: 'OT 자료 만들기' });
  await mouseDrag(page, await center(card), await center(page.getByTestId('column-doing').getByTestId('task-card').first()));
  await expect(page.getByTestId('column-doing')).toContainText('OT 자료 만들기');
  await nav(/프로젝트/);
  await page.getByTestId('project-item').filter({ hasText: '국민대 캠타' }).click();
  await expect(row('OT 자료 만들기')).toContainText('진행 중');
  await expect(row('OT 자료 만들기')).toContainText('오늘 체크리스트');

  // 체크리스트에서 체크 → Next Action 에서 빠지고 한 일에 완료로
  await nav(/일일 관리/);
  const item = page.getByTestId('day-item').filter({ has: page.locator('input[value="OT 자료 만들기"]') });
  await item.getByRole('checkbox').click();
  await expect(item).toHaveAttribute('data-done', 'true');
  await nav(/프로젝트/);
  await page.getByTestId('project-item').filter({ hasText: '국민대 캠타' }).click();
  await expect(row('OT 자료 만들기')).toHaveCount(0);
  await expect(page.getByTestId('project-timeline')).toContainText('OT 자료 만들기');

  // 프로젝트에서 체크 → 상태 관리 진행 완료 / 프로젝트에서 추가 → 진행 예정
  await row('마감 없는 정리').getByRole('checkbox').click();
  await expect(row('마감 없는 정리')).toHaveCount(0);
  await page.getByPlaceholder(/이 프로젝트에 할 일 추가/).fill('발표 리허설');
  await page.keyboard.press('Enter');
  await expect(row('발표 리허설')).toContainText('진행 예정');
  await nav(/상태 관리/);
  await expect(page.getByTestId('column-done')).toContainText('마감 없는 정리');
  await expect(page.getByTestId('column-done')).toContainText('OT 자료 만들기');
  await expect(page.getByTestId('column-todo')).toContainText('발표 리허설');

  await waitSaved(page);
  const t = Object.fromEntries(liveFileTasks().map((x) => [x.title, x]));
  expect(t['OT 자료 만들기']).toMatchObject({ status: 'done', plannedOn: dateKey(0), projectId: 'kmu' });
  expect(t['마감 없는 정리'].status).toBe('done');
  expect(t['발표 리허설']).toMatchObject({ status: 'todo', projectId: 'kmu' });
});
