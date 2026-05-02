import type { ClassId } from '@/lib/dnd-helpers';
import type { SubclassFeature, SubclassSource } from '@/types/sources';
import { createChoiceKey } from '@/types/choices';
import { FIGHTING_STYLE_IDS } from '@/lib/dnd-helpers';

export const SUBCLASS_IDS_BY_CLASS = {
  barbarian: ['berserker', 'wildheart', 'worldtree', 'zealot'],
  bard: ['collegedance', 'collegeglamour', 'collegelore', 'collegevalor'],
  cleric: ['lifedomain', 'lightdomain', 'trickerydomain', 'wardomain'],
  druid: ['circleland', 'circlemoon', 'circlesea', 'circlestars'],
  fighter: ['champion', 'battlemaster', 'eldritchknight', 'psiwarrior'],
  monk: ['warriorofmercy', 'warriorofshadow', 'warriorofelements', 'warrioropenhand'],
  paladin: ['oathofdevotion', 'oathofglory', 'oathofancients', 'oathofvengeance'],
  ranger: ['beastmaster', 'feywanderer', 'gloomstalker', 'hunter'],
  rogue: ['thief', 'assassin', 'arcanetrickster', 'soulknife'],
  sorcerer: ['aberrantsorcery', 'clockworksorcery', 'draconicsorcery', 'wildmagicsorcery'],
  warlock: ['archfeypatron', 'celestialpatron', 'fiendpatron', 'greatoldonepatron'],
  wizard: ['abjurer', 'diviner', 'evoker', 'illusionist'],
} as const satisfies Record<ClassId, readonly [string, string, string, string]>;

export type SubclassId = (typeof SUBCLASS_IDS_BY_CLASS)[ClassId][number];
export const SUBCLASS_IDS: readonly SubclassId[] = Object.values(SUBCLASS_IDS_BY_CLASS).flat() as SubclassId[];

export const SUBCLASS_SOURCES: Record<SubclassId, SubclassSource> = {
  // Barbarian
  berserker: { features: [] },
  wildheart: { features: [] },
  worldtree: { features: [] },
  zealot: { features: [] },
  // Bard
  collegedance: { features: [] },
  collegeglamour: { features: [] },
  collegelore: { features: [] },
  collegevalor: { features: [] },
  // Cleric
  lifedomain: { features: [] },
  lightdomain: { features: [] },
  trickerydomain: { features: [] },
  wardomain: { features: [] },
  // Druid
  circleland: { features: [] },
  circlemoon: { features: [] },
  circlesea: { features: [] },
  circlestars: { features: [] },
  // Fighter
  champion: {
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'champion-improved-critical' } }] },
      {
        classLevel: 7,
        grants: [
          { type: 'feature', feature: { id: 'champion-remarkable-athlete' } },
          {
            type: 'ability-check-bonus',
            abilities: ['str', 'dex', 'con'],
            value: 'half-proficiency',
            onlyWhenNotProficient: true,
            featureId: 'champion-remarkable-athlete',
          },
        ],
      },
      {
        classLevel: 10,
        grants: [
          {
            type: 'fighting-style-choice',
            key: createChoiceKey('fighting-style-choice', 'class', 'fighter', 1),
            count: 1,
            from: FIGHTING_STYLE_IDS,
          },
        ],
      },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'champion-superior-critical' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'champion-survivor' } }] },
    ] satisfies readonly SubclassFeature[],
  },
  battlemaster: {
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'battlemaster-combat-superiority' } }] },
      { classLevel: 7, grants: [{ type: 'feature', feature: { id: 'battlemaster-know-your-enemy' } }] },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'battlemaster-improved-combat-superiority' } }] },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'battlemaster-relentless' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'battlemaster-superior-combat-superiority' } }] },
    ],
  },
  eldritchknight: {
    features: [
      { classLevel: 3, grants: [{ type: 'feature', feature: { id: 'eldritchknight-spellcasting' } }] },
      { classLevel: 7, grants: [{ type: 'feature', feature: { id: 'eldritchknight-war-magic' } }] },
      { classLevel: 10, grants: [{ type: 'feature', feature: { id: 'eldritchknight-eldritch-strike' } }] },
      { classLevel: 15, grants: [{ type: 'feature', feature: { id: 'eldritchknight-arcane-charge' } }] },
      { classLevel: 18, grants: [{ type: 'feature', feature: { id: 'eldritchknight-improved-war-magic' } }] },
    ],
  },
  psiwarrior: { features: [] },
  // Monk
  warriorofmercy: { features: [] },
  warriorofshadow: { features: [] },
  warriorofelements: { features: [] },
  warrioropenhand: { features: [] },
  // Paladin
  oathofdevotion: { features: [] },
  oathofglory: { features: [] },
  oathofancients: { features: [] },
  oathofvengeance: { features: [] },
  // Ranger
  beastmaster: { features: [] },
  feywanderer: { features: [] },
  gloomstalker: { features: [] },
  hunter: { features: [] },
  // Rogue
  thief: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'feature', feature: { id: 'thief-fast-hands' } },
          { type: 'feature', feature: { id: 'thief-second-story-work' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'skill-expertise', skill: 'stealth' },
          { type: 'feature', feature: { id: 'thief-supreme-sneak' } },
        ],
      },
    ],
  },
  assassin: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'proficiency', category: 'tool', id: 'disguisekit' },
          { type: 'proficiency', category: 'tool', id: 'poisonerskit' },
          { type: 'feature', feature: { id: 'assassin-assassinate' } },
        ],
      },
      {
        classLevel: 9,
        grants: [
          { type: 'skill-expertise', skill: 'deception' },
          { type: 'feature', feature: { id: 'assassin-infiltration-expertise' } },
        ],
      },
    ],
  },
  arcanetrickster: {
    features: [
      {
        classLevel: 3,
        grants: [
          { type: 'spellcasting', ability: 'int', source: 'class' },
          { type: 'feature', feature: { id: 'arcanetrickster-mage-hand-legerdemain' } },
        ],
      },
      { classLevel: 9, grants: [{ type: 'feature', feature: { id: 'arcanetrickster-magical-ambush' } }] },
    ],
  },
  soulknife: { features: [] },
  // Sorcerer
  aberrantsorcery: { features: [] },
  clockworksorcery: { features: [] },
  draconicsorcery: { features: [] },
  wildmagicsorcery: { features: [] },
  // Warlock
  archfeypatron: { features: [] },
  celestialpatron: { features: [] },
  fiendpatron: { features: [] },
  greatoldonepatron: { features: [] },
  // Wizard
  abjurer: { features: [] },
  diviner: { features: [] },
  evoker: { features: [] },
  illusionist: { features: [] },
};

export const isSubclassId = (id: string): id is SubclassId => id in SUBCLASS_SOURCES;
