import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

import DatePicker from '@/components/ui/DatePicker';
import IconButton from '@/components/ui/IconButton';
import { addDays, daysUntil, fromDateKey, toDateKey, WEEKDAYS } from '@/utils/date';

/** 날짜 이동: ‹ 10월 2일 금요일 › · 오늘 · 달력 */
export default function DayNav({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const d = fromDateKey(date) ?? new Date();
  const diff = daysUntil(date) ?? 0;
  const rel = diff === 0 ? '오늘' : diff === -1 ? '어제' : diff === 1 ? '내일' : diff < 0 ? `${-diff}일 전` : `${diff}일 뒤`;
  const shift = (n: number) => onChange(toDateKey(addDays(d, n)));

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-1">
        <IconButton label="전날" onClick={() => shift(-1)}>
          <ChevronLeft className="size-[18px]" />
        </IconButton>
        <div className="flex flex-col px-1">
          <div className="text-[1.45rem] leading-tight font-extrabold tracking-[-0.03em] tabular-nums sm:text-[1.6rem]" data-testid="day-title">
            {d.getMonth() + 1}월 {d.getDate()}일 {WEEKDAYS[d.getDay()]}요일
          </div>
        </div>
        <IconButton label="다음날" onClick={() => shift(1)}>
          <ChevronRight className="size-[18px]" />
        </IconButton>
      </div>
      <div
        className={`rounded-md px-2 py-0.5 text-xs font-bold ${diff === 0 ? 'bg-accent-soft text-accent-ink' : 'bg-bg-muted text-text-muted'}`}
      >
        {rel}
      </div>
      <div className="ml-auto flex items-center gap-1">
        {diff !== 0 ? (
          <button
            type="button"
            onClick={() => onChange(toDateKey(new Date()))}
            className="h-8 rounded-lg px-3 text-[0.8rem] font-semibold text-text-secondary hover:bg-bg-hover"
          >
            오늘로
          </button>
        ) : null}
        <DatePicker
          value={date}
          onChange={(v) => v && onChange(v)}
          label="날짜로 이동"
          clearable={false}
          triggerClassName="h-8 rounded-lg px-2.5 text-[0.8rem] font-semibold text-text-secondary hover:bg-bg-hover"
          renderTrigger={() => (
            <>
              <CalendarDays className="size-4" />
              <div className="hidden sm:block">달력</div>
            </>
          )}
        />
      </div>
    </div>
  );
}
