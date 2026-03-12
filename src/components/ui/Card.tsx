import { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        bg-slate-900 border border-amber-900/30 rounded-lg
        shadow-lg hover:shadow-xl
        transition-shadow duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-b border-amber-900/20 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h2 className={`text-xl font-bold text-amber-400 ${className}`}>{children}</h2>;
}

export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`px-6 py-4 border-t border-amber-900/20 flex gap-2 ${className}`}>
      {children}
    </div>
  );
}
