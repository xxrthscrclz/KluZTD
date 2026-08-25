import type { ReactNode } from 'react';

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
  type?: 'button' | 'submit';
  className?: string;
};

const variantClass = {
  primary:
    'bg-gradient-to-br from-accent via-[#3b8af0] to-sky text-text-inverse shadow-[0_8px_22px_rgba(29,111,232,0.35)] hover:shadow-[0_12px_28px_rgba(29,111,232,0.45)]',
  ghost:
    'border border-border-strong bg-bg-surface/70 text-text-secondary hover:border-accent/35 hover:bg-bg-accent-soft hover:text-accent-ink hover:shadow-[0_6px_16px_rgba(29,111,232,0.1)]',
  danger:
    'border border-danger/25 text-danger hover:bg-danger/5 hover:shadow-[0_6px_16px_rgba(212,43,63,0.12)]',
} as const;

const sizeClass = {
  md: 'px-4 py-2.5 text-sm font-bold',
  sm: 'px-2.5 py-1.5 text-xs font-bold',
} as const;

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`motion-pop inline-flex items-center justify-center gap-1.5 rounded-2xl ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    >
      {children}
    </button>
  );
}
