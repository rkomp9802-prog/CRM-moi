import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-canvas hover:bg-ink/90 disabled:bg-ink/40',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-canvas',
  ghost: 'text-muted hover:bg-canvas hover:text-ink',
  danger: 'border border-danger/30 bg-danger-soft text-danger hover:bg-danger/10',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm
        font-medium transition disabled:cursor-not-allowed disabled:opacity-60
        ${variants[variant]} ${className}`}
    />
  );
}
