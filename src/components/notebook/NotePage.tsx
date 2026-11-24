import { List, Trash2 } from 'lucide-react';

import Button from '@/components/ui/Button';

import NoteEditor from '@/components/editor/NoteEditor';
import IconButton from '@/components/ui/IconButton';
import { useDraftText } from '@/hooks/useDraftText';
import { announceDelete } from '@/lib/feedback';
import { useTaskStore } from '@/stores/taskStore';
import type { Note } from '@/types/task';
import { formatDateTime } from '@/utils/date';

type Props = { note: Note; listOpen: boolean; onToggleList: () => void; onDeleted: () => void };

/** 수첩 한 장 — 제목 + 노션식 본문 (자유공간과 같은 에디터). 쓰는 대로 자동 저장 */
export default function NotePage({ note, listOpen, onToggleList, onDeleted }: Props) {
  const updateNote = useTaskStore((s) => s.updateNote);
  const deleteNote = useTaskStore((s) => s.deleteNote);
  const title = useDraftText(note.title, (next) => updateNote(note.id, { title: next }));

  const remove = () => {
    const undo = deleteNote(note.id);
    onDeleted();
    announceDelete('페이지를 지웠어요', undo);
  };

  return (
    <div className="anim-fade flex min-w-0 flex-col gap-3" data-testid="note-page">
      <div className="flex items-center gap-2">
        <Button
          variant={listOpen ? 'subtle' : 'ghost'}
          size="md"
          icon={<List className="size-4" />}
          onClick={onToggleList}
          aria-pressed={listOpen}
          data-testid="note-list-toggle"
        >
          목록
        </Button>
        <input
          value={title.value}
          onChange={(e) => title.onChange(e.target.value)}
          onBlur={title.commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.currentTarget.blur();
          }}
          placeholder="제목 없음"
          // 빈 새 페이지는 바로 제목부터
          autoFocus={!note.title && !note.doc}
          aria-label="페이지 제목"
          data-testid="note-title"
          className="min-w-0 flex-1 rounded-lg bg-transparent px-1 text-[1.6rem] font-extrabold tracking-[-0.03em] outline-none placeholder:text-text-muted focus:bg-bg-muted"
        />
        <IconButton label="페이지 삭제" onClick={remove} className="hover:!text-danger" data-testid="note-delete">
          <Trash2 className="size-4" />
        </IconButton>
      </div>
      <div className="px-1 text-xs text-text-muted tabular-nums">
        만든 날 {formatDateTime(note.createdAt)} · 고친 날 {formatDateTime(note.updatedAt)} · 자동 저장
      </div>
      <NoteEditor
        key={note.id}
        value={note.doc}
        onChange={(doc) => updateNote(note.id, { doc })}
        placeholder="자유롭게 — '/' 나 아래 막대로 표·체크리스트·코드·수식"
        testId="note-body"
        ariaLabel="페이지 본문"
        toolbarFallback
        frameClassName="min-h-[70dvh] rounded-2xl bg-bg-surface px-6 py-5 shadow-card sm:px-8"
      />
    </div>
  );
}
