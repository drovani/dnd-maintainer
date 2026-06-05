import type { TFunction } from 'i18next';
import type { SourceTag } from '@/types/sources';
import { getBundleNameKey } from '@/lib/sources/bundles';
import { getItemNameKey } from '@/lib/sources/items';

/**
 * Resolve a user-friendly display name for a grant source (race name, class name,
 * background name, bundle/item name, etc.) using the gamedata namespace.
 *
 * Lives in a React-free module so pure-logic consumers (e.g. the PDF export in
 * `pdf-field-map.ts`) can attribute a grant to its source without pulling the
 * React + icon dependencies of `class-icons.tsx` into their module graph.
 */
export function getSourceDisplayName(source: SourceTag, tGamedata: TFunction<'gamedata'>): string {
  switch (source.origin) {
    case 'species':
      return tGamedata(`species.${source.id}`, { defaultValue: source.id });
    case 'class':
      return tGamedata(`classes.${source.id}`, { defaultValue: source.id });
    case 'subclass':
      return tGamedata(`subclasses.${source.id}.name`, { defaultValue: source.id });
    case 'background':
      return tGamedata(`backgrounds.${source.id}`, { defaultValue: source.id });
    case 'feat':
      return tGamedata(`feats.${source.id}.name`, { defaultValue: source.id });
    case 'item':
      return tGamedata(getItemNameKey('gear', source.id), { defaultValue: source.id });
    case 'bundle':
      return tGamedata(getBundleNameKey(source.id), { defaultValue: source.id });
    case 'pack':
      return tGamedata(getItemNameKey('pack', source.id), { defaultValue: source.id });
    case 'loot':
      return source.description;
  }
}
