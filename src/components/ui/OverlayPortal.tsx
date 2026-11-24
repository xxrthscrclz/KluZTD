import { DragOverlay, type DropAnimation } from '@dnd-kit/core';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * 드래그 중 손에 들린 카드 — body 에 바로 그린다.
 * 페이지 안에 두면 애니메이션·스크롤 컨테이너 때문에 좌표 기준이 바뀌어 포인터와 어긋날 수 있다.
 */
export default function OverlayPortal({ children, dropAnimation }: { children: ReactNode; dropAnimation?: DropAnimation | null }) {
  return createPortal(<DragOverlay dropAnimation={dropAnimation}>{children}</DragOverlay>, document.body);
}
