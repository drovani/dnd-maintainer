import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCharacterContext } from '@/hooks/useCharacterContext';
import { useTranslation } from 'react-i18next';

export function BackstoryStep() {
  const { t } = useTranslation('common');
  const context = useCharacterContext();
  const { character } = context;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="personality">{t('characterSheet.fields.personalityTraits')}</Label>
        <Textarea
          id="personality"
          value={character.personality_traits ?? ''}
          onChange={(e) => context.updateCharacter({ personality_traits: e.target.value })}
          placeholder={t('characterBuilder.placeholders.personalityTraits')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ideals">{t('characterSheet.personality.ideals')}</Label>
        <Textarea
          id="ideals"
          value={character.ideals ?? ''}
          onChange={(e) => context.updateCharacter({ ideals: e.target.value })}
          placeholder={t('characterBuilder.placeholders.ideals')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bonds">{t('characterSheet.personality.bonds')}</Label>
        <Textarea
          id="bonds"
          value={character.bonds ?? ''}
          onChange={(e) => context.updateCharacter({ bonds: e.target.value })}
          placeholder={t('characterBuilder.placeholders.bonds')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="flaws">{t('characterSheet.personality.flaws')}</Label>
        <Textarea
          id="flaws"
          value={character.flaws ?? ''}
          onChange={(e) => context.updateCharacter({ flaws: e.target.value })}
          placeholder={t('characterBuilder.placeholders.flaws')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appearance">{t('characterSheet.sections.appearance')}</Label>
        <Textarea
          id="appearance"
          value={character.appearance ?? ''}
          onChange={(e) => context.updateCharacter({ appearance: e.target.value })}
          placeholder={t('characterBuilder.placeholders.appearance')}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="backstory">{t('characterSheet.sections.backstory')}</Label>
        <Textarea
          id="backstory"
          value={character.backstory ?? ''}
          onChange={(e) => context.updateCharacter({ backstory: e.target.value })}
          placeholder={t('characterBuilder.placeholders.backstory')}
        />
      </div>
    </div>
  );
}
