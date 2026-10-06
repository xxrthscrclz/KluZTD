import { Extension, textblockTypeInputRule, type AnyExtension, type Editor } from '@tiptap/core';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Highlight from '@tiptap/extension-highlight';
import { Mathematics } from '@tiptap/extension-mathematics';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import { ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import CodeBlockView from '../CodeBlockView';
import { lowlight } from '../lowlight';
import { openMathAt } from '../math';
import { Callout } from './Callout';
import { SlashCommand } from './SlashCommand';

/** ``` 말고 줄 맨 앞 `</> ` 로도 코드 블록 */
const CodeBlock = CodeBlockLowlight.extend({
  addInputRules() {
    return [
      ...(this.parent?.() ?? []),
      textblockTypeInputRule({ find: /^<\/>\s$/, type: this.type }),
    ];
  },
});

function base(): AnyExtension[] {
  return [
    StarterKit.configure({
      codeBlock: false,
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        // 붙여넣기·파일에서 들어온 링크도 안전한 스킴만
        isAllowedUri: (url, ctx) => /^(https?|mailto|tel):/i.test(url) || (!/^[a-z][a-z0-9+.-]*:/i.test(url) && ctx.defaultValidate(url)),
      },
      dropcursor: { color: 'var(--color-accent)', width: 2 },
    }),
    Highlight,
    TaskList,
    TaskItem.configure({ nested: true }),
    TableKit.configure({ table: { resizable: false } }),
    Callout,
  ];
}

const KATEX = { throwOnError: false, strict: 'ignore' as const };

type EditableOptions = {
  placeholder: string;
  /** 수식 클릭 시 편집 창을 띄울 에디터 */
  getEditor: () => Editor | null;
  /** Mod+Enter — 줄바꿈 대신 이 동작 */
  onSubmit?: () => void;
};

export function editableExtensions({ placeholder, onSubmit, getEditor }: EditableOptions): AnyExtension[] {
  const editMath = (_node: unknown, pos: number) => {
    const editor = getEditor();
    if (editor?.isEditable) openMathAt(editor, pos);
  };
  return [
    ...base(),
    CodeBlock.extend({
      addNodeView() {
        return ReactNodeViewRenderer(CodeBlockView);
      },
    }).configure({ lowlight, defaultLanguage: null }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'heading') return `제목 ${node.attrs.level}`;
        if (node.type.name === 'paragraph') return placeholder;
        return '';
      },
      showOnlyCurrent: true,
      includeChildren: false,
    }),
    // 수식: 인라인 $$x^2$$, 블록 $$$x^2$$$ (또는 / 메뉴, 떠 있는 막대)
    Mathematics.configure({ katexOptions: KATEX, inlineOptions: { onClick: editMath }, blockOptions: { onClick: editMath } }),
    SlashCommand,
    Extension.create({
      name: 'kzSubmit',
      priority: 1000,
      addKeyboardShortcuts() {
        return {
          'Mod-Enter': () => {
            if (!onSubmit) return false;
            onSubmit();
            return true;
          },
        };
      },
    }),
  ];
}
