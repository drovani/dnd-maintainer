import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { THEMES, type ThemeId } from '@/lib/theme';
import { cn } from '@/lib/utils';

interface ThemePickerProps {
  value: ThemeId | null;
  onChange: (id: ThemeId | null) => void;
  allowNone?: boolean;
  label?: string;
}

export function ThemePicker({ value, onChange, allowNone = false, label }: ThemePickerProps): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex gap-2">
        {allowNone && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              value === null
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-accent'
            )}
          >
            {value === null && <Check className="size-4" />}
            {t('settings.useGlobalTheme')}
          </button>
        )}
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              value === theme.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border hover:bg-accent'
            )}
          >
            <span
              className="size-4 rounded-full border border-border"
              style={{ backgroundColor: theme.swatch }}
            />
            {value === theme.id && <Check className="size-4" />}
            {t(theme.labelKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
