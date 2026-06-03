import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resizeImage } from '@/lib/resize-image';
import { useCharacterMutations } from '@/hooks/useCharacters';
import { getLogger } from '@/lib/logger';

const logger = getLogger('portrait');

const BUCKET = 'character-portraits';

function portraitPath(characterId: string): string {
  return `${characterId}/portrait.jpg`;
}

export interface UsePortraitUploadResult {
  upload: (file: File, characterId: string) => Promise<void>;
  remove: (characterId: string, currentPortraitUrl: string | null) => Promise<void>;
  isUploading: boolean;
  isRemoving: boolean;
  error: Error | null;
}

export function usePortraitUpload(): UsePortraitUploadResult {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const { update } = useCharacterMutations();

  const upload = async (file: File, characterId: string): Promise<void> => {
    setIsUploading(true);
    setError(null);
    try {
      const blob = await resizeImage(file, 512);
      const path = portraitPath(characterId);

      const { error: storageError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

      if (storageError) throw storageError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      await update.mutateAsync({ id: characterId, portrait_url: publicUrl });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  const remove = async (characterId: string, currentPortraitUrl: string | null): Promise<void> => {
    if (!currentPortraitUrl) return;

    setIsRemoving(true);
    setError(null);
    try {
      const path = portraitPath(characterId);
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
      if (storageError) {
        // Log but don't throw — the DB update (portrait_url → null) should still proceed
        logger.warn('Failed to remove portrait from storage:', storageError);
      }

      await update.mutateAsync({ id: characterId, portrait_url: null });
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsRemoving(false);
    }
  };

  return { upload, remove, isUploading, isRemoving, error };
}
