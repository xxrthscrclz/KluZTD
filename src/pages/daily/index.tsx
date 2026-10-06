import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import DayDueSection from '@/components/daily/DayDueSection';
import DayChecklist from '@/components/daily/DayChecklist';
import DayIssues from '@/components/daily/DayIssues';
import DayNav from '@/components/daily/DayNav';
import UrgentPanel from '@/components/daily/UrgentPanel';
import type { FocusRequest, HighlightRequest } from '@/components/task/IssueList';
import { useDirection } from '@/hooks/useDirection';
import { useTaskStore } from '@/stores/taskStore';
import { fromDateKey, todayIsoKey } from '@/utils/date';

/**
 * 일일 관리 — 날짜별 페이지.
 * 왼쪽: 그날 체크리스트(= 할 일) → 이날 마감인데 빠진 것 → 그날 이슈
 * 오른쪽: 마감 임박인데 체크리스트에 없는 것 (빨간 알림)
 */
export default function DailyPage() {
  const params = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const today = todayIsoKey();
  const date = params.date && fromDateKey(params.date) ? params.date : today;
  const isToday = date === today;
  const addIssue = useTaskStore((s) => s.addIssue);
  const day = useTaskStore((s) => s.days[date]);
  const [focusIssue, setFocusIssue] = useState<FocusRequest>(null);
  const [highlight, setHighlight] = useState<HighlightRequest>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const slide = useDirection(date);

  // N 단축키 → 할 일 입력칸으로
  useEffect(() => {
    if ((location.state as { focus?: boolean } | null)?.focus) {
      requestAnimationFrame(() => pageRef.current?.querySelector<HTMLInputElement>('[data-testid="day-add"]')?.focus());
    }
  }, [location.state]);

  const go = (next: string) => navigate(next === today ? '/daily' : `/daily/${next}`, { replace: true });

  /** 체크리스트 줄의 '이슈 기록' → 그 줄에 연결된 새 이슈를 열고 커서 */
  const issueFor = (taskId: string) => {
    const id = addIssue(date, taskId);
    setFocusIssue((f) => ({ id, token: (f?.token ?? 0) + 1 }));
  };

  /** 줄의 이슈 아이콘 → 새로 만들지 않고, 그 할 일에 연결된 이슈로 이동·강조 */
  const showIssues = (taskId: string) => {
    const ids = (day?.issues ?? []).filter((i) => i.taskId === taskId).map((i) => i.id);
    if (ids.length) setHighlight((h) => ({ ids, token: (h?.token ?? 0) + 1 }));
  };

  return (
    <div ref={pageRef} className="@container mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 pt-4 pb-28 sm:px-8 sm:pt-7 sm:pb-24">
      <DayNav date={date} onChange={go} />

      <div className="grid grid-cols-1 gap-5 @4xl:grid-cols-[minmax(0,1fr)_19rem]">
        {/* 좁으면 알림이 위, 넓으면 오른쪽 */}
        <div className="@4xl:order-2">
          <div className="@4xl:sticky @4xl:top-7">
            <UrgentPanel />
          </div>
        </div>

        <div key={date} className={`flex min-w-0 flex-col gap-5 @4xl:order-1 ${slide}`}>
          {/* 체크리스트 = 그날 올린 할 일 (상태 관리 카드와 같은 것) */}
          <div className="rounded-2xl bg-bg-surface px-3 py-4 shadow-card sm:px-5">
            <DayChecklist date={date} isToday={isToday} onIssue={issueFor} onShowIssues={showIssues} />
            {/* 오늘은 빨간 알림이 같은 걸 보여 주므로 다른 날짜에서만 */}
            {!isToday ? <DayDueSection date={date} /> : null}
          </div>

          <DayIssues date={date} focusRequest={focusIssue} highlight={highlight} />
        </div>
      </div>
    </div>
  );
}
