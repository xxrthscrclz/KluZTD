import { useSyncStore } from '@/stores/syncStore';
import { formatTime } from '@/utils/date';

const TONE = {
  loading: 'bg-text-muted',
  saved: 'bg-success',
  saving: 'bg-accent animate-pulse',
  offline: 'bg-warn',
  error: 'bg-danger',
} as const;

const LABEL = {
  loading: '불러오는 중',
  saved: '저장됨',
  saving: '저장 중…',
  offline: '이 기기에 보관 중',
  error: '저장 실패',
} as const;

/** 저장 상태 표시 — 점 + (compact 가 아니면) 문구 */
export default function SyncBadge({ compact = false }: { compact?: boolean }) {
  const status = useSyncStore((s) => s.status);
  const message = useSyncStore((s) => s.message);
  const lastSavedAt = useSyncStore((s) => s.lastSavedAt);
  const title = message ?? (lastSavedAt ? `마지막 저장 ${formatTime(lastSavedAt)}` : LABEL[status]);

  return (
    <div className="flex min-w-0 items-center gap-2 text-xs text-text-muted" title={title} data-testid="sync-badge" data-status={status}>
      <div className={`size-2 flex-none rounded-full ${TONE[status]}`} />
      {!compact ? (
        <div className="truncate">
          {LABEL[status]}
          {status === 'saved' && lastSavedAt ? ` · ${formatTime(lastSavedAt)}` : ''}
        </div>
      ) : null}
    </div>
  );
}
