import { type DndGender } from '@/lib/dnd-helpers';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface GenderToggleProps {
  value: DndGender | '' | null;
  onChange: (gender: DndGender) => void;
  error?: boolean;
}

export function GenderToggle({ value, onChange, error }: GenderToggleProps) {
  const { t } = useTranslation('gamedata');

  return (
    <ToggleGroup
      value={value ? [value] : []}
      onValueChange={(values) => {
        const selected = values[0] as DndGender | undefined;
        if (selected) onChange(selected);
      }}
      className={cn(error && 'rounded-md border border-destructive p-1')}
      variant="outline"
    >
      <ToggleGroupItem value="male">{t('gender.male')}</ToggleGroupItem>
      <ToggleGroupItem value="female">{t('gender.female')}</ToggleGroupItem>
    </ToggleGroup>
  );
}
