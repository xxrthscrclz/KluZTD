import type { ReactNode } from 'react';

export default function PageHeader({
  title,
  description,
  actions,
  compactOnMobile = false,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** 모바일에서 설명을 숨겨 내용이 위로 올라오게 (제목은 상단 바에 있음) */
  compactOnMobile?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-4 gap-y-3 ${compactOnMobile && !actions ? 'hidden sm:flex' : ''}`}>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="hidden text-[1.6rem] leading-tight font-extrabold tracking-[-0.03em] sm:block">{title}</div>
        {description ? (
          <div className={`text-sm text-text-secondary ${compactOnMobile ? 'hidden sm:block' : ''}`}>{description}</div>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
