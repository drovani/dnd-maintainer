import { forwardRef, SelectHTMLAttributes } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-amber-400 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2 rounded
            bg-slate-800 border border-amber-900/30
            text-slate-100 placeholder-slate-500
            focus:outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-600/30
            transition-colors duration-200
            appearance-none cursor-pointer
            ${error ? 'border-red-600 focus:ring-red-600/30' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
