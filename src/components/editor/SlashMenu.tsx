import type { Editor, Range } from '@tiptap/core';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';

import type { SlashItem } from './slashItems';

export type SlashMenuProps = {
  items: SlashItem[];
  editor: Editor;
  range: Range;
  query: string;
};

export type SlashMenuHandle = {
  onKeyDown: (e: KeyboardEvent) => boolean;
};

/** '/' 를 치면 뜨는 블록 메뉴 */
const SlashMenu = forwardRef<SlashMenuHandle, SlashMenuProps>(function SlashMenu({ items, editor, range }, ref) {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setActive(0), [items]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = (item: SlashItem | undefined) => {
    if (item) item.run(editor, range);
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: (e) => {
      if (!items.length) return false;
      if (e.key === 'ArrowDown') {
        setActive((i) => (i + 1) % items.length);
        return true;
      }
      if (e.key === 'ArrowUp') {
        setActive((i) => (i - 1 + items.length) % items.length);
        return true;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        run(items[active]);
        return true;
      }
      return false;
    },
  }));

  if (!items.length) {
    return (
      <div className="w-64 rounded-xl border border-border-default bg-bg-surface px-3 py-2.5 text-xs text-text-muted shadow-pop">
        일치하는 블록이 없어요
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      role="listbox"
      aria-label="블록 추가"
      data-testid="slash-menu"
      className="anim-pop flex max-h-80 w-[17rem] flex-col overflow-y-auto rounded-xl border border-border-default bg-bg-surface p-1 shadow-pop"
    >
      <div className="px-2.5 pt-1.5 pb-1 text-[0.7rem] font-semibold text-text-muted">블록</div>
      {items.map((item, i) => (
        <div
          key={item.id}
          data-index={i}
          role="option"
          aria-selected={i === active}
          onPointerMove={() => setActive(i)}
          onMouseDown={(e) => {
            e.preventDefault();
            run(item);
          }}
          className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 ${i === active ? 'bg-bg-hover' : ''}`}
        >
          <div className="grid size-9 flex-none place-items-center rounded-lg border border-border-default bg-bg-surface text-text-secondary">
            {item.icon}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="truncate text-sm font-medium text-text-primary">{item.title}</div>
            <div className="truncate text-xs text-text-muted">{item.hint}</div>
          </div>
          {item.shortcut ? (
            <div className="flex-none rounded-md bg-bg-muted px-1.5 py-0.5 font-mono text-[0.68rem] text-text-muted">
              {item.shortcut}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
});

export default SlashMenu;
