import { Node, mergeAttributes, wrappingInputRule } from '@tiptap/core';

export const CALLOUT_VARIANTS = {
  note: { icon: '💡', label: '메모' },
  info: { icon: 'ℹ️', label: '정보' },
  warn: { icon: '⚠️', label: '주의' },
  success: { icon: '✅', label: '완료' },
  danger: { icon: '🚨', label: '위험' },
} as const;

export type CalloutVariant = keyof typeof CALLOUT_VARIANTS;

const ORDER = Object.keys(CALLOUT_VARIANTS) as CalloutVariant[];

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (variant?: CalloutVariant) => ReturnType;
      toggleCallout: (variant?: CalloutVariant) => ReturnType;
    };
  }
}

/** 노션식 콜아웃 — 아이콘을 누르면 종류(메모/정보/주의/완료/위험)가 바뀐다. 입력 규칙: 줄 맨 앞 `!> ` */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'note',
        parseHTML: (el) => (el.getAttribute('data-variant') as CalloutVariant) ?? 'note',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]', contentElement: '.kz-callout-body' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    const variant = (node.attrs.variant as CalloutVariant) ?? 'note';
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-callout': '', class: 'kz-callout' }),
      ['div', { class: 'kz-callout-icon', contenteditable: 'false' }, CALLOUT_VARIANTS[variant]?.icon ?? '💡'],
      ['div', { class: 'kz-callout-body' }, 0],
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      let current = node;
      const dom = document.createElement('div');
      dom.className = 'kz-callout';
      dom.setAttribute('data-callout', '');
      const icon = document.createElement('button');
      icon.type = 'button';
      icon.className = 'kz-callout-icon';
      icon.contentEditable = 'false';
      icon.setAttribute('aria-label', '콜아웃 종류 바꾸기');
      const body = document.createElement('div');
      body.className = 'kz-callout-body';
      dom.append(icon, body);

      const paint = () => {
        const variant = (current.attrs.variant as CalloutVariant) ?? 'note';
        dom.setAttribute('data-variant', variant);
        icon.textContent = CALLOUT_VARIANTS[variant]?.icon ?? '💡';
        icon.title = `${CALLOUT_VARIANTS[variant]?.label ?? ''} — 눌러서 바꾸기`;
      };
      paint();

      icon.addEventListener('mousedown', (e) => e.preventDefault());
      icon.addEventListener('click', () => {
        if (!editor.isEditable) return;
        const pos = typeof getPos === 'function' ? getPos() : null;
        if (pos == null) return;
        const idx = ORDER.indexOf(current.attrs.variant as CalloutVariant);
        const next = ORDER[(idx + 1) % ORDER.length];
        editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...current.attrs, variant: next }));
      });

      return {
        dom,
        contentDOM: body,
        update: (updated) => {
          if (updated.type !== current.type) return false;
          current = updated;
          paint();
          return true;
        },
        ignoreMutation: (m) => icon.contains(m.target as globalThis.Node),
      };
    };
  },

  addCommands() {
    return {
      // 목록 항목 안처럼 바로 감쌀 수 없는 곳이면 노션처럼 일반 문단으로 바꾼 뒤 감싼다
      setCallout:
        (variant = 'note') =>
        ({ commands, chain }) =>
          commands.wrapIn(this.name, { variant }) || chain().clearNodes().wrapIn(this.name, { variant }).run(),
      toggleCallout:
        (variant = 'note') =>
        ({ commands, chain, editor }) =>
          editor.isActive(this.name)
            ? commands.lift(this.name)
            : commands.wrapIn(this.name, { variant }) || chain().clearNodes().wrapIn(this.name, { variant }).run(),
    };
  },

  addInputRules() {
    return [wrappingInputRule({ find: /^(?:!>|>!)\s$/, type: this.type })];
  },
});
