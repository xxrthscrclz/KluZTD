import { computePosition, flip, offset, shift } from '@floating-ui/dom';
import { Extension } from '@tiptap/core';
import { PluginKey } from '@tiptap/pm/state';
import { ReactRenderer } from '@tiptap/react';
import Suggestion, { exitSuggestion, type SuggestionKeyDownProps, type SuggestionProps } from '@tiptap/suggestion';

import { exitMs } from '@/lib/motion';

import SlashMenu, { type SlashMenuHandle, type SlashMenuProps } from '../SlashMenu';
import { filterSlashItems, type SlashItem } from '../slashItems';

const slashKey = new PluginKey('slashCommand');

function place(el: HTMLElement, rect: (() => DOMRect | null) | null | undefined) {
  if (!rect) return;
  const virtual = { getBoundingClientRect: () => rect() ?? new DOMRect() };
  void computePosition(virtual, el, {
    placement: 'bottom-start',
    strategy: 'fixed',
    middleware: [offset(6), flip({ padding: 8 }), shift({ padding: 8 })],
  }).then(({ x, y }) => {
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  });
}

/** '/' 블록 메뉴 */
export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        pluginKey: slashKey,
        char: '/',
        allowSpaces: false,
        startOfLine: false,
        // 코드 블록 안에서는 '/' 가 그냥 글자
        allow: ({ state, range }) => {
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name !== 'codeBlock';
        },
        items: ({ query }) => filterSlashItems(query),
        command: ({ editor, range, props }) => props.run(editor, range),
        render: () => {
          let renderer: ReactRenderer<SlashMenuHandle, SlashMenuProps> | null = null;
          let host: HTMLDivElement | null = null;

          return {
            onStart: (props: SuggestionProps<SlashItem, SlashItem>) => {
              host = document.createElement('div');
              host.style.position = 'fixed';
              host.style.zIndex = '80';
              document.body.appendChild(host);
              renderer = new ReactRenderer(SlashMenu, {
                editor: props.editor,
                props: { items: props.items, editor: props.editor, range: props.range, query: props.query },
              });
              host.appendChild(renderer.element);
              place(host, props.clientRect);
            },
            onUpdate: (props: SuggestionProps<SlashItem, SlashItem>) => {
              renderer?.updateProps({ items: props.items, editor: props.editor, range: props.range, query: props.query });
              if (host) place(host, props.clientRect);
            },
            onKeyDown: ({ event, view }: SuggestionKeyDownProps) => {
              if (event.key === 'Escape') {
                exitSuggestion(view, slashKey);
                return true;
              }
              return renderer?.ref?.onKeyDown(event) ?? false;
            },
            onExit: () => {
              const r = renderer;
              const h = host;
              renderer = null;
              host = null;
              const panel = h?.firstElementChild?.firstElementChild as HTMLElement | null | undefined;
              panel?.classList.replace('anim-pop', 'anim-pop-out');
              setTimeout(() => {
                r?.destroy();
                h?.remove();
              }, exitMs());
            },
          };
        },
      }),
    ];
  },
});
