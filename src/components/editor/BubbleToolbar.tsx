import type { Editor } from '@tiptap/core';
import { CellSelection } from '@tiptap/pm/tables';
import { useEditorState } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import {
  Bold,
  Code,
  Highlighter,
  Italic,
  Link2,
  Strikethrough,
  Underline,
  Columns3,
  Rows3,
  Trash2,
  PanelTop,
  TableColumnsSplit,
  TableRowsSplit,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';

function ToolButton({
  label,
  active = false,
  onClick,
  children,
  danger = false,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid size-8 place-items-center rounded-lg transition-colors sm:size-7 ${
        active
          ? 'bg-bg-active text-accent-ink'
          : danger
            ? 'text-text-secondary hover:bg-danger-soft hover:text-danger'
            : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
      }`}
    >
      {children}
    </button>
  );
}

const ic = 'size-4';

/** http(s)·mailto·tel 만 링크로 — javascript: 같은 건 거른다. 스킴이 없으면 https:// 를 붙인다 */
export function safeHref(input: string): string | null {
  const url = input.trim();
  if (!url) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) return `https://${url}`;
  return /^(https?|mailto|tel):/i.test(url) ? url : null;
}
const bar = 'flex items-center gap-0.5 rounded-xl border border-border-default bg-bg-surface p-1 shadow-pop';

/** 글자를 고르면 뜨는 서식 막대 */
export function FormatBubble({ editor }: { editor: Editor }) {
  const [linking, setLinking] = useState(false);
  const [href, setHref] = useState('');
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      highlight: e.isActive('highlight'),
      link: e.isActive('link'),
    }),
  });

  const applyLink = () => {
    const url = safeHref(href);
    if (!url) editor.chain().focus().extendMarkRange('link').unsetLink().run();
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinking(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="kzFormat"
      options={{ placement: 'top', offset: 8, flip: true, shift: { padding: 8 } }}
      shouldShow={({ editor: e, from, to }) =>
        from !== to && e.isEditable && !e.isActive('codeBlock') && !(e.state.selection instanceof CellSelection)
      }
    >
      {linking ? (
        <div className={bar}>
          <input
            autoFocus
            value={href}
            onChange={(e) => setHref(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyLink();
              }
              if (e.key === 'Escape') setLinking(false);
            }}
            placeholder="링크 주소 붙여넣기"
            className="h-7 w-56 rounded-md bg-bg-muted px-2 text-sm outline-none"
          />
          <button
            type="button"
            onClick={applyLink}
            className="h-7 rounded-md px-2 text-xs font-semibold text-accent-ink hover:bg-bg-hover"
          >
            적용
          </button>
        </div>
      ) : (
        <div className={bar} data-testid="format-bubble">
          <ToolButton label="굵게 (⌘B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className={ic} strokeWidth={2.6} />
          </ToolButton>
          <ToolButton label="기울임 (⌘I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className={ic} />
          </ToolButton>
          <ToolButton label="밑줄 (⌘U)" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <Underline className={ic} />
          </ToolButton>
          <ToolButton label="취소선" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className={ic} />
          </ToolButton>
          <ToolButton label="인라인 코드 (`)" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
            <Code className={ic} />
          </ToolButton>
          <ToolButton label="형광펜 (==)" active={state.highlight} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <Highlighter className={ic} />
          </ToolButton>
          <div className="mx-0.5 h-5 w-px bg-border-default" />
          <ToolButton
            label="링크"
            active={state.link}
            onClick={() => {
              setHref((editor.getAttributes('link').href as string | undefined) ?? '');
              setLinking(true);
            }}
          >
            <Link2 className={ic} />
          </ToolButton>
        </div>
      )}
    </BubbleMenu>
  );
}

/** 표 안에 커서가 있으면 표 위에 뜨는 편집 막대 */
export function TableBubble({ editor }: { editor: Editor }) {
  const tableRect = () => {
    const { $from } = editor.state.selection;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === 'table') {
        const dom = editor.view.nodeDOM($from.before(d)) as HTMLElement | null;
        const el = dom?.closest('.tableWrapper') ?? dom;
        if (el) return el.getBoundingClientRect();
      }
    }
    return null;
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="kzTable"
      options={{ placement: 'top-start', offset: 6, flip: false, shift: { padding: 8 } }}
      getReferencedVirtualElement={() => {
        const rect = tableRect();
        return rect ? { getBoundingClientRect: () => rect } : null;
      }}
      shouldShow={({ editor: e }) => e.isEditable && e.isActive('table')}
    >
      <div className={bar} data-testid="table-bubble">
        <ToolButton label="아래에 행 추가" onClick={() => editor.chain().focus().addRowAfter().run()}>
          <Rows3 className={ic} />
        </ToolButton>
        <ToolButton label="오른쪽에 열 추가" onClick={() => editor.chain().focus().addColumnAfter().run()}>
          <Columns3 className={ic} />
        </ToolButton>
        <ToolButton label="행 삭제" danger onClick={() => editor.chain().focus().deleteRow().run()}>
          <TableRowsSplit className={ic} />
        </ToolButton>
        <ToolButton label="열 삭제" danger onClick={() => editor.chain().focus().deleteColumn().run()}>
          <TableColumnsSplit className={ic} />
        </ToolButton>
        <ToolButton label="머리글 행 켜기/끄기" onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
          <PanelTop className={ic} />
        </ToolButton>
        <div className="mx-0.5 h-5 w-px bg-border-default" />
        <ToolButton label="표 삭제" danger onClick={() => editor.chain().focus().deleteTable().run()}>
          <Trash2 className={ic} />
        </ToolButton>
      </div>
    </BubbleMenu>
  );
}
