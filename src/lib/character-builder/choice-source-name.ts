import { parseChoiceKey, type ChoiceKey } from '@/types/choices';
import type { BackgroundId, ClassId, RaceId } from '@/lib/dnd-helpers';
import type { TFunction } from 'i18next';

export function getChoiceSourceName(choiceKey: ChoiceKey, t: TFunction<'gamedata'>): string {
  const { origin, id } = parseChoiceKey(choiceKey);
  switch (origin) {
    case 'race':
      return t(`races.${id as RaceId}`);
    case 'background':
      return t(`backgrounds.${id as BackgroundId}`);
    case 'class':
      return t(`classes.${id as ClassId}`);
  }
}
