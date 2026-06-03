import type { ToolProficiencyId } from '@/lib/dnd-helpers';

/**
 * Shared artisan tool ID list used by both backgrounds.ts and feats.ts.
 * Declared once here to avoid divergence between the two files.
 */
export const ARTISAN_TOOL_IDS: readonly ToolProficiencyId[] = [
  'smithstools',
  'brewersupplies',
  'masonstools',
  'calligrapherstools',
  'carpentertools',
  'cartographerstools',
  'cobblerstools',
  'cooksutensils',
  'glassblowerstools',
  'jewelerstools',
  'leatherworkerstools',
  'painterstools',
  'potterstools',
  'tinkerstools',
  'weaverstools',
  'woodcarverstools',
] as const satisfies readonly ToolProficiencyId[];

/**
 * Shared musical instrument ID list used by both backgrounds.ts and feats.ts.
 */
export const MUSICAL_INSTRUMENT_IDS: readonly ToolProficiencyId[] = [
  'bagpipes',
  'drum',
  'dulcimer',
  'flute',
  'lute',
  'lyre',
  'horn',
  'panflute',
  'shawm',
  'viol',
] as const satisfies readonly ToolProficiencyId[];
