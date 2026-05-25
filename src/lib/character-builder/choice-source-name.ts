import { parseChoiceKey, type ChoiceKey } from '@/types/choices';
import type { BackgroundId, ClassId, SpeciesId } from '@/lib/dnd-helpers';
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
  }
}
