import { STATUS } from '@/constants/status';
import { toast } from '@/stores/toastStore';
import type { Status } from '@/types/task';

/** 상태가 바뀌었다고 짧게 알린다 — 보드 드래그, 분류에서 보내기 */
export function announceMove(title: string, to: Status) {
  toast({ message: `«${title}» → ${STATUS[to].label}`, tone: 'success' }, 2400);
}

/** 삭제 + 되돌리기 */
export function announceDelete(message: string, undo: () => void) {
  toast({ message, action: { label: '되돌리기', run: undo } });
}
