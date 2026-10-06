import Board from '@/components/board/Board';
import BoardFilters from '@/components/board/BoardFilters';
import StatusSummary from '@/components/board/StatusSummary';
import PageHeader from '@/components/layout/PageHeader';

export default function StatusPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-3 px-4 pt-3 sm:gap-4 pb-4 sm:h-dvh sm:px-6 sm:pt-7 lg:px-8">
      <PageHeader compactOnMobile title="상태 관리" description="끌어다 놓아 상태를 바꾸세요. 마감일을 정하면 그 날짜의 일일 관리에도 보여요." />
      <StatusSummary />
      <BoardFilters />
      <Board />
    </div>
  );
}
