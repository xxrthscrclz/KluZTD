import type { Editor } from '@tiptap/core';
import { EditorContent, useEditor } from '@tiptap/react';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

import { useEditorStore } from '@/stores/editorStore';
import type { Doc } from '@/types/task';

import { FormatBubble, TableBubble } from './BubbleToolbar';
import { editableExtensions } from './extensions';

type Props = {
  value: Doc | null;
  onChange: (doc: Doc) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Mod+Enter */
  onSubmit?: () => void;
  className?: string;
  /** 입력이 멈춘 뒤 onChange 까지 기다리는 시간 */
  debounce?: number;
  testId?: string;
  ariaLabel?: string;
  /** 떠 있는 막대의 기본 대상으로 (아무 에디터도 포커스 안 됐을 때) */
  toolbarFallback?: boolean;
  /** 에디터를 감싸는 상자 — 상자 어디를 눌러도(여백·아래 빈 곳) 이 에디터에 커서가 들어간다 */
  frameClassName?: string;
  frameTestId?: string;
};

export type NoteEditorHandle = {
  /** 아직 onChange 로 안 나간 입력까지 포함한 현재 문서 */
  getJSON: () => Doc;
  /** 대기 중인 onChange 를 버린다 */
  cancelPending: () => void;
  /** 바깥에서 내용을 바꿀 때 (포커스 중이어도) */
  setContent: (doc: Doc | null) => void;
  focus: () => void;
};

const EMPTY: Doc = { type: 'doc', content: [{ type: 'paragraph' }] };

/**
 * 노션식 에디터.
 * - 마크다운 단축 입력: # ## ### - 1. [] > ``` </> !> --- **굵게** `코드` ==형광펜==
 * - '/' 블록 메뉴: 제목, 목록, 체크리스트, 표, 코드, 콜아웃, 인용, 구분선
 * - 글자 선택 시 서식 막대, 표 안에서는 표 편집 막대
 */
const NoteEditor = forwardRef<NoteEditorHandle, Props>(function NoteEditor({
  value,
  onChange,
  placeholder = "내용을 적거나 '/' 로 블록 추가",
  autoFocus = false,
  onSubmit,
  className = '',
  debounce = 350,
  testId,
  ariaLabel,
  toolbarFallback = false,
  frameClassName = '',
  frameTestId,
}, ref) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastEmitted = useRef<string>(JSON.stringify(value ?? EMPTY));

  const editorRef = useRef<Editor | null>(null);
  const extensions = useMemo(
    () => editableExtensions({ placeholder, onSubmit: () => onSubmitRef.current?.(), getEditor: () => editorRef.current }),
    // 확장 목록은 처음 한 번만 만든다 (placeholder 바뀌어도 에디터를 다시 만들지 않음)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const flush = useRef(() => {});

  const editor = useEditor({
    extensions,
    content: value ?? EMPTY,
    autofocus: autoFocus ? 'end' : false,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: `kz-prose ${className}`,
        spellcheck: 'false',
        ...(testId ? { 'data-testid': testId } : {}),
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      },
    },
    onUpdate: ({ editor: e }) => {
      if (timer.current) clearTimeout(timer.current);
      flush.current = () => {
        timer.current = null;
        const json = e.getJSON();
        lastEmitted.current = JSON.stringify(json);
        onChangeRef.current(json);
      };
      timer.current = setTimeout(() => flush.current(), debounce);
    },
    onFocus: ({ editor: e }) => useEditorStore.getState().setActive(e),
    onBlur: () => {
      useEditorStore.getState().setFocused(false);
      if (timer.current) {
        clearTimeout(timer.current);
        flush.current();
      }
    },
  });
  editorRef.current = editor;

  useEffect(() => {
    if (!editor) return;
    if (toolbarFallback) useEditorStore.getState().setFallback(editor);
    return () => useEditorStore.getState().release(editor);
  }, [editor, toolbarFallback]);

  // 언마운트(상세 닫기 등) 직전에 남은 입력을 저장
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        flush.current();
      }
    },
    [],
  );

  // 다른 탭/기기에서 바뀐 내용이 들어오면 반영 — 입력 중일 때는 덮어쓰지 않는다
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const incoming = JSON.stringify(value ?? EMPTY);
    if (incoming === lastEmitted.current) return;
    if (editor.isFocused || timer.current) return;
    lastEmitted.current = incoming;
    editor.commands.setContent(value ?? EMPTY, { emitUpdate: false });
  }, [editor, value]);

  useImperativeHandle(
    ref,
    () => ({
      getJSON: () => editor.getJSON(),
      cancelPending: () => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
      },
      setContent: (doc) => {
        const next = doc ?? EMPTY;
        lastEmitted.current = JSON.stringify(next);
        editor.commands.setContent(next, { emitUpdate: false });
      },
      focus: () => editor.commands.focus('end'),
    }),
    [editor],
  );

  if (!editor) return null;

  return (
    <div
      className={`relative cursor-text ${frameClassName}`}
      data-testid={frameTestId}
      onMouseDown={(e) => {
        // 글 영역 밖(상자 여백, 마지막 줄 아래)을 누르면 끝에 커서
        const target = e.target as HTMLElement;
        if (target.closest('.ProseMirror') || target.closest('button, input, textarea, [role="dialog"]')) return;
        e.preventDefault();
        editor.commands.focus('end');
      }}
    >
      <EditorContent editor={editor} />
      <FormatBubble editor={editor} />
      <TableBubble editor={editor} />
    </div>
  );
});

export default NoteEditor;
