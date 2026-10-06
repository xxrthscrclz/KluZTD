import type { ReactNode } from 'react';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 text-center ${
        compact ? 'px-3 py-8' : 'rounded-2xl border border-dashed border-border-strong px-6 py-16'
      }`}
    >
      {icon ? <div className="mb-1 grid size-11 place-items-center rounded-2xl bg-bg-muted text-text-muted">{icon}</div> : null}
      <div className="text-sm font-semibold text-text-primary">{title}</div>
      {description ? <div className="max-w-sm text-[0.82rem] leading-relaxed text-text-muted">{description}</div> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
