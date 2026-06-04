import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

export type ConfirmAction = 'archive' | 'delete' | 'clone';

export function ConfirmActionDialog({
  action,
  characterName,
  cloneName,
  onCloneNameChange,
  onConfirm,
  onClose,
  pending,
}: {
  action: ConfirmAction;
  characterName: string;
  cloneName: string;
  onCloneNameChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
}) {
  const { t: tc } = useTranslation('common');

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {action === 'archive'
              ? tc('characterSheet.actions.archiveTitle')
              : action === 'clone'
                ? tc('characterSheet.actions.cloneTitle')
                : tc('characterSheet.actions.deleteTitle')}
          </DialogTitle>
        </DialogHeader>
        {action === 'clone' ? (
          <div className="space-y-2">
            <label htmlFor="clone-name" className="text-sm text-muted-foreground">
              {tc('characterSheet.actions.cloneNameLabel')}
            </label>
            <Input
              id="clone-name"
              value={cloneName}
              onChange={(e) => onCloneNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && cloneName.trim()) onConfirm();
              }}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {action === 'archive'
              ? tc('characterSheet.actions.archiveConfirm', { name: characterName })
              : tc('characterSheet.actions.deleteConfirm', { name: characterName })}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tc('buttons.cancel')}
          </Button>
          <Button
            variant={action === 'delete' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={action === 'clone' && !cloneName.trim()}
            pending={pending}
          >
            {action === 'archive'
              ? tc('buttons.archive')
              : action === 'clone'
                ? tc('buttons.clone')
                : tc('buttons.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
