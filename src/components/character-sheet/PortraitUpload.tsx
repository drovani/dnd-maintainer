import * as React from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, X } from 'lucide-react';
import { usePortraitUpload } from '@/hooks/usePortraitUpload';
import { ValidationError } from '@/components/ui/validation-error';
import { Button } from '@/components/ui/button';

interface PortraitUploadProps {
  characterId: string;
  portraitUrl: string | null;
  characterName: string;
}

export function PortraitUpload({ characterId, portraitUrl, characterName }: PortraitUploadProps): React.JSX.Element {
  const { t } = useTranslation('common');
  const { upload, remove, isUploading, isRemoving, error } = usePortraitUpload();
  const [cacheBust, setCacheBust] = useState<number>(() => Date.now());
  const [localError, setLocalError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initial = characterName.charAt(0).toUpperCase();
  const isWorking = isUploading || isRemoving;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLocalError(t('portrait.errors.notAnImage'));
      e.target.value = '';
      return;
    }

    setLocalError('');

    try {
      await upload(file, characterId);
      setCacheBust(Date.now());
    } catch {
      setLocalError(t('portrait.errors.uploadFailed'));
    } finally {
      e.target.value = '';
    }
  };

  const handleRemove = async (): Promise<void> => {
    setLocalError('');
    try {
      await remove(characterId, portraitUrl);
    } catch {
      setLocalError(t('portrait.errors.removeFailed'));
    }
  };

  const handleClick = (): void => {
    if (!isWorking) {
      fileInputRef.current?.click();
    }
  };

  const displayError = localError || (error?.message ?? '');

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label={t('portrait.upload')}
      />

      {/* Portrait circle */}
      <div className="relative">
        {isWorking ? (
          <div className="size-24 rounded-full bg-muted flex items-center justify-center" aria-busy="true">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : portraitUrl ? (
          <button
            type="button"
            onClick={handleClick}
            className="size-24 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            title={t('portrait.change')}
            aria-label={t('portrait.change')}
          >
            <img
              src={`${portraitUrl}?v=${cacheBust}`}
              alt={characterName}
              className="size-24 rounded-full object-cover"
            />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            className="size-24 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 hover:bg-muted/80 transition-colors"
            title={t('portrait.upload')}
            aria-label={t('portrait.upload')}
          >
            {initial}
          </button>
        )}

        {/* Remove button — only shown when portrait exists and not working */}
        {portraitUrl && !isWorking && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -top-1 -right-1 size-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 p-0"
            onClick={handleRemove}
            title={t('portrait.remove')}
            aria-label={t('portrait.remove')}
          >
            <X className="size-3" />
          </Button>
        )}
      </div>

      {isUploading && <span className="text-xs text-muted-foreground">{t('portrait.uploading')}</span>}

      {displayError && <ValidationError message={displayError} />}
    </div>
  );
}
