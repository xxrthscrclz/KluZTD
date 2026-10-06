import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailing?: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary:
    'bg-text-primary text-bg-surface hover:opacity-90 active:opacity-80 disabled:opacity-40 shadow-card',
  secondary:
    'bg-bg-surface text-text-primary shadow-card hover:bg-bg-raised active:bg-bg-muted disabled:opacity-50',
  ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-active disabled:opacity-40',
  subtle: 'bg-bg-muted text-text-secondary hover:bg-bg-active hover:text-text-primary disabled:opacity-40',
  danger: 'bg-danger text-white hover:opacity-90 active:opacity-80 disabled:opacity-40',
};

const sizeClass: Record<Size, string> = {
  sm: 'h-7 gap-1.5 rounded-lg px-2.5 text-[0.8rem]',
  md: 'h-9 gap-2 rounded-[10px] px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-[0.95rem]',
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', icon, trailing, className = '', children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`inline-flex flex-none items-center justify-center font-semibold whitespace-nowrap transition-[background,opacity,color,box-shadow] ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </button>
  );
});

export default Button;
