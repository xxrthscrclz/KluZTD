import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import PageHeader from '@/components/layout/PageHeader';
import NoteList from '@/components/notebook/NoteList';
import NotePage from '@/components/notebook/NotePage';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useTaskStore } from '@/stores/taskStore';
import { docToText } from '@/utils/doc';

const LIST_KEY = 'kluztd:notebook:list';
const readListPref = () => {
  try {
    return localStorage.getItem(LIST_KEY) === '1';
  } catch {
    return false;
  }
};

/**
 * 수첩 — 자유롭게 쓰는 페이지 여러 장.
 * 목록에서 고르거나 새로 만들면 그 페이지가 화면 전체. '목록' 버튼으로 옆에 목록·검색을 펼친다 (좁은 화면은 목록으로 돌아감).
 */
export default function NotebookPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const wide = useMediaQuery('(min-width: 1024px)');
  const notes = useTaskStore((s) => s.notes);
  const addNote = useTaskStore((s) => s.addNote);
  const [query, setQuery] = useState('');
  const [listOpen, setListOpen] = useState(readListPref);

  const sorted = useMemo(() => notes.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [notes]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((n) => `${n.title}\n${docToText(n.doc)}`.toLowerCase().includes(q));
  }, [sorted, query]);

  const selected = id ? (notes.find((n) => n.id === id) ?? null) : null;
  const select = (nid: string) => navigate(`/notebook/${nid}`);
  const create = () => {
    const nid = addNote();
    setQuery('');
    select(nid);
  };
  const toggleList = () => {
    if (!wide) return navigate('/notebook');
    setListOpen((v) => {
      try {
        localStorage.setItem(LIST_KEY, v ? '0' : '1');
      } catch {
        /* 기억 못 해도 동작은 같다 */
      }
      return !v;
    });
  };
  const list = <NoteList notes={filtered} selectedId={selected?.id ?? null} query={query} onQuery={setQuery} onSelect={select} onCreate={create} />;

  if (!selected) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 pt-4 pb-28 sm:px-8 sm:pt-7 sm:pb-24">
        <PageHeader compactOnMobile title="수첩" description="자유롭게 쓰는 페이지들 — 고르거나 새로 만들면 크게 열려요" />
        {list}
      </div>
    );
  }

  const side = wide && listOpen;
  return (
    <div className="flex w-full flex-1 gap-6 px-4 pt-4 pb-28 sm:px-8 sm:pt-6 sm:pb-24 lg:pr-14">
      {side ? (
        <aside className="anim-from-left sticky top-6 w-[17rem] flex-none self-start" data-testid="note-side">
          {list}
        </aside>
      ) : null}
      <div className="mx-auto w-full max-w-5xl min-w-0">
        <NotePage
          key={selected.id}
          note={selected}
          listOpen={side}
          onToggleList={toggleList}
          onDeleted={() => navigate('/notebook', { replace: true })}
        />
      </div>
    </div>
  );
}
