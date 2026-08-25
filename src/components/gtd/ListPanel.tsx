import { useMemo } from 'react';

import ItemRow from '@/components/gtd/ItemRow';
import { findList } from '@/constants/lists';
import { useGtdStore } from '@/stores/gtdStore';
import { itemsInList } from '@/utils/item';

/** 현재 선택된 리스트의 항목 목록 */
export default function ListPanel() {
  // 주의: 셀렉터에서 filter/sort 로 새 배열을 만들면 zustand v5 가 매번 변경으로 보고
  // 무한 리렌더에 빠진다. 원본 배열만 꺼내와서 useMemo 로 파생시킨다.
  const allItems = useGtdStore((s) => s.items);
  const activeListId = useGtdStore((s) => s.activeListId);
  const items = useMemo(() => itemsInList(allItems, activeListId), [allItems, activeListId]);
  const list = findList(activeListId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-display text-2xl font-extrabold text-text-primary">
            {list?.title ?? '리스트'}
          </div>
          <div className="mt-1 text-sm font-medium text-text-secondary">{list?.subtitle}</div>
        </div>
        <div className="text-sm font-extrabold tabular-nums text-text-muted">{items.length}개</div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong px-4 py-10 text-center text-sm font-medium text-text-muted">
          비어 있습니다
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
