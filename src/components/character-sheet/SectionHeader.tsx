import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        title={t('characterSheet.editSection', { section: title })}
      >
        <Edit2 size={14} />
      </Button>
    </div>
  );
}
