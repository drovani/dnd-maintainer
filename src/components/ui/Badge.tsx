import { ReactNode } from 'react';

export interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-amber-900/30 text-amber-400 border border-amber-900/50',
    success: 'bg-emerald-900/30 text-emerald-400 border border-emerald-900/50',
    danger: 'bg-red-900/30 text-red-400 border border-red-900/50',
    warning: 'bg-yellow-900/30 text-yellow-400 border border-yellow-900/50',
    info: 'bg-blue-900/30 text-blue-400 border border-blue-900/50',
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
