import { SectionHeader } from '@/components/character-sheet/SectionHeader';
import type { Character } from '@/types/database';
import { useTranslation } from 'react-i18next';

export function BackstoryPanel({
  character,
  onEditBackstory,
  onEditAppearance,
}: {
  character: Character;
  onEditBackstory: () => void;
  onEditAppearance: () => void;
}) {
  const { t: tc } = useTranslation('common');

  return (
    <>
      {character.backstory && (
        <div className="sheet-panel">
          <SectionHeader title={tc('characterSheet.sections.backstory')} onEdit={onEditBackstory} />
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{character.backstory}</p>
        </div>
      )}

      {character.appearance && (
        <div className="sheet-panel mt-6">
          <SectionHeader title={tc('characterSheet.sections.appearance')} onEdit={onEditAppearance} />
          <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">{character.appearance}</p>
        </div>
      )}
    </>
  );
}
