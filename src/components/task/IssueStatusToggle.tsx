import { CheckCircle2, CircleAlert } from 'lucide-react';

/** 이슈 해결/미해결 토글 칩 */
export default function IssueStatusToggle({ resolved, onToggle }: { resolved: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={resolved}
      aria-label={resolved ? '해결됨 — 눌러서 미해결로' : '미해결 — 눌러서 해결로'}
      data-testid="issue-toggle"
      className={`flex h-6 flex-none items-center gap-1 rounded-md px-1.5 text-[0.72rem] font-bold transition-opacity hover:opacity-80 ${
        resolved ? 'bg-status-done-soft text-status-done' : 'bg-danger-soft text-danger'
      }`}
    >
      {resolved ? <CheckCircle2 className="size-3.5" /> : <CircleAlert className="size-3.5" />}
      {resolved ? '해결됨' : '미해결'}
    </button>
  );
}
