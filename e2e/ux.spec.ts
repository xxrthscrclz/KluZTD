import { expect, test } from '@playwright/test';

import { dateKey, open, shot, writeData, openScratch } from './helpers';

/** UX 확인용 스크린샷 — e2e/.shots/ 에 저장 (사람이 보고 판단) */
const note = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: '진행 방법' }] },
    {
      type: 'taskList',
      content: [
        { type: 'taskItem', attrs: { checked: true }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '사진 30장 추리기' }] }] },
        { type: 'taskItem', attrs: { checked: false }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '캡션 쓰기' }] }] },
      ],
    },
    { type: 'callout', attrs: { variant: 'warn' }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '금요일까지 학교 제출' }] }] },
  ],
};

test.beforeEach(() =>
  writeData(
    [
      { id: 't1', title: '국민대 해커톤 결과보고서', status: 'todo', priority: 'high', due: dateKey(-1), note },
      { id: 't2', title: 'eduflow 로그인 화면', status: 'todo', priority: 'normal', due: dateKey(3) },
      { id: 't3', title: '다음 분기 교육 일정표', status: 'todo', priority: 'low' },
      {
        id: 'd1',
        title: 'LiteLLM Claude 붙이기',
        status: 'doing',
        priority: 'high',
        due: dateKey(0),
        issues: [
          { text: '프록시 401 — 헤더 이름 문제', resolved: true },
          { text: '스트리밍 응답이 끊김, 타임아웃 확인 필요', resolved: false },
        ],
      },
      { id: 'd2', title: 'eduflow 개발 진행', status: 'doing', priority: 'normal' },
      { id: 'w1', title: '교수님께 진행사항 전달', status: 'waiting', delegate: '김교수', due: dateKey(0) },
      { id: 'w2', title: '수료증 디자인 시안', status: 'waiting', delegate: '디자인팀' },
      { id: 'x1', title: '경희대 AI Beyond Coding Academy 결과보고서', status: 'done' },
      { id: 'r1', title: '결과보고서 사진 고르기', status: 'done', plannedOn: dateKey(0), projectId: 'kmu' },
      { id: 'r2', title: '교수님께 메일', status: 'todo', plannedOn: dateKey(0), due: dateKey(1), delegate: '김교수', projectId: 'kmu' },
      { id: 'r3', title: '회의록 정리', status: 'todo', plannedOn: dateKey(0) },
      { id: 'u1', title: '국민대 OT 자료', status: 'todo', due: dateKey(2), projectId: 'kmu' },
    ],
    0,
    {
      days: {
        [dateKey(0)]: {
          issues: [{ text: '사진 해상도 낮음 — 원본 다시 요청', taskId: 'r1' }, { text: '오후 회의 2개, 예산 확정' }],
        },
      },
      projects: [
        { id: 'kmu', name: '국민대 캠타', color: 2 },
        { id: 'llm', name: 'LiteLLM', color: 4 },
      ],
    },
  ),
);

for (const scheme of ['light', 'dark'] as const) {
  test(`화면 캡처 (${scheme})`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme });
    const tag = `${info.project.name}-${scheme}`;
    const mobile = info.project.name === 'mobile';

    await open(page, '/daily');
    await expect(page.getByTestId('day-item').first()).toBeVisible();
    await page.waitForTimeout(400);
    await shot(page, `${tag}-daily`);

    await page.getByTestId('day-issues').getByTestId('issue-editor').first().click();
    await page.keyboard.press('End');
    await page.keyboard.type(' 비용 ');
    await page.getByTestId('tool-math').click();
    await page.getByRole('textbox', { name: 'LaTeX' }).fill('C = \\frac{n}{1000} \\times p');
    await page.waitForTimeout(300);
    await shot(page, `${tag}-daily-math`);
    await page.keyboard.press('Enter');

    await openScratch(page);
    await page.getByTestId('scratch-note').click();
    await page.keyboard.type('## 링크');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- 사내 위키');
    await page.waitForTimeout(300);
    await shot(page, `${tag}-scratch`);
    await page.getByTestId('scratch-close').click();

    await open(page, '/status');
    await expect(page.getByTestId('task-card').first()).toBeVisible();
    await page.waitForTimeout(400);
    await shot(page, `${tag}-status`);
    if (mobile) await page.getByTestId('tab-doing').click();
    await page.getByTestId('task-card').filter({ hasText: 'LiteLLM Claude 붙이기' }).click();
    await expect(page.getByTestId('task-drawer')).toBeVisible();
    await page.waitForTimeout(500);
    await shot(page, `${tag}-drawer`);
    await page.getByTestId('drawer-close').click();

    await open(page, '/calendar');
    await expect(page.getByTestId('cal-day').first()).toBeVisible();
    await page.waitForTimeout(400);
    await shot(page, `${tag}-calendar`);

    await open(page, '/projects');
    if (mobile) await page.getByTestId('project-item').first().click();
    await expect(page.getByTestId('project-detail')).toBeVisible();
    await page.waitForTimeout(400);
    await shot(page, `${tag}-projects`);
  });
}
