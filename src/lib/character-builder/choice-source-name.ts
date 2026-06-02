import { parseChoiceKey, type ChoiceKey } from '@/types/choices';
import type { BackgroundId, ClassId, FeatId, SpeciesId } from '@/lib/dnd-helpers';
import type { SubclassId } from '@/lib/sources/subclasses';
import type { TFunction } from 'i18next';

export function getChoiceSourceName(choiceKey: ChoiceKey, t: TFunction<'gamedata'>): string {
  const { origin, id } = parseChoiceKey(choiceKey);
  switch (origin) {
    case 'species':
      return t(`species.${id as SpeciesId}`);
    case 'background':
      return t(`backgrounds.${id as BackgroundId}`);
    case 'class':
      return t(`classes.${id as ClassId}`);
    case 'subclass':
      return t(`subclasses.${id as SubclassId}.name`);
    case 'feat':
      return t(`feats.${id as FeatId}.name`, { defaultValue: id });
  }
}
