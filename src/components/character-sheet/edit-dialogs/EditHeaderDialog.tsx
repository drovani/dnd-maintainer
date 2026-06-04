import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { GenderToggle } from '@/components/ui/gender-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DndGender } from '@/lib/dnd-helpers';
import type { Character } from '@/types/database';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ModalFooter } from './ModalFooter';

export function EditHeaderDialog({
  character,
  onSave,
  onClose,
  saving,
}: {
  character: Character;
  onSave: (updates: Partial<Character>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const { t: tc } = useTranslation('common');
  const [form, setForm] = useState({
    name: character.name,
    player_name: character.player_name ?? '',
    character_type: character.character_type,
    gender: (character.gender ?? '') as DndGender | '',
  });

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tc('characterSheet.dialogs.editCharacterInfo')}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="char-name">{tc('characterSheet.fields.name')}</Label>
            <Input id="char-name" value={form.name} onChange={(e) => update('name', e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="char-player">{tc('characterSheet.fields.player')}</Label>
            <Input
              id="char-player"
              value={form.player_name}
              onChange={(e) => update('player_name', e.target.value)}
              placeholder={tc('characterSheet.hints.leaveEmptyForNpcs')}
            />
          </div>
          <div className="space-y-2">
            <Label>{tc('characterSheet.fields.type')}</Label>
            <Select value={form.character_type} onValueChange={(val) => update('character_type', val as 'pc' | 'npc')}>
              <SelectTrigger className="w-full">
                <SelectValue>{tc(`characterType.${form.character_type}`)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pc">{tc('characterType.pc')}</SelectItem>
                <SelectItem value="npc">{tc('characterType.npc')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{tc('characterSheet.fields.gender')}</Label>
            <GenderToggle value={form.gender} onChange={(g) => update('gender', g)} />
          </div>
        </div>
        <ModalFooter
          onSave={() =>
            onSave({
              ...form,
              player_name: form.player_name || null,
              gender: form.gender === 'male' || form.gender === 'female' ? form.gender : null,
            })
          }
          onCancel={onClose}
          saving={saving}
        />
      </DialogContent>
    </Dialog>
  );
}
