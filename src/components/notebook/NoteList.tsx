import { FilePlus2 } from 'lucide-react';

import Button from '@/components/ui/Button';
import SearchInput from '@/components/ui/SearchInput';
import type { Note } from '@/types/task';
import { formatDateTime } from '@/utils/date';
import { docToText } from '@/utils/doc';

type Props = {
  notes: Note[];
  selectedId: string | null;
  query: string;
  onQuery: (q: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
};

/** 수첩 페이지 목록 — 최근에 고친 순 */
export default function NoteList({ notes, selectedId, query, onQuery, onSelect, onCreate }: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-2" data-testid="note-list">
      <div className="flex items-center gap-2">
        <SearchInput value={query} onChange={onQuery} placeholder="수첩 검색" label="수첩 검색" size="md" className="min-w-0 flex-1" />
        <Button variant="primary" size="md" icon={<FilePlus2 className="size-4" />} onClick={onCreate} data-testid="note-add">
          새 페이지
        </Button>
      </div>

      {notes.map((n) => {
        const preview = docToText(n.doc).split('\n').find((l) => l.trim()) ?? '';
        const active = n.id === selectedId;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onSelect(n.id)}
            aria-current={active}
            data-testid="note-item"
            className={`anim-rise flex flex-col gap-0.5 rounded-xl px-3.5 py-2.5 text-left ${
              active ? 'bg-bg-surface shadow-card ring-2 ring-accent/40' : 'bg-bg-surface/60 hover:bg-bg-surface hover:shadow-card'
            }`}
          >
            <div className={`truncate text-sm font-semibold ${n.title.trim() ? '' : 'text-text-muted'}`}>{n.title.trim() || '제목 없음'}</div>
            {preview ? <div className="truncate text-xs text-text-secondary">{preview}</div> : null}
            <div className="text-[0.68rem] text-text-muted tabular-nums">{formatDateTime(n.updatedAt)}</div>
          </button>
        );
      })}

      {!notes.length ? (
        <div className="rounded-xl border border-dashed border-border-strong px-4 py-6 text-center text-sm text-text-muted">
          {query ? '찾는 페이지가 없어요' : '아직 페이지가 없어요'}
        </div>
      ) : null}
    </div>
  );
}
