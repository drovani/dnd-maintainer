import { useMemo } from 'react';
import { useCampaign } from '@/hooks/useCampaigns';
import { filterBySourceBooks, type SourceBookId } from '@/lib/source-books';
import { SPECIES_SOURCES } from '@/lib/sources/species';
import { CLASS_SOURCES } from '@/lib/sources/classes';
import { SUBCLASS_SOURCES } from '@/lib/sources/subclasses';
import { BACKGROUND_SOURCES } from '@/lib/sources/backgrounds';
import { FEAT_SOURCES } from '@/lib/sources/feats';
import type {
  SpeciesSource,
  ClassSource,
  BackgroundSource,
  FeatSource,
  SubclassSource,
  SubclassId,
} from '@/lib/sources';

export interface GameData {
  readonly species: readonly SpeciesSource[];
  readonly classes: readonly ClassSource[];
  readonly backgrounds: readonly BackgroundSource[];
  readonly feats: readonly FeatSource[];
  readonly subclasses: Readonly<Record<SubclassId, SubclassSource>>;
  readonly allowedSourceBooks: readonly SourceBookId[];
}

const DEFAULT_ALLOWED: readonly SourceBookId[] = ['phb-2024'];

export function useGameData(campaignSlug: string | undefined): GameData {
  const { data: campaign } = useCampaign(campaignSlug);
  // Use the campaign's source book list, or fall back to the default.
  // Spread into a stable reference so useMemo's dep comparison works correctly:
  // campaign?.allowed_source_books is a new array ref on every query result, so we
  // join it into a string key for memoization stability.
  const allowedSourceBooks = campaign?.allowed_source_books ?? DEFAULT_ALLOWED;
  const allowedKey = allowedSourceBooks.join(',');

  return useMemo<GameData>((): GameData => {
    // Re-derive `allowed` inside the memo so we have a typed readonly array.
    const allowed: readonly SourceBookId[] = allowedKey ? (allowedKey.split(',') as SourceBookId[]) : DEFAULT_ALLOWED;

    const species = filterBySourceBooks(SPECIES_SOURCES, allowed);
    const classes = filterBySourceBooks(CLASS_SOURCES, allowed);
    const backgrounds = filterBySourceBooks(BACKGROUND_SOURCES, allowed);
    const feats = filterBySourceBooks(FEAT_SOURCES, allowed);
    const subclasses = Object.fromEntries(
      Object.entries(SUBCLASS_SOURCES).filter(([, v]) => allowed.includes(v.sourceBook ?? 'phb-2024'))
    ) as Record<SubclassId, SubclassSource>;

    return { species, classes, backgrounds, feats, subclasses, allowedSourceBooks: allowed };
    // allowedKey is a stable string representation of the source book list
     
  }, [allowedKey]);
}
