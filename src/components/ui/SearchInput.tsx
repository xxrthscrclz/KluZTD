import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  size?: 'sm' | 'md';
  className?: string;
  testId?: string;
};

/** 검색 입력 — 돋보기, 지우기 버튼, Esc 로 비우기 */
const SearchInput = forwardRef<HTMLInputElement, Props>(function SearchInput(
  { value, onChange, placeholder, label, size = 'sm', className = '', testId },
  ref,
) {
  const h = size === 'sm' ? 'h-8 text-[0.82rem]' : 'h-9 text-sm';
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="pointer-events-none absolute left-3 size-3.5 text-text-muted" />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onChange('');
            e.currentTarget.blur();
          }
        }}
        placeholder={placeholder}
        aria-label={label}
        data-testid={testId}
        className={`w-full rounded-full border border-border-default bg-bg-surface pr-8 pl-8 outline-none placeholder:text-text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/20 ${h}`}
      />
      {value ? (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => onChange('')}
          className="absolute right-1.5 grid size-5 place-items-center rounded-full text-text-muted hover:bg-bg-hover"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
});

export default SearchInput;
