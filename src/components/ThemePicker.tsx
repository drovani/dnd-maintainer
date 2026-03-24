import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { THEMES, type ThemeId } from '@/lib/theme';
import { cn } from '@/lib/utils';

type ThemePickerProps = {
  label?: string;
  disabled?: boolean;
} & (
  | { value: ThemeId; onChange: (id: ThemeId) => void; allowNone?: false }
  | { value: ThemeId | null; onChange: (id: ThemeId | null) => void; allowNone: true }
);

export function ThemePicker(props: ThemePickerProps): React.JSX.Element {
  const { value, onChange, label, disabled } = props;
  const { t } = useTranslation('common');

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex gap-2">
        {props.allowNone && (
          <button
            type="button"
            onClick={() => props.onChange(null)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
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
            disabled={disabled}
            className={cn(
              'flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
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
