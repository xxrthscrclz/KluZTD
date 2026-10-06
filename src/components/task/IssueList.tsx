import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

import NoteEditor, { type NoteEditorHandle } from '@/components/editor/NoteEditor';
import IssueStatusToggle from '@/components/task/IssueStatusToggle';
import Button from '@/components/ui/Button';
import IconButton from '@/components/ui/IconButton';
import { exitMs } from '@/lib/motion';
import type { Doc, Issue } from '@/types/task';
import { formatDateTime } from '@/utils/date';
import { isDocEmpty } from '@/utils/doc';

export type FocusRequest = { id: string; token: number } | null;
/** 이 이슈들을 강조하고 첫 번째로 스크롤 (token 이 바뀔 때마다 다시) */
export type HighlightRequest = { ids: string[]; token: number } | null;

type Props<T extends Issue> = {
  issues: T[];
  onAdd: () => string;
  onDoc: (id: string, doc: Doc) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  title?: string;
  emptyTitle?: string;
  emptyHint?: string;
  /** 이 이슈들을 강조 */
  highlight?: HighlightRequest;
  /** 바깥에서 특정 이슈로 포커스 요청 (예: 체크리스트 줄의 '이슈 기록') */
  focusRequest?: FocusRequest;
  /** 이슈 머리에 덧붙일 것 (예: 관련 할 일 선택) */
  renderMeta?: (issue: T) => ReactNode;
  placeholder?: string;
  testId?: string;
};

function IssueEntry<T extends Issue>({
  issue,
  focusToken,
  highlightToken,
  scrollOnHighlight,
  onDoc,
  onToggle,
  onDelete,
  meta,
  placeholder,
}: {
  issue: T;
  focusToken: number;
  /** 0 이 아니면 강조 (바뀔 때마다 다시 번쩍) */
  highlightToken: number;
  scrollOnHighlight: boolean;
  onDoc: (doc: Doc) => void;
  onToggle: () => void;
  onDelete: () => void;
  meta?: ReactNode;
  placeholder: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const editorRef = useRef<NoteEditorHandle>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!focusToken) return;
    editorRef.current?.focus();
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focusToken]);

  useEffect(() => {
    const el = ref.current;
    if (!highlightToken || !el) return;
    if (scrollOnHighlight) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el.classList.remove('anim-flash');
    void el.offsetWidth; // 다시 번쩍이게
    el.classList.add('anim-flash');
  }, [highlightToken, scrollOnHighlight]);

  return (
    <div
      ref={ref}
      data-testid="issue-entry"
      data-resolved={issue.resolved}
      className={`group/issue relative flex flex-col gap-2 rounded-xl border bg-bg-surface px-4 pt-2.5 transition-[border-color] ${
        issue.resolved ? 'border-border-default' : 'border-danger/25'
      } ${leaving ? 'anim-sink' : 'anim-rise'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <IssueStatusToggle resolved={issue.resolved} onToggle={onToggle} />
        <div className="text-xs text-text-muted tabular-nums">{formatDateTime(issue.createdAt)}</div>
        {meta}
        <IconButton
          label="이슈 삭제"
          size="sm"
          onClick={() => {
            setLeaving(true);
            setTimeout(onDelete, exitMs());
          }}
          className="ml-auto opacity-100 hover:!text-danger sm:opacity-0 sm:group-hover/issue:opacity-100 sm:focus-visible:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>
      <NoteEditor
        ref={editorRef}
        value={issue.doc}
        onChange={onDoc}
        placeholder={placeholder}
        testId="issue-editor"
        ariaLabel="이슈 내용"
        frameClassName="-mx-4 px-4 pb-3.5 pt-0.5"
      />
    </div>
  );
}

/** 이슈 기록 목록 — 최신이 위. 할 일 상세와 오늘 페이지가 같이 쓴다 */
export default function IssueList<T extends Issue>({
  issues,
  onAdd,
  onDoc,
  onToggle,
  onDelete,
  title = '이슈 기록',
  emptyTitle = '아직 기록이 없어요',
  emptyHint = '진행하면서 생긴 문제, 결정한 것, 다음에 할 것을 남겨 두세요.',
  highlight = null,
  focusRequest = null,
  renderMeta,
  placeholder = "무슨 일이 있었나요? 막힌 것, 결정한 것, 다음에 할 것 — '/' 로 블록 추가",
  testId = 'issue-log',
}: Props<T>) {
  const [focus, setFocus] = useState<FocusRequest>(null);
  const sorted = issues.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const open = sorted.filter((i) => !i.resolved).length;

  useEffect(() => {
    if (focusRequest) setFocus(focusRequest);
  }, [focusRequest]);

  const add = () => {
    // 방금 만든 빈 기록이 있으면 새로 만들지 않고 그걸로
    const blank = sorted.find((i) => isDocEmpty(i.doc));
    const id = blank?.id ?? onAdd();
    setFocus((f) => ({ id, token: (f?.token ?? 0) + 1 }));
  };

  return (
    <div className="flex flex-col gap-3" data-testid={testId}>
      <div className="flex items-center gap-2">
        <div className="text-[0.95rem] font-bold">{title}</div>
        {sorted.length ? (
          <div className="text-xs font-semibold text-text-muted tabular-nums">
            {sorted.length}개{open ? ` · 미해결 ${open}` : ''}
          </div>
        ) : null}
        <Button size="sm" variant="subtle" className="ml-auto" icon={<Plus className="size-3.5" />} onClick={add} data-testid="add-issue">
          기록 추가
        </Button>
      </div>
      {sorted.length ? (
        <div className="flex flex-col gap-2.5">
          {sorted.map((issue) => (
            <IssueEntry
              key={issue.id}
              issue={issue}
              focusToken={focus?.id === issue.id ? focus.token : 0}
              highlightToken={highlight?.ids.includes(issue.id) ? highlight.token : 0}
              scrollOnHighlight={issue.id === sorted.find((i) => highlight?.ids.includes(i.id))?.id}
              onDoc={(doc) => onDoc(issue.id, doc)}
              onToggle={() => onToggle(issue.id)}
              onDelete={() => onDelete(issue.id)}
              meta={renderMeta?.(issue)}
              placeholder={placeholder}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={add}
          className="flex flex-col items-start gap-1 rounded-xl border border-dashed border-border-strong px-4 py-3.5 text-left text-sm text-text-muted hover:border-accent/40 hover:bg-bg-hover"
        >
          <div className="font-semibold text-text-secondary">{emptyTitle}</div>
          <div className="text-xs">{emptyHint}</div>
        </button>
      )}
    </div>
  );
}
