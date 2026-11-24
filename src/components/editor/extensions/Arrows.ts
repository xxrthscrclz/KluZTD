import { Extension, InputRule } from '@tiptap/core';

import { ARROW_RULES } from '@/lib/arrows';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 에디터 안 화살표 변환 (코드 블록·인라인 코드 안에서는 그대로) */
export const Arrows = Extension.create({
  name: 'kzArrows',
  addInputRules() {
    return ARROW_RULES.map(
      ({ from, to }) =>
        new InputRule({
          find: new RegExp(`${escape(from)}$`),
          handler: ({ state, range }) => {
            const $from = state.doc.resolve(range.from);
            if ($from.parent.type.spec.code) return null;
            if (state.schema.marks.code && $from.marks().some((m) => m.type === state.schema.marks.code)) return null;
            // `a -> b` 처럼 아직 닫히지 않은 백틱 안(곧 인라인 코드가 될 글자)이면 그대로
            const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc');
            if ((before.match(/`/g)?.length ?? 0) % 2 === 1) return null;
            state.tr.insertText(to, range.from, range.to);
          },
        }),
    );
  },
});
