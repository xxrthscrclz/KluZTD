import type { Editor, Range } from '@tiptap/core';
import {
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Lightbulb,
  List,
  ListOrdered,
  Minus,
  Quote,
  Sigma,
  SquareSigma,
  Table2,
  Type,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { hangulMatch } from './hangul';
import { insertMath } from './math';

export type SlashItem = {
  id: string;
  title: string;
  hint: string;
  /** 검색 키워드 (한/영) */
  keywords: string;
  /** 마크다운 단축 입력 안내 */
  shortcut?: string;
  icon: ReactNode;
  run: (editor: Editor, range: Range) => void;
};

const ic = 'size-[18px]';

export const SLASH_ITEMS: SlashItem[] = [
  {
    id: 'text',
    title: '텍스트',
    hint: '일반 문단',
    keywords: 'text paragraph p 텍스트 문단 본문',
    icon: <Type className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).setParagraph().run(),
  },
  {
    id: 'h1',
    title: '제목 1',
    hint: '큰 제목',
    keywords: 'h1 heading1 title 제목1 큰제목 헤딩',
    shortcut: '#',
    icon: <Heading1 className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    title: '제목 2',
    hint: '중간 제목',
    keywords: 'h2 heading2 subtitle 제목2 중제목 헤딩',
    shortcut: '##',
    icon: <Heading2 className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    title: '제목 3',
    hint: '작은 제목',
    keywords: 'h3 heading3 제목3 소제목 헤딩',
    shortcut: '###',
    icon: <Heading3 className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).setHeading({ level: 3 }).run(),
  },
  {
    id: 'bullet',
    title: '글머리 목록',
    hint: '• 순서 없는 목록',
    keywords: 'list bullet ul 리스트 목록 글머리',
    shortcut: '-',
    icon: <List className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBulletList().run(),
  },
  {
    id: 'ordered',
    title: '번호 목록',
    hint: '1. 순서 있는 목록',
    keywords: 'number ordered ol numbered 번호 숫자 리스트 목록',
    shortcut: '1.',
    icon: <ListOrdered className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleOrderedList().run(),
  },
  {
    id: 'todo',
    title: '체크리스트',
    hint: '할 일 체크 상자',
    keywords: 'todo task check checkbox 체크 체크리스트 할일 투두',
    shortcut: '[]',
    icon: <CheckSquare className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleTaskList().run(),
  },
  {
    id: 'table',
    title: '표',
    hint: '3 × 3 표',
    keywords: 'table grid 표 테이블',
    icon: <Table2 className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    id: 'code',
    title: '코드',
    hint: '</> 코드 블록 (언어별 색)',
    keywords: 'code codeblock </> pre 코드 소스',
    shortcut: '```',
    icon: <Code2 className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleCodeBlock().run(),
  },
  {
    id: 'callout',
    title: '콜아웃',
    hint: '눈에 띄는 상자',
    keywords: 'callout box note tip 콜아웃 강조 박스 메모',
    shortcut: '!>',
    icon: <Lightbulb className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).setCallout('note').run(),
  },
  {
    id: 'math',
    title: '수식',
    hint: '문장 안 수식 (LaTeX)',
    keywords: 'math equation latex formula katex 수식 공식 방정식',
    shortcut: '$$',
    icon: <Sigma className={ic} />,
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertMath(e, 'inlineMath');
    },
  },
  {
    id: 'mathBlock',
    title: '수식 블록',
    hint: '가운데 정렬된 큰 수식',
    keywords: 'math block equation latex display 수식블록 블록수식 공식',
    shortcut: '$$$',
    icon: <SquareSigma className={ic} />,
    run: (e, r) => {
      e.chain().focus().deleteRange(r).run();
      insertMath(e, 'blockMath');
    },
  },
  {
    id: 'quote',
    title: '인용',
    hint: '인용 블록',
    keywords: 'quote blockquote 인용 따옴표',
    shortcut: '>',
    icon: <Quote className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).toggleBlockquote().run(),
  },
  {
    id: 'divider',
    title: '구분선',
    hint: '가로줄',
    keywords: 'divider hr line separator 구분선 가로줄 선',
    shortcut: '---',
    icon: <Minus className={ic} />,
    run: (e, r) => e.chain().focus().deleteRange(r).setHorizontalRule().run(),
  },
];

export function filterSlashItems(query: string): SlashItem[] {
  const q = query.trim();
  if (!q) return SLASH_ITEMS;
  return SLASH_ITEMS.filter((item) => hangulMatch(`${item.title} ${item.keywords}`, q));
}
