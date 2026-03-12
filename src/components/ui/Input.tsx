import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-amber-400 mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2 rounded
            bg-slate-800 border border-amber-900/30
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/30
            transition-colors duration-200
            ${error ? 'border-red-600 focus:ring-red-600/30' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-amber-400 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-2 rounded
            bg-slate-800 border border-amber-900/30
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/30
            transition-colors duration-200 resize-vertical
            ${error ? 'border-red-600 focus:ring-red-600/30' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
