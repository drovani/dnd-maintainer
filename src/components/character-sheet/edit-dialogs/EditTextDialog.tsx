import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { ModalFooter } from './ModalFooter';

export function EditTextDialog({
  title,
  field,
  value,
  onSave,
  onClose,
  saving,
}: {
  title: string;
  field: string;
  value: string;
  onSave: (updates: Record<string, string>) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [text, setText] = useState(value);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10} autoFocus />
        <ModalFooter onSave={() => onSave({ [field]: text })} onCancel={onClose} saving={saving} />
      </DialogContent>
    </Dialog>
  );
}
