export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`
          border-2 border-amber-900/30 border-t-amber-500
          rounded-full animate-spin
          ${sizeClasses[size]}
        `}
      />
      {text && <p className="text-amber-400 font-medium">{text}</p>}
    </div>
  );
}
