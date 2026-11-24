import { Archive } from 'lucide-react';
import { Link } from 'react-router-dom';

import Board from '@/components/board/Board';
import BoardFilters from '@/components/board/BoardFilters';
import StatusSummary from '@/components/board/StatusSummary';
import PageHeader from '@/components/layout/PageHeader';

export default function StatusPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-3 px-4 pt-3 sm:gap-4 pb-4 sm:h-dvh sm:px-6 sm:pt-7 lg:px-8">
      <PageHeader compactOnMobile title="상태 관리" description="끌어다 놓아 상태를 바꾸세요. 완료한 지 일주일 지난 일은 아카이브로 넘어가요."
        actions={
          <Link
            to="/archive"
            data-testid="archive-nav"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-text-secondary hover:bg-bg-hover hover:text-text-primary"
          >
            <Archive className="size-4" />
            아카이브
          </Link>
        }
      />
      <StatusSummary />
      <BoardFilters />
      <Board />
    </div>
  );
}
