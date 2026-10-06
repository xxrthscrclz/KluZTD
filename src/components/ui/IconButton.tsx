import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
};

const sizeClass = { sm: 'size-7 rounded-lg', md: 'size-8 rounded-[9px]', lg: 'size-10 rounded-xl' } as const;

/** 아이콘만 있는 버튼 — label 은 스크린리더·툴팁용 */
const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, children, size = 'md', active = false, className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={`inline-grid flex-none place-items-center transition-colors ${sizeClass[size]} ${
        active ? 'bg-bg-active text-text-primary' : 'text-text-muted hover:bg-bg-hover hover:text-text-primary'
      } disabled:opacity-40 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export default IconButton;
