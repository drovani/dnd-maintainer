import { SectionHeader } from '@/components/character-sheet/SectionHeader';
import type { Character } from '@/types/database';
import { useTranslation } from 'react-i18next';

export function PersonalityPanel({ character, onEdit }: { character: Character; onEdit: () => void }) {
  const { t: tc } = useTranslation('common');

  return (
    <div className="sheet-panel">
      <SectionHeader title={tc('characterSheet.sections.personality')} onEdit={onEdit} />
      <div className="space-y-3 text-xs">
        {character.personality_traits && (
          <div>
            <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.traits')}</div>
            <p className="text-foreground">{character.personality_traits}</p>
          </div>
        )}
        {character.ideals && (
          <div>
            <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.ideals')}</div>
            <p className="text-foreground">{character.ideals}</p>
          </div>
        )}
        {character.bonds && (
          <div>
            <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.bonds')}</div>
            <p className="text-foreground">{character.bonds}</p>
          </div>
        )}
        {character.flaws && (
          <div>
            <div className="font-semibold text-muted-foreground mb-1">{tc('characterSheet.personality.flaws')}</div>
            <p className="text-foreground">{character.flaws}</p>
          </div>
        )}
      </div>
    </div>
  );
}
