import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ModalFooter({
  onSave,
  onCancel,
  saving,
}: {
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>
        {t('buttons.cancel')}
      </Button>
      <Button onClick={onSave} pending={saving}>
        <Save size={14} />
        {saving ? t('buttons.saving') : t('buttons.save')}
      </Button>
    </DialogFooter>
  );
}
