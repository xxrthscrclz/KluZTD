import { CalendarCheck, CalendarDays, FolderKanban, KanbanSquare, NotebookPen, type LucideIcon } from 'lucide-react';

export type NavItem = {
  path: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  /** 단축키 */
  key: string;
};

/** 화면 이름은 여기서만 바꾸면 된다 */
export const NAV: NavItem[] = [
  { path: '/daily', label: '일일 관리', hint: '날짜별 할 일 체크리스트와 이슈', icon: CalendarCheck, key: '1' },
  { path: '/status', label: '상태 관리', hint: '진행 예정·진행 중·대기·완료', icon: KanbanSquare, key: '2' },
  { path: '/calendar', label: '달력', hint: '한 달에 뭘 했고 뭐가 잡혀 있는지', icon: CalendarDays, key: '3' },
  { path: '/projects', label: '프로젝트', hint: '프로젝트별 한 일과 Next Action', icon: FolderKanban, key: '4' },
  { path: '/notebook', label: '수첩', hint: '자유롭게 쓰는 페이지들', icon: NotebookPen, key: '5' },
];
