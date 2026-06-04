import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalFooter } from './ModalFooter';

export function EditPersonalityDialog({
  personality_traits,
  ideals,
  bonds,
  flaws,
  onSave,
  onClose,
  saving,
}: {
  personality_traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  onSave: (updates: { personality_traits: string; ideals: string; bonds: string; flaws: string }) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const { t: tc } = useTranslation('common');
  const [form, setForm] = useState({ personality_traits, ideals, bonds, flaws });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{tc('characterSheet.dialogs.editPersonality')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="personality-traits">{tc('characterSheet.fields.personalityTraits')}</Label>
            <Textarea
              id="personality-traits"
              value={form.personality_traits}
              onChange={(e) => setForm((prev) => ({ ...prev, personality_traits: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-ideals">{tc('characterSheet.personality.ideals')}</Label>
            <Textarea
              id="personality-ideals"
              value={form.ideals}
              onChange={(e) => setForm((prev) => ({ ...prev, ideals: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-bonds">{tc('characterSheet.personality.bonds')}</Label>
            <Textarea
              id="personality-bonds"
              value={form.bonds}
              onChange={(e) => setForm((prev) => ({ ...prev, bonds: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="personality-flaws">{tc('characterSheet.personality.flaws')}</Label>
            <Textarea
              id="personality-flaws"
              value={form.flaws}
              onChange={(e) => setForm((prev) => ({ ...prev, flaws: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        <ModalFooter onSave={() => onSave(form)} onCancel={onClose} saving={saving} />
      </DialogContent>
    </Dialog>
  );
}
