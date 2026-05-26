import type { BackgroundId, ClassId, SpeciesId } from '@/lib/dnd-helpers';
import { BACKGROUND_SOURCES, CLASS_SOURCES, SPECIES_SOURCES } from '@/lib/sources';
import type { Grant } from '@/types/grants';

// Choice-producing grant types whose presence guarantees a follow-up step.
const CHOICE_GRANT_TYPES = new Set<Grant['type']>([
  'ability-choice',
  'expertise-choice',
  'fighting-style-choice',
  'weapon-mastery-choice',
  'bundle-choice',
  'lineage-choice',
]);

// `proficiency-choice` categories that every option of a given kind already has
// (universal background noise), so they shouldn't trigger the indicator.
const UNIVERSAL_PROFICIENCY_CATEGORIES = {
  species: 'language',
  class: 'skill',
  background: null,
} as const;

type Kind = keyof typeof UNIVERSAL_PROFICIENCY_CATEGORIES;

function grantIsDistinguishingChoice(g: Grant, kind: Kind): boolean {
  if (CHOICE_GRANT_TYPES.has(g.type)) return true;
  if (g.type === 'proficiency-choice') {
    return g.category !== UNIVERSAL_PROFICIENCY_CATEGORIES[kind];
  }
  if (g.type === 'asi' && g.from !== null) return true;
  // Background origin feats always have sub-choices (Magic Initiate picks
  // cantrips/spell, Skilled picks 3 skills, etc.) and are distinctive per
  // background. Class/species feat grants are rare but treated the same.
  if (g.type === 'feat') return true;
  return false;
}

function grantsHaveDistinguishingChoice(grants: readonly Grant[], kind: Kind): boolean {
  return grants.some((g) => grantIsDistinguishingChoice(g, kind));
}

export function speciesHasLaterChoices(id: SpeciesId): boolean {
  const source = SPECIES_SOURCES.find((s) => s.id === id);
  return source ? grantsHaveDistinguishingChoice(source.grants, 'species') : false;
}

export function classHasLaterChoices(id: ClassId): boolean {
  const source = CLASS_SOURCES.find((c) => c.id === id);
  const level1 = source?.levels[0];
  return level1 ? grantsHaveDistinguishingChoice(level1.grants, 'class') : false;
}

export function backgroundHasLaterChoices(id: BackgroundId): boolean {
  const source = BACKGROUND_SOURCES.find((b) => b.id === id);
  return source ? grantsHaveDistinguishingChoice(source.grants, 'background') : false;
}
