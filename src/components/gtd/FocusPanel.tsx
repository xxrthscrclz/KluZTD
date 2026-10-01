import { useMemo } from 'react';

import ItemRow, { REASON_TONE_CLASS } from '@/components/gtd/ItemRow';
import QuickCapture from '@/components/gtd/QuickCapture';
import Button from '@/components/ui/Button';
import { findList } from '@/constants/lists';
import { useGtdStore } from '@/stores/gtdStore';
import { formatDateKo, todayInput } from '@/utils/date';
import { countByList } from '@/utils/item';
import { countDoneToday, rankFocus, type FocusEntry } from '@/utils/priority';

const sectionTitle = 'font-display text-lg font-extrabold text-text-primary';

/** 지금 할 일 — 열린 항목을 먼저 해야 하는 순서로 줄 세우고, 맨 위 하나를 크게 보여 준다 */
export default function FocusPanel() {
  // 셀렉터에서 새 배열을 만들면 무한 리렌더 — 원본만 꺼내 useMemo 로 파생
  const allItems = useGtdStore((s) => s.items);
  const projects = useGtdStore((s) => s.projects);
  const toggleDone = useGtdStore((s) => s.toggleDone);
  const togglePinToday = useGtdStore((s) => s.togglePinToday);
  const setActiveListId = useGtdStore((s) => s.setActiveListId);

  const today = todayInput();
  const ranked = useMemo(() => rankFocus(allItems, today), [allItems, today]);
  const doneToday = useMemo(() => countDoneToday(allItems, today), [allItems, today]);
  const inboxCount = useMemo(() => countByList(allItems, 'inbox'), [allItems]);

  const [top, ...rest] = ranked;
  const mustToday = rest.filter((e) => e.mustToday);
  const later = rest.filter((e) => !e.mustToday);
  const list = findList('focus');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-2xl font-extrabold text-text-primary">
            {list?.title}
          </div>
          <div className="mt-1 text-sm font-medium text-text-secondary">
            {formatDateKo(today)} · {list?.subtitle}
          </div>
        </div>
        <div className="text-right text-sm font-extrabold tabular-nums text-text-muted">
          <div>남은 {ranked.length}개</div>
          {doneToday > 0 ? <div className="text-accent">오늘 {doneToday}개 끝냄</div> : null}
        </div>
      </div>

      <QuickCapture
        list="next"
        pinToday
        label="오늘 할 일"
        placeholder="지금 해야 하는 것 — Enter로 오늘 할 일에 추가 (끝에 ! 붙이면 중요)"
      />

      {inboxCount > 0 ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-warn/25 bg-bg-warn-soft px-4 py-3">
          <div className="text-sm font-bold text-warn">
            수집함에 정리 안 된 항목이 {inboxCount}개 있습니다 — 할 일이면 «다음 행동»으로 옮겨야
            여기 나타납니다.
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActiveListId('inbox')}>
            정리하러 가기
          </Button>
        </div>
      ) : null}

      {top ? (
        <TopCard
          entry={top}
          projectName={projects.find((p) => p.id === top.item.projectId)?.name ?? null}
          onDone={() => toggleDone(top.item.id)}
          onUnpin={top.item.todayPin === today ? () => togglePinToday(top.item.id) : null}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-sm font-medium text-text-muted">
          지금 급한 일이 없습니다. 위에 오늘 할 일을 적거나, «다음 행동»에서 «오늘»을 찍어 보세요.
        </div>
      )}

      {mustToday.length > 0 ? (
        <Section title="오늘 꼭" entries={mustToday} startRank={2} />
      ) : null}
      {later.length > 0 ? (
        <Section
          title={mustToday.length > 0 ? '그다음' : '이어서'}
          entries={later}
          startRank={2 + mustToday.length}
        />
      ) : null}
    </div>
  );
}

function TopCard({
  entry,
  projectName,
  onDone,
  onUnpin,
}: {
  entry: FocusEntry;
  projectName: string | null;
  onDone: () => void;
  onUnpin: (() => void) | null;
}) {
  const { item, reasons } = entry;
  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-accent/30 bg-gradient-to-br from-bg-accent-soft to-bg-surface px-5 py-5 shadow-[var(--shadow-surface)]">
      <div className="text-[0.68rem] font-extrabold tracking-[0.12em] text-accent-ink uppercase">
        지금 이것부터
      </div>
      <div className="font-display text-2xl leading-snug font-extrabold break-words text-text-primary">
        {item.title || '(제목 없음)'}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[0.75rem] font-medium">
        {reasons.map((r) => (
          <div key={r.label} className={`rounded-full px-2 py-0.5 font-bold ${REASON_TONE_CLASS[r.tone]}`}>
            {r.label}
          </div>
        ))}
        {projectName ? (
          <div className="rounded-full bg-bg-surface px-2 py-0.5 font-bold text-accent-ink">
            {projectName}
          </div>
        ) : null}
        {item.context ? <div className="text-text-muted">{item.context}</div> : null}
      </div>
      {item.note ? (
        <div className="line-clamp-3 text-sm leading-relaxed font-medium whitespace-pre-line text-text-secondary">
          {item.note}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button onClick={onDone}>끝냈다</Button>
        {onUnpin ? (
          <Button variant="ghost" onClick={onUnpin}>
            오늘은 안 함
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function Section({
  title,
  entries,
  startRank,
}: {
  title: string;
  entries: FocusEntry[];
  startRank: number;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div className={sectionTitle}>{title}</div>
        <div className="text-sm font-extrabold tabular-nums text-text-muted">{entries.length}개</div>
      </div>
      <div className="flex flex-col gap-2">
        {entries.map((e, idx) => (
          <ItemRow key={e.item.id} item={e.item} rank={startRank + idx} reasons={e.reasons} />
        ))}
      </div>
    </div>
  );
}
