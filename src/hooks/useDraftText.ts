import { useEffect, useRef, useState } from 'react';

/**
 * 입력 중엔 로컬 값, 확정(blur/Enter) 때만 저장하는 텍스트.
 * 비우고 확정하면 원래 값으로 되돌린다. 바깥 값이 바뀌면(다른 탭) 입력 중이 아닐 때만 따라간다.
 */
export function useDraftText(source: string, save: (next: string) => void) {
  const [value, setValue] = useState(source);
  const editing = useRef(false);

  useEffect(() => {
    if (!editing.current) setValue(source);
  }, [source]);

  return {
    value,
    onChange: (next: string) => {
      editing.current = true;
      setValue(next);
    },
    commit: () => {
      editing.current = false;
      const next = value.replace(/\s+/g, ' ').trim();
      if (!next) setValue(source);
      else if (next !== source) save(next);
    },
    reset: () => {
      editing.current = false;
      setValue(source);
    },
  };
}
